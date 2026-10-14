from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.lease import LeaseList, LeaseRead
from app.db.session import get_db
from app.services.access_requests import get_lease, list_leases_for_user

router = APIRouter(prefix="/leases", tags=["leases"])


@router.get("", response_model=LeaseList)
async def list_my_leases(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> LeaseList:
    leases = await list_leases_for_user(db, user.id)
    return LeaseList(
        items=[LeaseRead.model_validate(lease) for lease in leases],
        total=len(leases),
    )


@router.get("/{lease_id}", response_model=LeaseRead)
async def read_lease(
    lease_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> LeaseRead:
    lease = await get_lease(db, lease_id)
    if lease is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found",
        )
    if lease.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own leases",
        )
    return LeaseRead.model_validate(lease)