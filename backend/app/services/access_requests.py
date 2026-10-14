from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.v1.schemas.access import AccessRequestCreate
from app.core.audit_types import AuditEventType
from app.core.opa import evaluate_access_request
from app.db.models import (
    AccessRequest,
    AuditEvent,
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
    status = _DECISION_TO_STATUS.get(decision.decision, RequestStatus.PENDING)

    # 3. Persist the request
    request = AccessRequest(
        requester_id=requester.id,
        environment=payload.environment,
        requested_role=payload.requested_role,
        duration_minutes=payload.duration_minutes,
        justification=payload.justification,
        status=status,
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

    if status == RequestStatus.AUTO_APPROVED:
        db.add(
            AuditEvent(
                event_type=AuditEventType.REQUEST_AUTO_APPROVED,
                actor_id=requester.id,
                request_id=request.id,
                payload={"decision": decision.decision},
            )
        )
    elif status == RequestStatus.DENIED:
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