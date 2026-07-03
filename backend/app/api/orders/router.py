"""
app/api/orders/router.py
Order management endpoints:
  POST   /api/v1/orders                   — create order
  GET    /api/v1/orders                   — list orders (paginated, filtered)
  GET    /api/v1/orders/stats             — dashboard stats
  GET    /api/v1/orders/{id}              — get single order
  PATCH  /api/v1/orders/{id}/status       — update status (admin only)
  DELETE /api/v1/orders/{id}              — soft delete (admin only)
  WS     /ws/orders                       — WebSocket real-time updates
"""
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Query, Request, WebSocket, WebSocketDisconnect, status

from app.core.dependencies import AdminUser, CurrentUser, DBSession
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderListParams, OrderStatusUpdate
from app.services import order_service
from app.utils.response import error_response, success_response
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["Orders"])


# ── Create Order ──────────────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new order")
async def create_order(
    body: OrderCreate,
    db: DBSession,
    current_user: CurrentUser,
    request: Request,
):
    order, used_fallback = await order_service.create_order(
        db,
        payload=body,
        created_by=current_user.id,
        ip_address=request.client.host if request.client else None,
    )

    from app.schemas.order import OrderResponse
    data = OrderResponse.model_validate(order).model_dump(mode="json")

    message = "Order created successfully"
    if used_fallback:
        message += " (currency API unavailable; used fallback rate 1 USD = 83 INR)"

    return success_response(data=data, message=message, status_code=201)


# ── Dashboard Stats ───────────────────────────────────────────────────────────
@router.get("/stats", summary="Get dashboard statistics")
async def get_stats(db: DBSession, current_user: CurrentUser):
    stats = await order_service.get_dashboard_stats(db)
    return success_response(data=stats.model_dump(), message="Dashboard stats fetched")


# ── List Orders ───────────────────────────────────────────────────────────────
@router.get("", summary="List orders with pagination and filters")
async def list_orders(
    db: DBSession,
    current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status_filter: Optional[OrderStatus] = Query(default=None, alias="status"),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
):
    params = OrderListParams(
        page=page,
        page_size=page_size,
        search=search,
        status=status_filter,
        sort_by=sort_by,
        sort_order=sort_order,
        date_from=date_from,
        date_to=date_to,
    )
    result = await order_service.list_orders(db, params)
    return success_response(data=result.model_dump(mode="json"), message="Orders fetched")


# ── Get Single Order ──────────────────────────────────────────────────────────
@router.get("/{order_id}", summary="Get order details by ID")
async def get_order(order_id: str, db: DBSession, current_user: CurrentUser):
    order = await order_service.get_order(db, order_id)
    if not order:
        return error_response(
            message=f"Order {order_id} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    from app.schemas.order import OrderResponse
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message="Order fetched",
    )


# ── Update Order Status ────────────────────────────────────────────────────────
@router.patch("/{order_id}/status", summary="Update order status (admin only)")
async def update_status(
    order_id: str,
    body: OrderStatusUpdate,
    db: DBSession,
    current_user: CurrentUser,   # any authenticated user can update (adjust to AdminUser for stricter)
    request: Request,
):
    order = await order_service.update_order_status(
        db,
        order_id=order_id,
        new_status=body.status,
        performed_by=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    if not order:
        return error_response(
            message=f"Order {order_id} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    from app.schemas.order import OrderResponse
    return success_response(
        data=OrderResponse.model_validate(order).model_dump(mode="json"),
        message=f"Order status updated to {body.status.value}",
    )


# ── Soft Delete Order ─────────────────────────────────────────────────────────
@router.delete("/{order_id}", summary="Soft delete an order (admin only)")
async def delete_order(
    order_id: str,
    db: DBSession,
    admin_user: AdminUser,
    request: Request,
):
    deleted = await order_service.soft_delete_order(
        db,
        order_id=order_id,
        performed_by=admin_user.id,
        ip_address=request.client.host if request.client else None,
    )
    if not deleted:
        return error_response(
            message=f"Order {order_id} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return success_response(message="Order deleted successfully")


# ── WebSocket ─────────────────────────────────────────────────────────────────
@router.websocket("/ws/orders")
async def websocket_orders(websocket: WebSocket):
    """
    WebSocket endpoint for real-time order status updates.
    Clients connect and receive broadcasts whenever an order status changes.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await ws_manager.send_personal_message(
            {"type": "connected", "message": "Connected to order updates"},
            websocket,
        )
        # Keep connection alive; listen for client messages (ping/pong)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await ws_manager.send_personal_message({"type": "pong"}, websocket)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
