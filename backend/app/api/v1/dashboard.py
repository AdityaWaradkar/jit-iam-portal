from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.dashboard import DashboardSummary
from app.db.session import get_db
from app.services.dashboard import build_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> DashboardSummary:
    return await build_summary(db, user.id)