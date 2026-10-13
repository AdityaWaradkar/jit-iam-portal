from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_persona
from app.api.v1.schemas.access import AccessRequestRead, ApprovalAction
from app.db.models import AccessRequest, PersonaRole, RequestStatus, User
from app.db.session import get_db
from app.services.access_requests import get_request
from app.services.state_machine import transition_request

router = APIRouter(prefix="/access", tags=["access"])


async def _load_request_or_404(db: AsyncSession, request_id: UUID) -> AccessRequest:
    request = await get_request(db, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    return request


@router.post(
    "/requests/{request_id}/approve",
    response_model=None,
)
async def approve_request(
    request_id: UUID,
    payload: ApprovalAction,
    approver: User = Depends(require_persona(PersonaRole.APPROVER)),
    db: AsyncSession = Depends(get_db),
) -> AccessRequestRead:
    request = await _load_request_or_404(db, request_id)
    request = await transition_request(
        db=db,
        request=request,
        target=RequestStatus.APPROVED,
        actor_id=approver.id,
        reason=payload.reason,
    )
    return AccessRequestRead.model_validate(request)


@router.post(
    "/requests/{request_id}/deny",
    response_model=None,
)
async def deny_request(
    request_id: UUID,
    payload: ApprovalAction,
    approver: User = Depends(require_persona(PersonaRole.APPROVER)),
    db: AsyncSession = Depends(get_db),
) -> AccessRequestRead:
    request = await _load_request_or_404(db, request_id)
    request = await transition_request(
        db=db,
        request=request,
        target=RequestStatus.DENIED,
        actor_id=approver.id,
        reason=payload.reason,
    )
    return AccessRequestRead.model_validate(request)