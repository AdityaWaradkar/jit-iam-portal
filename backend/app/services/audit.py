from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.audit import (
    AuditEventRead,
    AuditStats,
    AuditTypeCount,
)
from app.db.models import AuditEvent, User


async def list_events(
    db: AsyncSession,
    limit: int,
    offset: int,
    event_type: str | None = None,
    actor_id: UUID | None = None,
    request_id: UUID | None = None,
    lease_id: UUID | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
) -> tuple[list[AuditEventRead], int]:
    base = select(AuditEvent)
    filters = []

    if event_type:
        filters.append(AuditEvent.event_type == event_type)
    if actor_id:
        filters.append(AuditEvent.actor_id == actor_id)
    if request_id:
        filters.append(AuditEvent.request_id == request_id)
    if lease_id:
        filters.append(AuditEvent.lease_id == lease_id)
    if since:
        filters.append(AuditEvent.created_at >= since)
    if until:
        filters.append(AuditEvent.created_at <= until)

    if filters:
        base = base.where(*filters)

    count_query = select(func.count()).select_from(base.subquery())
    count_result = await db.execute(count_query)
    total = int(count_result.scalar() or 0)

    query = (
        base.order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    rows = list(result.scalars().all())

    actor_ids = {row.actor_id for row in rows if row.actor_id is not None}
    actor_names: dict[UUID, str] = {}
    if actor_ids:
        users_result = await db.execute(
            select(User.id, User.full_name).where(User.id.in_(actor_ids))
        )
        for uid, name in users_result.all():
            actor_names[uid] = name

    items = [
        AuditEventRead(
            id=row.id,
            event_type=row.event_type,
            actor_id=row.actor_id,
            actor_name=actor_names.get(row.actor_id) if row.actor_id else None,
            request_id=row.request_id,
            lease_id=row.lease_id,
            payload=row.payload,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return items, total


async def get_event(
    db: AsyncSession,
    event_id: UUID,
) -> AuditEventRead | None:
    result = await db.execute(
        select(AuditEvent).where(AuditEvent.id == event_id)
    )
    row = result.scalar_one_or_none()
    if row is None:
        return None

    actor_name: str | None = None
    if row.actor_id is not None:
        user_result = await db.execute(
            select(User.full_name).where(User.id == row.actor_id)
        )
        actor_name = user_result.scalar_one_or_none()

    return AuditEventRead(
        id=row.id,
        event_type=row.event_type,
        actor_id=row.actor_id,
        actor_name=actor_name,
        request_id=row.request_id,
        lease_id=row.lease_id,
        payload=row.payload,
        created_at=row.created_at,
    )


async def get_stats(db: AsyncSession) -> AuditStats:
    total_result = await db.execute(
        select(func.count()).select_from(AuditEvent)
    )
    total_events = int(total_result.scalar() or 0)

    range_result = await db.execute(
        select(
            func.min(AuditEvent.created_at),
            func.max(AuditEvent.created_at),
        )
    )
    first, last = range_result.one()

    type_result = await db.execute(
        select(AuditEvent.event_type, func.count(AuditEvent.id))
        .group_by(AuditEvent.event_type)
        .order_by(func.count(AuditEvent.id).desc())
    )
    by_type = [
        AuditTypeCount(event_type=row[0], count=int(row[1]))
        for row in type_result.all()
    ]

    return AuditStats(
        total_events=total_events,
        first_event_at=first,
        last_event_at=last,
        by_type=by_type,
    )


async def stream_events(
    db: AsyncSession,
) -> AsyncIterator[dict[str, Any]]:
    """Yield every audit event as a dictionary, oldest first.

    Used by the export endpoint. Streams in batches to bound memory use.
    """
    batch_size = 500
    offset = 0

    while True:
        result = await db.execute(
            select(AuditEvent)
            .order_by(AuditEvent.created_at.asc())
            .limit(batch_size)
            .offset(offset)
        )
        rows = list(result.scalars().all())
        if not rows:
            break

        for row in rows:
            yield {
                "id": str(row.id),
                "event_type": row.event_type,
                "actor_id": str(row.actor_id) if row.actor_id else None,
                "request_id": str(row.request_id) if row.request_id else None,
                "lease_id": str(row.lease_id) if row.lease_id else None,
                "payload": row.payload,
                "created_at": row.created_at.isoformat(),
            }

        offset += len(rows)
        if len(rows) < batch_size:
            break