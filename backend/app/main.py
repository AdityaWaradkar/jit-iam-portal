import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.db.session import AsyncSessionLocal
from app.services.lease_expiry import expire_due_leases

configure_logging()
logger = get_logger(__name__)
settings = get_settings()


LEASE_SWEEP_INTERVAL_SECONDS = 15


async def _lease_sweep_loop() -> None:
    """Periodically scan for expired leases and expire them.

    Runs for the lifetime of the application. Catches and logs all
    exceptions so the loop is never cancelled by an unhandled error.
    """
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

    sweep_task = asyncio.create_task(_lease_sweep_loop())

    try:
        yield
    finally:
        sweep_task.cancel()
        try:
            await sweep_task
        except asyncio.CancelledError:
            pass

    logger.info("application_stopping", app_name=settings.app_name)


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