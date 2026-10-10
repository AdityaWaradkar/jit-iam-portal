from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.access import AccessRequestCreate
from app.core.audit_types import AuditEventType
from app.db.models import (
    AccessRequest,
    AuditEvent,
    RequestStatus,
    User,
)


async def create_access_request(
    db: AsyncSession,
    requester: User,
    payload: AccessRequestCreate,
) -> AccessRequest:
    request = AccessRequest(
        requester_id=requester.id,
        environment=payload.environment,
        requested_role=payload.requested_role,
        duration_minutes=payload.duration_minutes,
        justification=payload.justification,
        status=RequestStatus.PENDING,
    )
    db.add(request)
    await db.flush()  # assigns the id

    db.add(
        AuditEvent(
            event_type=AuditEventType.REQUEST_CREATED,
            actor_id=requester.id,
            request_id=request.id,
            payload={
                "environment": payload.environment.value,
                "requested_role": payload.requested_role,
                "duration_minutes": payload.duration_minutes,
            },
        )
    )
    await db.commit()
    await db.refresh(request)
    return request


async def list_requests_for_user(
    db: AsyncSession,
    user_id: UUID,
) -> list[AccessRequest]:
    result = await db.execute(
        select(AccessRequest)
        .where(AccessRequest.requester_id == user_id)
        .order_by(AccessRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_request(
    db: AsyncSession,
    request_id: UUID,
) -> AccessRequest | None:
    result = await db.execute(
        select(AccessRequest).where(AccessRequest.id == request_id)
    )
    return result.scalar_one_or_none()