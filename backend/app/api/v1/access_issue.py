from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.access import IssueCredentialResponse
from app.db.session import get_db
from app.services.access_requests import (
    get_request,
    issue_credential_for_request,
)

router = APIRouter(prefix="/access", tags=["access"])


@router.post(
    "/requests/{request_id}/issue",
    response_model=None,
)
async def issue_credentials(
    request_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> IssueCredentialResponse:
    request = await get_request(db, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    # Only the requester can issue credentials for their own request.
    if request.requester_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only issue credentials for your own requests.",
        )

    lease, credential = await issue_credential_for_request(
        db=db,
        request=request,
        actor_id=user.id,
    )

    return IssueCredentialResponse(
        lease_id=lease.id,
        access_key_id=credential.access_key_id,
        secret_access_key=credential.secret_access_key,
        session_token=credential.session_token,
        issued_at=lease.issued_at,
        expires_at=lease.expires_at,
        duration_minutes=request.duration_minutes,
        assumed_role_arn=credential.assumed_role.role_arn,
        assumed_role_name=credential.assumed_role.role_name,
    )