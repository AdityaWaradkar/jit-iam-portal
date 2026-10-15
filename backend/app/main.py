import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.audit_writer import audit_writer
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.session import AsyncSessionLocal
from app.services.lease_expiry import expire_due_leases

configure_logging()
logger = get_logger(__name__)
settings = get_settings()


LEASE_SWEEP_INTERVAL_SECONDS = 15


async def _lease_sweep_loop() -> None:
    logger.info(
        "lease_sweep_started",
        interval_seconds=LEASE_SWEEP_INTERVAL_SECONDS,
    )
    while True:
        try:
            async with AsyncSessionLocal() as session:
                count = await expire_due_leases(session)
            if count:
                logger.info("lease_sweep_run", expired_count=count)
        except asyncio.CancelledError:
            logger.info("lease_sweep_cancelled")
            raise
        except Exception as exc:
            logger.error("lease_sweep_failed", error=str(exc))

        await asyncio.sleep(LEASE_SWEEP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info(
        "application_starting",
        app_name=settings.app_name,
        environment=settings.app_env,
    )

    audit_writer.start()
    await _backfill_audit_writer()
    sweep_task = asyncio.create_task(_lease_sweep_loop())

    try:
        yield
    finally:
        sweep_task.cancel()
        try:
            await sweep_task
        except asyncio.CancelledError:
            pass
        await audit_writer.stop()

    logger.info("application_stopping", app_name=settings.app_name)


async def _backfill_audit_writer() -> None:
    from sqlalchemy import select
    from app.db.models import AuditEvent

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(AuditEvent).order_by(AuditEvent.created_at.asc())
            )
            events = list(result.scalars().all())
            for event in events:
                audit_writer.enqueue(
                    {
                        "id": str(event.id),
                        "event_type": event.event_type,
                        "actor_id": str(event.actor_id) if event.actor_id else None,
                        "request_id": str(event.request_id) if event.request_id else None,
                        "lease_id": str(event.lease_id) if event.lease_id else None,
                        "payload": event.payload,
                        "created_at": event.created_at.isoformat(),
                    }
                )
            logger.info("audit_writer_backfilled", count=len(events))
    except Exception as exc:
        logger.warning("audit_writer_backfill_failed", error=str(exc))

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {"service": settings.app_name, "docs": "/docs"}