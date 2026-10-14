from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_persona
from app.db.models import PersonaRole, User
from app.db.session import get_db
from app.services.lease_expiry import expire_due_leases

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/expire-leases", response_model=None)
async def trigger_lease_sweep(
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    count = await expire_due_leases(db)
    return {"expired_count": count}