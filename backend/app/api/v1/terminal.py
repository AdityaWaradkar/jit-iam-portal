from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.api.v1.schemas.terminal import TerminalRequest, TerminalResponse
from app.db.session import get_db
from app.services.terminal import run_command

router = APIRouter(prefix="/terminal", tags=["terminal"])


@router.post("/run", response_model=None)
async def run_terminal_command(
    payload: TerminalRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> TerminalResponse:
    result = await run_command(
        db=db,
        access_key_id=payload.access_key_id,
        secret_access_key=payload.secret_access_key,
        session_token=payload.session_token,
        command=payload.command,
        actor_id=user.id,
    )
    return TerminalResponse(
        exit_code=result.exit_code,
        stdout=result.stdout,
        stderr=result.stderr,
    )