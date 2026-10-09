from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.access_request import AccessRequest
    from app.db.models.audit_event import AuditEvent
    from app.db.models.user import User


class LeaseStatus(StrEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class Lease(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "leases"

    request_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("access_requests.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    access_key_id: Mapped[str] = mapped_column(String(128), nullable=False)
    secret_access_key_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    session_token_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    status: Mapped[LeaseStatus] = mapped_column(
        SAEnum(LeaseStatus, name="lease_status", native_enum=True),
        default=LeaseStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    # Relationships
    request: Mapped[AccessRequest] = relationship(back_populates="lease")
    user: Mapped[User] = relationship(back_populates="leases")
    audit_events: Mapped[list[AuditEvent]] = relationship(
        back_populates="lease",
        cascade="all, delete-orphan",
    )