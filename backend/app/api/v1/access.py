from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.access import (
    AccessRequestCreate,
    AccessRequestList,
    AccessRequestRead,
)
from app.db.session import get_db
from app.services.access_requests import (
    create_access_request,
    get_request,
    list_requests_for_user,
)

router = APIRouter(prefix="/access", tags=["access"])


@router.post(
    "/requests",
    response_model=AccessRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_request(
    payload: AccessRequestCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AccessRequestRead:
    request = await create_access_request(db, user, payload)
    return AccessRequestRead.model_validate(request)


@router.get("/requests", response_model=AccessRequestList)
async def list_my_requests(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AccessRequestList:
    items = await list_requests_for_user(db, user.id)
    return AccessRequestList(
        items=[AccessRequestRead.model_validate(item) for item in items],
        total=len(items),
    )


@router.get("/requests/{request_id}", response_model=AccessRequestRead)
async def read_request(
    request_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AccessRequestRead:
    request = await get_request(db, request_id)
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    # Only the requester can view their own request in this section.
    # Approvers and auditors get access through dedicated endpoints later.
    if request.requester_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own requests",
        )
    return AccessRequestRead.model_validate(request)