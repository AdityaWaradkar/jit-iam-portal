from typing import Literal

from pydantic import BaseModel, Field


class TerminalRequest(BaseModel):
    access_key_id: str = Field(min_length=1, max_length=128)
    secret_access_key: str = Field(min_length=1, max_length=256)
    session_token: str = Field(default="", max_length=4096)
    command: str = Field(min_length=1, max_length=1024)


class TerminalResponse(BaseModel):
    exit_code: int
    stdout: str
    stderr: str


class CredentialCheck(BaseModel):
    status: Literal["valid", "expired", "revoked", "invalid"]
    assumed_role_arn: str | None = None
    access_key_id: str | None = None