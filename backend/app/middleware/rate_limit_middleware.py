"""
app/middleware/rate_limit_middleware.py
Simple in-memory rate limiting middleware using a sliding window.
Falls back gracefully without crashing if Redis is unavailable.
For production, use slowapi with Redis backend.
"""
import logging
import time
from collections import defaultdict, deque
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

logger = logging.getLogger("app.rate_limit")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter.
    Tracks requests per IP over a 60-second window.
    Returns 429 Too Many Requests if limit is exceeded.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        # ip -> deque of request timestamps
        self._request_log: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip rate limiting for health checks and WebSocket
        if request.url.path in ("/health", "/ws/orders"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()
        window_start = now - self.window_seconds

        # Get the request log for this IP
        request_times = self._request_log[client_ip]

        # Remove timestamps outside the window
        while request_times and request_times[0] < window_start:
            request_times.popleft()

        if len(request_times) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return Response(
                content='{"success":false,"message":"Rate limit exceeded. Try again later.","errors":[]}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        request_times.append(now)
        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"
