from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.approval import Approval
    from app.db.models.audit_event import AuditEvent
    from app.db.models.lease import Lease
    from app.db.models.user import User


class Environment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    PRODUCTION_DB = "production-db"


class RequestStatus(StrEnum):
    PENDING = "pending"
    AUTO_APPROVED = "auto_approved"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"
    REVOKED = "revoked"


class AccessRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "access_requests"

    requester_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    environment: Mapped[Environment] = mapped_column(
        SAEnum(Environment, name="environment", native_enum=True),
        nullable=False,
    )
    requested_role: Mapped[str] = mapped_column(String(128), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(RequestStatus, name="request_status", native_enum=True),
        default=RequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    policy_decision: Mapped[str | None] = mapped_column(String(64), nullable=True)
    policy_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    requester: Mapped[User] = relationship(
        back_populates="requests",
        foreign_keys=[requester_id],
    )
    approvals: Mapped[list[Approval]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
    )
    lease: Mapped[Lease | None] = relationship(
        back_populates="request",
        uselist=False,
        cascade="all, delete-orphan",
    )
    audit_events: Mapped[list[AuditEvent]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
    )