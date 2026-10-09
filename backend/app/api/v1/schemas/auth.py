from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    # Password is intentionally accepted but not verified in demo mode.
    password: str = Field(default="demo", min_length=1)


class PersonaSummary(BaseModel):
    id: UUID
    email: str
    full_name: str
    persona: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: PersonaSummary


class MeResponse(BaseModel):
    user: PersonaSummary