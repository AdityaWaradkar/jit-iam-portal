from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.schemas.security import (
    DecisionLatency,
    ElevationDay,
    RecentCredential,
    SecurityOverview,
    TopRequester,
    ZeroStandingPrivilegesStatus,
)
from app.core.audit_types import AuditEventType
from app.db.models import AccessRequest, AuditEvent, Lease, LeaseStatus, User

LEADERBOARD_LIMIT = 5
RECENT_CREDENTIALS_LIMIT = 5
HEATMAP_DAYS = 7


async def build_overview(db: AsyncSession) -> SecurityOverview:
    now = datetime.now(UTC)

    zsp = await _build_zsp(db)
    heatmap = await _build_heatmap(db, now)
    leaderboard = await _build_leaderboard(db)
    recent_credentials = await _build_recent_credentials(db)
    latency = await _build_latency(db)

    return SecurityOverview(
        zsp=zsp,
        elevations_last_seven_days=heatmap,
        top_requesters=leaderboard,
        recent_credentials=recent_credentials,
        decision_latency=latency,
        generated_at=now,
    )


async def _build_zsp(db: AsyncSession) -> ZeroStandingPrivilegesStatus:
    result = await db.execute(
        select(func.count(Lease.id)).where(
            Lease.status == LeaseStatus.ACTIVE,
            Lease.expires_at > datetime.now(UTC),
        )
    )
    active = int(result.scalar() or 0)
    zero = active == 0
    message = (
        "No elevated permissions are currently active. "
        "The platform is in its default posture."
        if zero
        else f"{active} temporary credential(s) are currently active."
    )
    return ZeroStandingPrivilegesStatus(
        active_leases=active,
        zero_standing=zero,
        message=message,
    )


async def _build_heatmap(
    db: AsyncSession,
    now: datetime,
) -> list[ElevationDay]:
    start = (now - timedelta(days=HEATMAP_DAYS - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    result = await db.execute(
        select(
            func.date_trunc("day", AuditEvent.created_at).label("day"),
            AuditEvent.payload,
        )
        .where(
            AuditEvent.event_type == AuditEventType.CREDENTIAL_ISSUED,
            AuditEvent.created_at >= start,
        )
    )
    rows = result.all()

    # Build a dict keyed by date with per-environment counts.
    buckets: dict[str, dict[str, int]] = {}
    for day_dt, payload in rows:
        day = day_dt.date() if hasattr(day_dt, "date") else day_dt
        key = day.isoformat()
        buckets.setdefault(key, {})
        env = "unknown"
        if isinstance(payload, dict):
            env = str(payload.get("environment", "unknown"))
        buckets[key][env] = buckets[key].get(env, 0) + 1

    days: list[ElevationDay] = []
    for i in range(HEATMAP_DAYS):
        day = (start + timedelta(days=i)).date()
        key = day.isoformat()
        env_counts = buckets.get(key, {})
        days.append(
            ElevationDay(
                day=day,
                count=sum(env_counts.values()),
                by_environment=env_counts,
            )
        )
    return days


async def _build_leaderboard(db: AsyncSession) -> list[TopRequester]:
    result = await db.execute(
        select(
            AuditEvent.actor_id,
            func.count(AuditEvent.id).label("cnt"),
        )
        .where(
            AuditEvent.event_type == AuditEventType.REQUEST_CREATED,
            AuditEvent.actor_id.is_not(None),
        )
        .group_by(AuditEvent.actor_id)
        .order_by(func.count(AuditEvent.id).desc())
        .limit(LEADERBOARD_LIMIT)
    )
    rows = result.all()

    actor_ids = [row[0] for row in rows if row[0] is not None]
    names: dict = {}
    if actor_ids:
        users_result = await db.execute(
            select(User.id, User.full_name).where(User.id.in_(actor_ids))
        )
        for uid, name in users_result.all():
            names[uid] = name

    return [
        TopRequester(
            actor_id=row[0],
            actor_name=names.get(row[0], "Unknown"),
            request_count=int(row[1]),
        )
        for row in rows
        if row[0] is not None
    ]


async def _build_recent_credentials(
    db: AsyncSession,
) -> list[RecentCredential]:
    result = await db.execute(
        select(Lease, User.full_name)
        .join(User, User.id == Lease.user_id)
        .order_by(Lease.issued_at.desc())
        .limit(RECENT_CREDENTIALS_LIMIT)
    )
    rows = result.all()

    return [
        RecentCredential(
            lease_id=lease.id,
            access_key_id=lease.access_key_id,
            assumed_role_name=lease.assumed_role_name,
            issued_at=lease.issued_at,
            expires_at=lease.expires_at,
            user_name=name,
        )
        for lease, name in rows
    ]


async def _build_latency(db: AsyncSession) -> DecisionLatency:
    result = await db.execute(
        select(
            func.extract(
                "epoch",
                AccessRequest.decided_at - AccessRequest.created_at,
            )
        ).where(AccessRequest.decided_at.is_not(None))
    )
    values = [float(v) for (v,) in result.all() if v is not None]
    if not values:
        return DecisionLatency(
            sample_size=0,
            average_seconds=None,
            p50_seconds=None,
            p95_seconds=None,
        )

    values.sort()
    n = len(values)

    def percentile(p: float) -> float:
        idx = int(round((p / 100) * (n - 1)))
        return values[idx]

    return DecisionLatency(
        sample_size=n,
        average_seconds=sum(values) / n,
        p50_seconds=percentile(50),
        p95_seconds=percentile(95),
    )