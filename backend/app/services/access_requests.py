from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.v1.schemas.access import AccessRequestCreate
from app.core.audit_types import AuditEventType
from app.core.credentials import CredentialError, IssuedCredential, get_issuer
from app.core.opa import evaluate_access_request
from app.db.models import (
    AccessRequest,
    AuditEvent,
    Lease,
    LeaseStatus,
    RequestStatus,
    User,
)

_DECISION_TO_STATUS: dict[str, RequestStatus] = {
    "allow": RequestStatus.AUTO_APPROVED,
    "requires_approval": RequestStatus.PENDING,
    "deny": RequestStatus.DENIED,
}


async def create_access_request(
    db: AsyncSession,
    requester: User,
    payload: AccessRequestCreate,
) -> AccessRequest:
    # 1. Evaluate policy
    policy_input = {
        "environment": payload.environment.value,
        "requested_role": payload.requested_role,
        "duration_minutes": payload.duration_minutes,
        "justification": payload.justification,
        "requester_persona": requester.persona.value,
    }
    decision = await evaluate_access_request(policy_input)

    # 2. Map decision to status
    status_value = _DECISION_TO_STATUS.get(
        decision.decision, RequestStatus.PENDING
    )

    # 3. Persist the request
    request = AccessRequest(
        requester_id=requester.id,
        environment=payload.environment,
        requested_role=payload.requested_role,
        duration_minutes=payload.duration_minutes,
        justification=payload.justification,
        status=status_value,
        policy_decision=decision.decision,
        policy_reason=decision.reason,
    )
    db.add(request)
    await db.flush()

    # 4. Audit events
    db.add(
        AuditEvent(
            event_type=AuditEventType.REQUEST_CREATED,
            actor_id=requester.id,
            request_id=request.id,
            payload={
                "environment": payload.environment.value,
                "requested_role": payload.requested_role,
                "duration_minutes": payload.duration_minutes,
            },
        )
    )
    db.add(
        AuditEvent(
            event_type=AuditEventType.POLICY_EVALUATED,
            actor_id=requester.id,
            request_id=request.id,
            payload={
                "decision": decision.decision,
                "reason": decision.reason,
            },
        )
    )

    if status_value == RequestStatus.AUTO_APPROVED:
        db.add(
            AuditEvent(
                event_type=AuditEventType.REQUEST_AUTO_APPROVED,
                actor_id=requester.id,
                request_id=request.id,
                payload={"decision": decision.decision},
            )
        )
    elif status_value == RequestStatus.DENIED:
        db.add(
            AuditEvent(
                event_type=AuditEventType.REQUEST_DENIED,
                actor_id=requester.id,
                request_id=request.id,
                payload={"reason": decision.reason},
            )
        )

    await db.commit()
    await db.refresh(request)
    return request


async def list_requests_for_user(
    db: AsyncSession,
    user_id: UUID,
) -> list[AccessRequest]:
    result = await db.execute(
        select(AccessRequest)
        .where(AccessRequest.requester_id == user_id)
        .order_by(AccessRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_request(
    db: AsyncSession,
    request_id: UUID,
) -> AccessRequest | None:
    result = await db.execute(
        select(AccessRequest).where(AccessRequest.id == request_id)
    )
    return result.scalar_one_or_none()


async def list_pending_requests(
    db: AsyncSession,
) -> list[AccessRequest]:
    """Return every PENDING request across all users, oldest first.

    The requester is eager-loaded so the caller can build the pending
    queue response without an extra query per row.
    """
    result = await db.execute(
        select(AccessRequest)
        .options(joinedload(AccessRequest.requester))
        .where(AccessRequest.status == RequestStatus.PENDING)
        .order_by(AccessRequest.created_at.asc())
    )
    return list(result.scalars().all())


async def issue_credential_for_request(
    db: AsyncSession,
    request: AccessRequest,
    actor_id: UUID,
) -> tuple[Lease, IssuedCredential]:
    """Issue ephemeral credentials for an approved request.

    Writes a Lease row, a credential.issued audit event, and returns
    the lease plus the plaintext credential.
    """
    if request.status not in (
        RequestStatus.APPROVED,
        RequestStatus.AUTO_APPROVED,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot issue credentials for a request in "
                f"'{request.status.value}' status."
            ),
        )

    # If a lease already exists for this request, refuse to issue again.
    existing = await db.execute(
        select(Lease).where(Lease.request_id == request.id)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Credentials have already been issued for this request.",
        )

    issuer = get_issuer()
    try:
        credential = issuer.issue(
            requested_role=request.requested_role,
            duration_minutes=request.duration_minutes,
            requested_by=str(request.requester_id),
        )
    except CredentialError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    lease = Lease(
        request_id=request.id,
        user_id=request.requester_id,
        access_key_id=credential.access_key_id,
        secret_access_key_hash=credential.secret_access_key_hash,
        session_token_hash=credential.session_token_hash,
        assumed_role_arn=credential.assumed_role.role_arn,
        assumed_role_name=credential.assumed_role.role_name,
        issued_at=datetime.now(UTC),
        expires_at=credential.expires_at,
        status=LeaseStatus.ACTIVE,
    )
    db.add(lease)
    await db.flush()

    db.add(
        AuditEvent(
            event_type=AuditEventType.CREDENTIAL_ISSUED,
            actor_id=actor_id,
            request_id=request.id,
            lease_id=lease.id,
            payload={
                "access_key_id": credential.access_key_id,
                "duration_minutes": request.duration_minutes,
                "expires_at": credential.expires_at.isoformat(),
            },
        )
    )

    await db.commit()
    await db.refresh(lease)
    return lease, credential

async def list_leases_for_user(
    db: AsyncSession,
    user_id: UUID,
) -> list[Lease]:
    result = await db.execute(
        select(Lease)
        .where(Lease.user_id == user_id)
        .order_by(Lease.issued_at.desc())
    )
    return list(result.scalars().all())


async def get_lease(
    db: AsyncSession,
    lease_id: UUID,
) -> Lease | None:
    result = await db.execute(
        select(Lease).where(Lease.id == lease_id)
    )
    return result.scalar_one_or_none()