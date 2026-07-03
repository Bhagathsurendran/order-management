"""
app/main.py
FastAPI application factory.
- Configures logging, CORS, middleware
- Registers all routers
- Adds global exception handlers
- Health check endpoint
- Lifespan events (startup/shutdown)
"""
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth.router import router as auth_router
from app.api.orders.router import router as orders_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware

setup_logging()
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("=" * 60)
    logger.info(f"Starting {settings.PROJECT_NAME}")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info("=" * 60)

    # Verify DB connection on startup
    try:
        from app.database.database import engine
        async with engine.connect() as conn:
            logger.info("✓ Database connection established")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")

    yield

    # Shutdown: close DB connections
    from app.database.database import engine
    await engine.dispose()
    logger.info("Application shutdown complete")


# ── App Factory ────────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Real-Time Order Management Dashboard API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Custom Middleware (order matters — applied bottom-up) ──
    app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)
    app.add_middleware(LoggingMiddleware)

    # ── Routers ───────────────────────────────────────────────
    api_prefix = settings.API_V1_PREFIX
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(orders_router, prefix=api_prefix)

    # ── WebSocket route is inside orders router but at root /ws
    # Re-include it at root level for easy WS URL
    from app.websocket.manager import ws_manager
    from fastapi import WebSocket, WebSocketDisconnect

    @app.websocket("/ws/orders")
    async def ws_orders(websocket: WebSocket):
        await ws_manager.connect(websocket)
        try:
            await ws_manager.send_personal_message(
                {"type": "connected", "message": "Real-time order updates active"},
                websocket,
            )
            while True:
                data = await websocket.receive_text()
                if data == "ping":
                    await ws_manager.send_personal_message({"type": "pong"}, websocket)
        except WebSocketDisconnect:
            ws_manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            ws_manager.disconnect(websocket)

    # ── Exception Handlers ────────────────────────────────────
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"success": False, "message": "Validation error", "errors": errors},
        )

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Any) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "Resource not found", "errors": []},
        )

    @app.exception_handler(500)
    async def server_error_handler(request: Request, exc: Any) -> JSONResponse:
        logger.error(f"Internal server error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "errors": [],
            },
        )

    # ── Health Check ──────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy", "version": "1.0.0", "env": settings.APP_ENV}

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_app()
