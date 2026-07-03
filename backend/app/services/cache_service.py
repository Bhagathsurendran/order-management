"""
app/services/cache_service.py
Redis cache wrapper service.
Provides get/set/delete/invalidate_pattern operations.
Gracefully degrades to None if Redis is unavailable — the app
continues working, just without caching.
"""
import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    """Get or create the Redis connection. Returns None on failure."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            await _redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis unavailable, caching disabled: {e}")
            _redis_client = None
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    """Retrieve a value from Redis cache. Returns None on miss or error."""
    client = await get_redis()
    if not client:
        return None
    try:
        value = await client.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.warning(f"Cache GET failed for key '{key}': {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = None) -> bool:
    """Store a value in Redis with optional TTL (seconds). Returns True on success."""
    client = await get_redis()
    if not client:
        return False
    try:
        ttl = ttl or settings.CACHE_TTL_SECONDS
        await client.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception as e:
        logger.warning(f"Cache SET failed for key '{key}': {e}")
        return False


async def cache_delete(key: str) -> bool:
    """Delete a specific key from cache."""
    client = await get_redis()
    if not client:
        return False
    try:
        await client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache DELETE failed for key '{key}': {e}")
        return False


async def cache_invalidate_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern. Returns count deleted."""
    client = await get_redis()
    if not client:
        return 0
    try:
        keys = await client.keys(pattern)
        if keys:
            await client.delete(*keys)
            logger.info(f"Cache invalidated {len(keys)} keys matching '{pattern}'")
        return len(keys)
    except Exception as e:
        logger.warning(f"Cache pattern invalidation failed: {e}")
        return 0
