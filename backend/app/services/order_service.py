"""
app/services/order_service.py
Core business logic for Order management:
- Create order with async currency conversion
- List orders with pagination, search, sort, filter
- Get single order
- Update order status + broadcast via WebSocket
- Soft delete
- Dashboard statistics
All queries use SQLAlchemy 2.0 async style.
"""
import logging
import math
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy import desc, asc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.schemas.order import (
    DashboardStats,
    OrderCreate,
    OrderListParams,
    OrderResponse,
    PaginatedOrderResponse,
)
from app.services.audit_service import log_action
from app.services.cache_service import (
    cache_delete,
    cache_get,
    cache_invalidate_pattern,
    cache_set,
)
from app.services.currency_service import convert_to_usd
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)

ORDERS_CACHE_PREFIX = "orders:"
STATS_CACHE_KEY = "orders:stats"


async def create_order(
    db: AsyncSession,
    payload: OrderCreate,
    created_by: str,
    ip_address: Optional[str] = None,
) -> Tuple[Order, bool]:
    """
    Create a new order with currency conversion.

    Returns:
        (order, used_currency_fallback)
    """
    usd_amount, used_fallback = await convert_to_usd(payload.amount, "INR")

    order = Order(
        customer_name=payload.customer_name,
        amount=payload.amount,
        currency="INR",
        usd_amount=usd_amount,
        status=OrderStatus.PENDING,
        created_by=created_by,
    )
    db.add(order)
    await db.flush()  # Get the ID without committing

    await log_action(
        db,
        entity_type="order",
        entity_id=order.id,
        action="create",
        performed_by=created_by,
        before_state=None,
        after_state={
            "customer_name": order.customer_name,
            "amount": float(order.amount),
            "usd_amount": float(order.usd_amount) if order.usd_amount else None,
            "status": order.status.value,
        },
        ip_address=ip_address,
    )

    # Invalidate cached lists and stats
    await cache_invalidate_pattern(f"{ORDERS_CACHE_PREFIX}*")

    logger.info(f"Order created: {order.id} for {order.customer_name}")
    return order, used_fallback


async def list_orders(
    db: AsyncSession, params: OrderListParams
) -> PaginatedOrderResponse:
    """
    List orders with pagination, search, sort, and status/date filters.
    Results are cached per unique query combination.
    """
    cache_key = (
        f"{ORDERS_CACHE_PREFIX}list:"
        f"p{params.page}:ps{params.page_size}:"
        f"s{params.search}:st{params.status}:"
        f"sb{params.sort_by}:so{params.sort_order}:"
        f"df{params.date_from}:dt{params.date_to}"
    )

    cached = await cache_get(cache_key)
    if cached:
        return PaginatedOrderResponse(**cached)

    # Build base query
    query = select(Order).where(Order.is_deleted == False)

    # Search by customer name
    if params.search:
        query = query.where(Order.customer_name.ilike(f"%{params.search}%"))

    # Filter by status
    if params.status:
        query = query.where(Order.status == params.status)

    # Filter by date range
    if params.date_from:
        query = query.where(Order.created_at >= params.date_from)
    if params.date_to:
        query = query.where(Order.created_at <= params.date_to)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Sorting
    sort_column = getattr(Order, params.sort_by, Order.created_at)
    sort_func = desc if params.sort_order == "desc" else asc
    query = query.order_by(sort_func(sort_column))

    # Pagination
    offset = (params.page - 1) * params.page_size
    query = query.offset(offset).limit(params.page_size)

    result = await db.execute(query)
    orders = result.scalars().all()

    total_pages = math.ceil(total / params.page_size) if total > 0 else 1

    response = PaginatedOrderResponse(
        items=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
    )

    await cache_set(cache_key, response.model_dump(), ttl=60)
    return response


async def get_order(db: AsyncSession, order_id: str) -> Optional[Order]:
    """Fetch a single non-deleted order by ID."""
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == False)
    )
    order = result.scalar_one_or_none()
    return order


async def update_order_status(
    db: AsyncSession,
    order_id: str,
    new_status: OrderStatus,
    performed_by: str,
    ip_address: Optional[str] = None,
) -> Optional[Order]:
    """
    Update order status and broadcast via WebSocket.
    Records an audit log entry with before/after state.
    """
    # Query database directly to get active session-bound model
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.is_deleted == False)
    )
    order = result.scalar_one_or_none()
    if not order:
        return None

    before_status = order.status.value
    order.status = new_status

    await log_action(
        db,
        entity_type="order",
        entity_id=order.id,
        action="update_status",
        performed_by=performed_by,
        before_state={"status": before_status},
        after_state={"status": new_status.value},
        ip_address=ip_address,
    )

    await db.flush()
    await db.refresh(order)  # Asynchronously reload expired columns from DB

    # Broadcast to all WebSocket clients
    await ws_manager.broadcast({
        "id": order.id,
        "status": new_status.value,
        "updated_at": order.updated_at.isoformat() if order.updated_at else datetime.utcnow().isoformat(),
    })

    # Invalidate lists and stats caches
    await cache_invalidate_pattern(f"{ORDERS_CACHE_PREFIX}list:*")
    await cache_delete(STATS_CACHE_KEY)

    logger.info(f"Order {order_id} status: {before_status} → {new_status.value}")
    return order


async def soft_delete_order(
    db: AsyncSession,
    order_id: str,
    performed_by: str,
    ip_address: Optional[str] = None,
) -> bool:
    """Soft delete an order (sets is_deleted=True, preserves data for audit)."""
    order = await get_order(db, order_id)
    if not order:
        return False

    order.is_deleted = True

    await log_action(
        db,
        entity_type="order",
        entity_id=order.id,
        action="soft_delete",
        performed_by=performed_by,
        before_state={"is_deleted": False},
        after_state={"is_deleted": True},
        ip_address=ip_address,
    )

    await cache_delete(f"{ORDERS_CACHE_PREFIX}detail:{order_id}")
    await cache_invalidate_pattern(f"{ORDERS_CACHE_PREFIX}list:*")
    await cache_delete(STATS_CACHE_KEY)

    logger.info(f"Order {order_id} soft deleted by {performed_by}")
    return True


async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
    """Compute dashboard statistics with Redis caching."""
    cached = await cache_get(STATS_CACHE_KEY)
    if cached:
        return DashboardStats(**cached)

    # Count by status
    counts = {}
    for status in OrderStatus:
        result = await db.execute(
            select(func.count(Order.id)).where(
                Order.status == status, Order.is_deleted == False
            )
        )
        counts[status.value] = result.scalar_one()

    # Total orders
    total_result = await db.execute(
        select(func.count(Order.id)).where(Order.is_deleted == False)
    )
    total = total_result.scalar_one()

    # Revenue sums
    inr_result = await db.execute(
        select(func.sum(Order.amount)).where(
            Order.status == OrderStatus.COMPLETED, Order.is_deleted == False
        )
    )
    usd_result = await db.execute(
        select(func.sum(Order.usd_amount)).where(
            Order.status == OrderStatus.COMPLETED, Order.is_deleted == False
        )
    )

    stats = DashboardStats(
        total_orders=total,
        pending=counts.get("Pending", 0),
        processing=counts.get("Processing", 0),
        completed=counts.get("Completed", 0),
        cancelled=counts.get("Cancelled", 0),
        total_revenue_inr=float(inr_result.scalar_one() or 0),
        total_revenue_usd=float(usd_result.scalar_one() or 0),
    )

    await cache_set(STATS_CACHE_KEY, stats.model_dump(), ttl=120)
    return stats
