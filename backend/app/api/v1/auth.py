
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    PersonaSummary,
)
from app.core.audit_types import AuditEventType
from app.core.config import get_settings
from app.core.security import create_access_token
from app.db.models import AuditEvent, User
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_summary(user: User) -> PersonaSummary:
    return PersonaSummary(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        persona=user.persona.value,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """Demo login. Any password is accepted for existing users."""
    settings = get_settings()

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown or inactive user",
        )

    token = create_access_token(
        user_id=user.id,
        persona=user.persona.value,
        expires_minutes=settings.jwt_expires_minutes,
    )

    db.add(
        AuditEvent(
            event_type=AuditEventType.USER_LOGGED_IN,
            actor_id=user.id,
            payload={"email": user.email, "persona": user.persona.value},
        )
    )
    await db.commit()

    return LoginResponse(
        access_token=token,
        expires_in_minutes=settings.jwt_expires_minutes,
        user=_to_summary(user),
    )


@router.get("/me", response_model=MeResponse)
async def me(user: CurrentUser) -> MeResponse:
    return MeResponse(user=_to_summary(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user: CurrentUser) -> None:
    """Client-side logout. The token is discarded on the frontend.

    A future section could maintain a server-side revocation list.
    """
    return None