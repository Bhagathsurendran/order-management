"""
app/middleware/logging_middleware.py
Request/response logging middleware.
Logs method, path, status code, and duration for every HTTP request.
"""
import logging
import time
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.access")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Logs every incoming request and outgoing response with timing."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()

        # Log incoming request
        logger.info(
            f"[{request_id}] → {request.method} {request.url.path} "
            f"(client: {request.client.host if request.client else 'unknown'})"
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(
                f"[{request_id}] ✗ Unhandled exception: {exc}", exc_info=True
            )
            raise

        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log outgoing response
        logger.info(
            f"[{request_id}] ← {response.status_code} "
            f"{request.method} {request.url.path} "
            f"({duration_ms:.1f}ms)"
        )

        # Attach request ID to response headers for tracing
        response.headers["X-Request-ID"] = request_id
        return response
