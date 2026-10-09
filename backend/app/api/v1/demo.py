from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_types import AuditEventType
from app.db.models import AuditEvent
from app.db.seed import reset_demo_data
from app.db.session import get_db

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/reset")
async def reset_demo(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    await reset_demo_data(db)
    event = AuditEvent(
        event_type=AuditEventType.DEMO_RESET,
        payload={"source": "api"},
    )
    db.add(event)
    await db.commit()
    return {"status": "ok", "message": "Demo data reset."}