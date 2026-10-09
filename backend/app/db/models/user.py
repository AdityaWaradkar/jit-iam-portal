from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.access_request import AccessRequest
    from app.db.models.approval import Approval
    from app.db.models.audit_event import AuditEvent
    from app.db.models.lease import Lease


class PersonaRole(StrEnum):
    ENGINEER = "engineer"
    APPROVER = "approver"
    AUDITOR = "auditor"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    persona: Mapped[PersonaRole] = mapped_column(
        SAEnum(PersonaRole, name="persona_role", native_enum=True),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    requests: Mapped[list[AccessRequest]] = relationship(
        back_populates="requester",
        foreign_keys="AccessRequest.requester_id",
        cascade="all, delete-orphan",
    )
    approvals: Mapped[list[Approval]] = relationship(
        back_populates="approver",
        cascade="all, delete-orphan",
    )
    leases: Mapped[list[Lease]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    audit_events: Mapped[list[AuditEvent]] = relationship(
        back_populates="actor",
        cascade="all, delete-orphan",
    )