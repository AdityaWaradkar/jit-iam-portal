from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class ZeroStandingPrivilegesStatus(BaseModel):
    active_leases: int
    zero_standing: bool
    message: str


class ElevationDay(BaseModel):
    day: date
    count: int
    by_environment: dict[str, int]


class TopRequester(BaseModel):
    actor_id: UUID
    actor_name: str
    request_count: int


class RecentCredential(BaseModel):
    lease_id: UUID
    access_key_id: str
    assumed_role_name: str | None
    issued_at: datetime
    expires_at: datetime
    user_name: str


class DecisionLatency(BaseModel):
    sample_size: int
    average_seconds: float | None
    p50_seconds: float | None
    p95_seconds: float | None


class SecurityOverview(BaseModel):
    zsp: ZeroStandingPrivilegesStatus
    elevations_last_seven_days: list[ElevationDay]
    top_requesters: list[TopRequester]
    recent_credentials: list[RecentCredential]
    decision_latency: DecisionLatency
    generated_at: datetime