from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_persona
from app.api.v1.schemas.access import (
    ApprovalAction,
    PendingRequestList,
    PendingRequestRead,
)
from app.db.models import (
    AccessRequest,
    Approval,
    ApprovalDecision,
    PersonaRole,
    RequestStatus,
    User,
)
from app.db.session import get_db
from app.services.access_requests import (
    get_request,
    list_pending_requests,
)
from app.services.state_machine import transition_request

router = APIRouter(prefix="/approver", tags=["approver"])


def _to_pending_read(request: AccessRequest) -> PendingRequestRead:
    requester = request.requester
    return PendingRequestRead(
        id=request.id,
        requester_id=request.requester_id,
        environment=request.environment,
        requested_role=request.requested_role,
        duration_minutes=request.duration_minutes,
        justification=request.justification,
        status=request.status,
        policy_decision=request.policy_decision,
        policy_reason=request.policy_reason,
        decided_at=request.decided_at,
        created_at=request.created_at,
        updated_at=request.updated_at,
        requester_name=requester.full_name,
        requester_email=requester.email,
        requester_persona=requester.persona.value,
    )


@router.get("/pending", response_model=PendingRequestList)
async def list_pending(
    approver: User = Depends(require_persona(PersonaRole.APPROVER)),
    db: AsyncSession = Depends(get_db),
) -> PendingRequestList:
    requests = await list_pending_requests(db)
    return PendingRequestList(
        items=[_to_pending_read(r) for r in requests],
        total=len(requests),
    )


async def _write_approval(
    db: AsyncSession,
    request_id: UUID,
    approver_id: UUID,
    decision: ApprovalDecision,
    reason: str | None,
) -> None:
    db.add(
        Approval(
            request_id=request_id,
            approver_id=approver_id,
            decision=decision,
            reason=reason,
            decided_at=datetime.now(UTC),
        )
    )


@router.post(
    "/requests/{request_id}/approve",
    response_model=None,
)
async def approve_request(
    request_id: UUID,
    payload: ApprovalAction,
    approver: User = Depends(require_persona(PersonaRole.APPROVER)),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    request = await get_request(db, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    request = await transition_request(
        db=db,
        request=request,
        target=RequestStatus.APPROVED,
        actor_id=approver.id,
        reason=payload.reason or None,
    )

    await _write_approval(
        db=db,
        request_id=request.id,
        approver_id=approver.id,
        decision=ApprovalDecision.APPROVED,
        reason=payload.reason or None,
    )
    await db.commit()

    return {"status": "approved", "request_id": str(request.id)}


@router.post(
    "/requests/{request_id}/deny",
    response_model=None,
)
async def deny_request(
    request_id: UUID,
    payload: ApprovalAction,
    approver: User = Depends(require_persona(PersonaRole.APPROVER)),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    request = await get_request(db, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    request = await transition_request(
        db=db,
        request=request,
        target=RequestStatus.DENIED,
        actor_id=approver.id,
        reason=payload.reason or None,
    )

    await _write_approval(
        db=db,
        request_id=request.id,
        approver_id=approver.id,
        decision=ApprovalDecision.DENIED,
        reason=payload.reason or None,
    )
    await db.commit()

    return {"status": "denied", "request_id": str(request.id)}