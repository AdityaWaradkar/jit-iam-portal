import json
from collections.abc import AsyncIterator
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_persona
from app.api.v1.schemas.audit import (
    AuditEventList,
    AuditEventRead,
    AuditStats,
)
from app.db.models import PersonaRole, User
from app.db.session import get_db
from app.services.audit import (
    get_event,
    get_stats,
    list_events,
    stream_events,
)

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=AuditEventList)
async def list_audit_events(
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_type: str | None = Query(default=None),
    actor_id: UUID | None = Query(default=None),
    request_id: UUID | None = Query(default=None),
    lease_id: UUID | None = Query(default=None),
    since: datetime | None = Query(default=None),
    until: datetime | None = Query(default=None),
) -> AuditEventList:
    items, total = await list_events(
        db=db,
        limit=limit,
        offset=offset,
        event_type=event_type,
        actor_id=actor_id,
        request_id=request_id,
        lease_id=lease_id,
        since=since,
        until=until,
    )
    return AuditEventList(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/stats", response_model=AuditStats)
async def audit_stats(
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> AuditStats:
    return await get_stats(db)


@router.get("/export")
async def export_audit(
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    async def generate() -> AsyncIterator[bytes]:
        async for event in stream_events(db):
            yield (json.dumps(event, default=str) + "\n").encode("utf-8")

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": 'attachment; filename="audit-export.jsonl"',
        },
    )


@router.get("/{event_id}", response_model=AuditEventRead)
async def read_audit_event(
    event_id: UUID,
    user: User = Depends(require_persona(PersonaRole.AUDITOR)),
    db: AsyncSession = Depends(get_db),
) -> AuditEventRead:
    event = await get_event(db, event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit event not found",
        )
    return event