from datetime import UTC, datetime
from uuid import UUID

import structlog
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_types import AuditEventType
from app.db.models import AccessRequest, AuditEvent, RequestStatus

logger = structlog.get_logger(__name__)


ALLOWED_TRANSITIONS: dict[RequestStatus, set[RequestStatus]] = {
    RequestStatus.PENDING: {
        RequestStatus.APPROVED,
        RequestStatus.DENIED,
        RequestStatus.EXPIRED,
    },
    RequestStatus.AUTO_APPROVED: {
        RequestStatus.EXPIRED,
        RequestStatus.REVOKED,
    },
    RequestStatus.APPROVED: {
        RequestStatus.EXPIRED,
        RequestStatus.REVOKED,
    },
    RequestStatus.DENIED: set(),
    RequestStatus.EXPIRED: set(),
    RequestStatus.REVOKED: set(),
}


TRANSITION_AUDIT_EVENT: dict[RequestStatus, str] = {
    RequestStatus.APPROVED: AuditEventType.REQUEST_APPROVED,
    RequestStatus.DENIED: AuditEventType.REQUEST_DENIED,
    RequestStatus.EXPIRED: AuditEventType.LEASE_EXPIRED,
    RequestStatus.REVOKED: AuditEventType.LEASE_REVOKED,
}


def is_transition_allowed(current: RequestStatus, target: RequestStatus) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, set())


async def transition_request(
    db: AsyncSession,
    request: AccessRequest,
    target: RequestStatus,
    actor_id: UUID | None,
    reason: str | None = None,
) -> AccessRequest:
    """Move a request to a new status, enforcing the state machine."""
    current = request.status

    if current == target:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request is already in status '{target.value}'.",
        )

    if not is_transition_allowed(current, target):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot transition request from '{current.value}' "
                f"to '{target.value}'."
            ),
        )

    now = datetime.now(UTC)
    request.status = target

    if current == RequestStatus.PENDING and target != RequestStatus.PENDING:
        request.decided_at = now

    event_type = TRANSITION_AUDIT_EVENT.get(target)
    if event_type is not None:
        db.add(
            AuditEvent(
                event_type=event_type,
                actor_id=actor_id,
                request_id=request.id,
                payload={
                    "from_status": current.value,
                    "to_status": target.value,
                    "reason": reason,
                },
            )
        )

    logger.info(
        "request_transitioned",
        request_id=str(request.id),
        from_status=current.value,
        to_status=target.value,
        actor_id=str(actor_id) if actor_id else None,
    )

    await db.commit()
    await db.refresh(request)
    return request