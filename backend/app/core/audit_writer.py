import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)


AUDIT_LOG_DIR = Path(os.environ.get("AUDIT_LOG_DIR", "audit-logs"))


class AuditWriter:
    """Append audit events to a per-day JSONL file.

    Events are enqueued in memory and flushed by a background task.
    The file is a mirror of the database, not the source of truth.
    """

    def __init__(self) -> None:
        self._queue: asyncio.Queue[dict] = asyncio.Queue()
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()

    def start(self) -> None:
        if self._task is not None:
            return
        AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)
        self._stop.clear()
        self._task = asyncio.create_task(self._run())
        logger.info("audit_writer_started", directory=str(AUDIT_LOG_DIR))

    async def stop(self) -> None:
        self._stop.set()
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("audit_writer_stopped")

    def enqueue(self, event: dict) -> None:
        try:
            self._queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning("audit_writer_queue_full")

    async def _run(self) -> None:
        while not self._stop.is_set():
            try:
                event = await asyncio.wait_for(self._queue.get(), timeout=2.0)
                await self._write_batch([event])
            except TimeoutError:
                # Nothing to write. Loop continues.
                continue
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.error("audit_writer_failed", error=str(exc))

    async def _write_batch(self, events: list[dict]) -> None:
        if not events:
            return
        date = datetime.now(UTC).strftime("%Y-%m-%d")
        path = AUDIT_LOG_DIR / f"{date}.jsonl"
        with path.open("a", encoding="utf-8") as f:
            for event in events:
                f.write(json.dumps(event, default=str) + "\n")


# Module-level singleton. Started and stopped by the FastAPI lifespan.
audit_writer = AuditWriter()