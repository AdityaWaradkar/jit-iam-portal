from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.api.v1.schemas.dashboard import (
    DashboardSummary,
    RecentEvent,
    StatusCount,
)
from app.db.models import (
    AccessRequest,
    AuditEvent,
    Lease,
    LeaseStatus,
    RequestStatus,
)

RECENT_EVENTS_LIMIT = 8


async def build_summary(
    db: AsyncSession,
    user_id: UUID,
) -> DashboardSummary:
    # Total requests
    total_requests = await _scalar_count(
        db,
        select(func.count(AccessRequest.id)).where(
            AccessRequest.requester_id == user_id
        ),
    )

    # Requests grouped by status
    status_rows = await db.execute(
        select(AccessRequest.status, func.count(AccessRequest.id))
        .where(AccessRequest.requester_id == user_id)
        .group_by(AccessRequest.status)
    )
    counts_by_status = {row[0]: row[1] for row in status_rows}

    requests_by_status: list[StatusCount] = []
    for status in RequestStatus:
        requests_by_status.append(
            StatusCount(
                status=status.value,
                count=counts_by_status.get(status, 0),
            )
        )

    # Active leases for the current user
    active_leases = await _scalar_count(
        db,
        select(func.count(Lease.id)).where(
            Lease.user_id == user_id,
            Lease.status == LeaseStatus.ACTIVE,
        ),
    )

    # Pending approvals across all users (approvers care about these)
    pending_approvals = await _scalar_count(
        db,
        select(func.count(AccessRequest.id)).where(
            AccessRequest.status == RequestStatus.PENDING
        ),
    )

    # Average decision time for requests that have left PENDING
    avg_row = await db.execute(
        select(
            func.avg(
                func.extract(
                    "epoch",
                    AccessRequest.decided_at - AccessRequest.created_at,
                )
            )
        ).where(
            AccessRequest.requester_id == user_id,
            AccessRequest.decided_at.is_not(None),
            AccessRequest.decided_at > AccessRequest.created_at,
        )
    )
    
    avg_value = avg_row.scalar()
    average_decision_seconds = (
        float(avg_value) if avg_value is not None else None
    )

    # Recent audit events for the current user
    events_result = await db.execute(
        select(AuditEvent)
        .where(AuditEvent.actor_id == user_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(RECENT_EVENTS_LIMIT)
    )
    events = list(events_result.scalars().all())

    recent_events = [
        RecentEvent(
            id=event.id,
            event_type=event.event_type,
            request_id=event.request_id,
            created_at=event.created_at,
        )
        for event in events
    ]

    return DashboardSummary(
        total_requests=total_requests,
        requests_by_status=requests_by_status,
        active_leases=active_leases,
        pending_approvals=pending_approvals,
        average_decision_seconds=average_decision_seconds,
        recent_events=recent_events,
        generated_at=datetime.now(UTC),
    )


async def _scalar_count(db: AsyncSession, stmt: Select[Any]) -> int:
    result = await db.execute(stmt)
    value = result.scalar()
    return int(value or 0)