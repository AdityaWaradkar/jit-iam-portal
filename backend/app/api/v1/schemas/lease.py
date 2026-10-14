from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LeaseRead(BaseModel):
    id: UUID
    request_id: UUID
    user_id: UUID
    access_key_id: str
    assumed_role_arn: str | None
    assumed_role_name: str | None
    issued_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    status: str

    model_config = {"from_attributes": True}


class LeaseList(BaseModel):
    items: list[LeaseRead]
    total: int