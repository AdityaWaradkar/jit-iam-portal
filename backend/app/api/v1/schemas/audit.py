from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AuditEventRead(BaseModel):
    id: UUID
    event_type: str
    actor_id: UUID | None
    actor_name: str | None
    request_id: UUID | None
    lease_id: UUID | None
    payload: dict[str, Any]
    created_at: datetime


class AuditEventList(BaseModel):
    items: list[AuditEventRead]
    total: int
    limit: int
    offset: int


class AuditTypeCount(BaseModel):
    event_type: str
    count: int


class AuditStats(BaseModel):
    total_events: int
    first_event_at: datetime | None
    last_event_at: datetime | None
    by_type: list[AuditTypeCount]