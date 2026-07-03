"""
app/models/order.py
Order model with status enum, dual currency storage (original + USD),
soft delete, and timestamps. Indexed for common query patterns.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    Index,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_customer_name", "customer_name"),
        Index("ix_orders_is_deleted", "is_deleted"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Original amount (INR by default)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")

    # USD equivalent (stored after currency conversion)
    usd_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=True)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="orderstatus", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=OrderStatus.PENDING,
    )

    # Soft delete — preserves records for audit purposes
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Track who created the order (FK to user.id — stored as string)
    created_by: Mapped[str] = mapped_column(
        String(36), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} customer={self.customer_name} status={self.status}>"
