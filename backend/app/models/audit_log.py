"""
app/models/audit_log.py
Audit log model that records every state-changing operation.
Stores the entity type, action, user who performed it,
and JSON snapshots of before/after state.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # What entity was affected (e.g., "order", "user")
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # The ID of the affected entity
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)

    # Action performed (e.g., "create", "update_status", "delete")
    action: Mapped[str] = mapped_column(String(50), nullable=False)

    # Who performed the action
    performed_by: Mapped[str] = mapped_column(String(36), nullable=True)

    # JSON snapshots (stored as text for portability)
    before_state: Mapped[str] = mapped_column(Text, nullable=True)
    after_state: Mapped[str] = mapped_column(Text, nullable=True)

    # Additional context
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog entity={self.entity_type}:{self.entity_id} "
            f"action={self.action} by={self.performed_by}>"
        )
