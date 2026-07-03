"""
app/schemas/order.py
Pydantic V2 schemas for Order CRUD, list responses, and WebSocket payloads.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderStatus


# ── Input Schemas ──────────────────────────────────────────────────────────────
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=3, max_length=255)
    amount: float = Field(..., gt=0, description="Amount in INR")

    @field_validator("customer_name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Customer name cannot be blank")
        return v.strip()


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ── Output Schemas ─────────────────────────────────────────────────────────────
class OrderResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    customer_name: str
    amount: float
    currency: str
    usd_amount: Optional[float] = None
    status: OrderStatus
    created_by: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime


class OrderListParams(BaseModel):
    """Query parameters for listing/filtering orders."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: Optional[str] = None
    status: Optional[OrderStatus] = None
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class PaginatedOrderResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Dashboard ──────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_orders: int
    pending: int
    processing: int
    completed: int
    cancelled: int
    total_revenue_inr: float
    total_revenue_usd: float


# ── WebSocket Payload ──────────────────────────────────────────────────────────
class OrderStatusBroadcast(BaseModel):
    id: str
    status: str
    updated_at: str
