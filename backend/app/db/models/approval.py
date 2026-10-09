from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.access_request import AccessRequest
    from app.db.models.user import User


class ApprovalDecision(StrEnum):
    APPROVED = "approved"
    DENIED = "denied"


class Approval(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approvals"

    request_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("access_requests.id", ondelete="CASCADE"),
        index=True,
    )
    approver_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    decision: Mapped[ApprovalDecision] = mapped_column(
        SAEnum(ApprovalDecision, name="approval_decision", native_enum=True),
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Relationships
    request: Mapped[AccessRequest] = relationship(back_populates="approvals")
    approver: Mapped[User] = relationship(back_populates="approvals")