from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_persona
from app.api.v1.schemas.security import SecurityOverview
from app.db.models import PersonaRole, User
from app.db.session import get_db
from app.services.security import build_overview

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/overview", response_model=SecurityOverview)
async def get_overview(
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> SecurityOverview:
    return await build_overview(db)