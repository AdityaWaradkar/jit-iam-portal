from datetime import UTC, datetime
from uuid import UUID

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_types import AuditEventType
from app.db.models import (
    AccessRequest,
    AuditEvent,
    Lease,
    LeaseStatus,
    RequestStatus,
)
from app.services.state_machine import transition_request

logger = structlog.get_logger(__name__)


async def expire_due_leases(db: AsyncSession) -> int:
    """Mark expired leases and transition their requests.

    Returns the number of leases that were expired in this sweep.
    """
    now = datetime.now(UTC)

    result = await db.execute(
        select(Lease)
        .where(
            Lease.status == LeaseStatus.ACTIVE,
            Lease.expires_at <= now,
        )
        .order_by(Lease.expires_at.asc())
    )
    due = list(result.scalars().all())

    if not due:
        return 0

    for lease in due:
        lease.status = LeaseStatus.EXPIRED
        lease.revoked_at = now

        db.add(
            AuditEvent(
                event_type=AuditEventType.LEASE_EXPIRED,
                actor_id=None,
                request_id=lease.request_id,
                lease_id=lease.id,
                payload={
                    "access_key_id": lease.access_key_id,
                    "expired_at": now.isoformat(),
                    "expires_at": lease.expires_at.isoformat(),
                },
            )
        )

        await _transition_request_if_possible(db, lease.request_id)

        logger.info(
            "lease_expired",
            lease_id=str(lease.id),
            request_id=str(lease.request_id),
            access_key_id=lease.access_key_id,
        )

    await db.commit()
    return len(due)


async def _transition_request_if_possible(
    db: AsyncSession,
    request_id: UUID,
) -> None:
    """Move the associated request to EXPIRED if the transition is allowed.

    A request may already be in a terminal state (for example if the user
    revoked it), in which case the transition is skipped without error.
    """
    result = await db.execute(
        select(AccessRequest).where(AccessRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    if request is None:
        return

    if request.status not in (
        RequestStatus.APPROVED,
        RequestStatus.AUTO_APPROVED,
    ):
        return

    try:
        await transition_request(
            db=db,
            request=request,
            target=RequestStatus.EXPIRED,
            actor_id=None,
            reason="Lease expired automatically at the end of its TTL.",
        )
    except Exception as exc:
        # transition_request raises HTTPException on illegal transitions.
        # The worker logs and continues; it never crashes the sweep.
        logger.warning(
            "request_transition_skipped",
            request_id=str(request_id),
            error=str(exc),
        )