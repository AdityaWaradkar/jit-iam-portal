from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_writer import audit_writer
from app.db.models import AuditEvent


async def record_event(
    db: AsyncSession,
    event_type: str,
    actor_id: UUID | None = None,
    request_id: UUID | None = None,
    lease_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> AuditEvent:
    """Insert an audit event and enqueue it for the JSONL writer."""
    event = AuditEvent(
        event_type=event_type,
        actor_id=actor_id,
        request_id=request_id,
        lease_id=lease_id,
        payload=payload or {},
    )
    db.add(event)
    await db.flush()

    audit_writer.enqueue(
        {
            "id": str(event.id),
            "event_type": event.event_type,
            "actor_id": str(event.actor_id) if event.actor_id else None,
            "request_id": str(event.request_id) if event.request_id else None,
            "lease_id": str(event.lease_id) if event.lease_id else None,
            "payload": event.payload,
            "created_at": datetime.now(UTC).isoformat(),
        }
    )

    return event