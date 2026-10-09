from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
from jwt import InvalidTokenError

from app.core.config import get_settings

ALGORITHM = "HS256"


class TokenError(Exception):
    """Raised when a JWT cannot be decoded or has expired."""


def create_access_token(
    user_id: UUID,
    persona: str,
    expires_minutes: int | None = None,
) -> str:
    settings = get_settings()
    minutes = expires_minutes or settings.jwt_expires_minutes

    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "persona": persona,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except InvalidTokenError as exc:
        raise TokenError(str(exc)) from exc