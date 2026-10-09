from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit_types import AuditEventType
from app.db.models import (
    AccessRequest,
    Approval,
    ApprovalDecision,
    AuditEvent,
    Environment,
    Lease,
    LeaseStatus,
    PersonaRole,
    RequestStatus,
    User,
)

# Deterministic UUIDs so seeded data is stable across resets.
ALEX_ID = UUID("11111111-1111-1111-1111-111111111111")
SARAH_ID = UUID("22222222-2222-2222-2222-222222222222")
MARCUS_ID = UUID("33333333-3333-3333-3333-333333333333")

REQUEST_1_ID = UUID("aaaaaaaa-0000-0000-0000-000000000001")
REQUEST_2_ID = UUID("aaaaaaaa-0000-0000-0000-000000000002")
REQUEST_3_ID = UUID("aaaaaaaa-0000-0000-0000-000000000003")

LEASE_1_ID = UUID("bbbbbbbb-0000-0000-0000-000000000001")


async def reset_demo_data(session: AsyncSession) -> None:
    """Wipe all data and reinsert the demo scenario."""
    await session.execute(delete(AuditEvent))
    await session.execute(delete(Lease))
    await session.execute(delete(Approval))
    await session.execute(delete(AccessRequest))
    await session.execute(delete(User))
    await session.commit()

    now = datetime.now(UTC)

    # Users
    alex = User(
        id=ALEX_ID,
        email="alex@example.com",
        full_name="Alex Rivera",
        persona=PersonaRole.ENGINEER,
        is_active=True,
    )
    sarah = User(
        id=SARAH_ID,
        email="sarah@example.com",
        full_name="Sarah Chen",
        persona=PersonaRole.APPROVER,
        is_active=True,
    )
    marcus = User(
        id=MARCUS_ID,
        email="marcus@example.com",
        full_name="Marcus Patel",
        persona=PersonaRole.AUDITOR,
        is_active=True,
    )
    session.add_all([alex, sarah, marcus])
    await session.flush()

    # Request 1: pending, requires approval
    req1 = AccessRequest(
        id=REQUEST_1_ID,
        requester_id=ALEX_ID,
        environment=Environment.PRODUCTION_DB,
        requested_role="DatabaseReader",
        duration_minutes=30,
        justification="Ticket ENG-402: investigating latency spike in payment pipeline.",
        status=RequestStatus.PENDING,
        policy_decision="requires_approval",
        policy_reason="Production database access requires manual approval.",
    )

    # Request 2: auto approved with an active lease
    req2 = AccessRequest(
        id=REQUEST_2_ID,
        requester_id=ALEX_ID,
        environment=Environment.STAGING,
        requested_role="ECS-ReadOnly",
        duration_minutes=60,
        justification="Validating deployment in staging before promoting to production.",
        status=RequestStatus.AUTO_APPROVED,
        policy_decision="allow",
        policy_reason="Staging read-only requests under 2 hours are auto approved.",
        decided_at=now - timedelta(minutes=10),
    )

    # Request 3: denied, historical
    req3 = AccessRequest(
        id=REQUEST_3_ID,
        requester_id=ALEX_ID,
        environment=Environment.PRODUCTION,
        requested_role="ECS-Prod-BreakGlass",
        duration_minutes=480,
        justification="Long running debug session for a recurring error.",
        status=RequestStatus.DENIED,
        policy_decision="deny",
        policy_reason="Duration exceeds the 4 hour maximum for production access.",
        decided_at=now - timedelta(hours=6),
    )

    session.add_all([req1, req2, req3])
    await session.flush()

    # Approval for the denied request
    approval3 = Approval(
        request_id=REQUEST_3_ID,
        approver_id=SARAH_ID,
        decision=ApprovalDecision.DENIED,
        reason="Duration exceeds policy. Please file a shorter scoped request.",
        decided_at=now - timedelta(hours=6),
    )
    session.add(approval3)

    # Active lease for request 2
    lease1 = Lease(
        id=LEASE_1_ID,
        request_id=REQUEST_2_ID,
        user_id=ALEX_ID,
        access_key_id="ASIAEXAMPLEKEY000001",
        secret_access_key_hash="demo-hash-secret-1",
        session_token_hash="demo-hash-session-token-1",
        issued_at=now - timedelta(minutes=10),
        expires_at=now + timedelta(minutes=50),
        status=LeaseStatus.ACTIVE,
    )
    session.add(lease1)
    await session.flush()

    # Audit events
    events = [
        AuditEvent(
            event_type=AuditEventType.REQUEST_CREATED,
            actor_id=ALEX_ID,
            request_id=REQUEST_1_ID,
            payload={"environment": "production-db", "duration_minutes": 30},
        ),
        AuditEvent(
            event_type=AuditEventType.POLICY_EVALUATED,
            actor_id=ALEX_ID,
            request_id=REQUEST_1_ID,
            payload={
                "decision": "requires_approval",
                "reason": "Production database access requires manual approval.",
            },
        ),
        AuditEvent(
            event_type=AuditEventType.REQUEST_CREATED,
            actor_id=ALEX_ID,
            request_id=REQUEST_2_ID,
            payload={"environment": "staging", "duration_minutes": 60},
        ),
        AuditEvent(
            event_type=AuditEventType.REQUEST_AUTO_APPROVED,
            actor_id=ALEX_ID,
            request_id=REQUEST_2_ID,
            payload={"decision": "allow"},
        ),
        AuditEvent(
            event_type=AuditEventType.CREDENTIAL_ISSUED,
            actor_id=ALEX_ID,
            request_id=REQUEST_2_ID,
            lease_id=LEASE_1_ID,
            payload={"access_key_id": "ASIAEXAMPLEKEY000001"},
        ),
        AuditEvent(
            event_type=AuditEventType.REQUEST_CREATED,
            actor_id=ALEX_ID,
            request_id=REQUEST_3_ID,
            payload={"environment": "production", "duration_minutes": 480},
        ),
        AuditEvent(
            event_type=AuditEventType.REQUEST_DENIED,
            actor_id=SARAH_ID,
            request_id=REQUEST_3_ID,
            payload={"reason": "Duration exceeds policy."},
        ),
    ]
    session.add_all(events)
    await session.commit()