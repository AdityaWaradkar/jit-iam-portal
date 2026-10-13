from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class RecentEvent(BaseModel):
    id: UUID
    event_type: str
    request_id: UUID | None
    created_at: datetime


class DashboardSummary(BaseModel):
    total_requests: int
    requests_by_status: list[StatusCount]
    active_leases: int
    pending_approvals: int
    average_decision_seconds: float | None
    recent_events: list[RecentEvent]
    generated_at: datetime