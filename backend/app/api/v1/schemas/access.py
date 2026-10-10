from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ValidationInfo

from app.db.models import Environment, RequestStatus

# A conservative duration cap. Individual policies in Section 8 may
# enforce stricter limits per environment.
MAX_DURATION_MINUTES = 8 * 60  # 8 hours


# Whitelist of allowed roles per environment. Both the frontend and the
# backend use this to prevent nonsense combinations.
ALLOWED_ROLES: dict[Environment, list[str]] = {
    Environment.DEVELOPMENT: [
        "ECS-ReadOnly",
        "ECS-Developer",
        "DatabaseReader",
    ],
    Environment.STAGING: [
        "ECS-ReadOnly",
        "ECS-Developer",
        "DatabaseReader",
        "DatabaseWriter",
    ],
    Environment.PRODUCTION: [
        "ECS-ReadOnly",
        "ECS-Prod-BreakGlass",
    ],
    Environment.PRODUCTION_DB: [
        "DatabaseReader",
        "DatabaseWriter",
    ],
}


class AccessRequestCreate(BaseModel):
    environment: Environment
    requested_role: str = Field(min_length=1, max_length=128)
    duration_minutes: int = Field(ge=1, le=MAX_DURATION_MINUTES)
    justification: str = Field(min_length=10, max_length=2000)

    @field_validator("requested_role")
    @classmethod
    def role_must_be_allowed_for_environment(
        cls, value: str, info: ValidationInfo
    ) -> str:
        environment = info.data.get("environment")
        if environment is None:
            return value
        allowed = ALLOWED_ROLES.get(environment, [])
        if value not in allowed:
            raise ValueError(
                f"Role '{value}' is not valid for environment "
                f"'{environment.value}'. Allowed roles: {allowed}"
            )
        return value


class AccessRequestRead(BaseModel):
    id: UUID
    requester_id: UUID
    environment: Environment
    requested_role: str
    duration_minutes: int
    justification: str
    status: RequestStatus
    policy_decision: str | None
    policy_reason: str | None
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AccessRequestList(BaseModel):
    items: list[AccessRequestRead]
    total: int