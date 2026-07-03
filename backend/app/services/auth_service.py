"""
app/services/auth_service.py
Business logic for authentication:
- Verify user credentials
- Create access + refresh token pairs
- Refresh token rotation
- Logout (token blacklisting via Redis)
"""
import logging
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.services.cache_service import cache_delete, cache_get, cache_set

logger = logging.getLogger(__name__)

# Redis key prefix for blacklisted tokens
BLACKLIST_PREFIX = "blacklist:token:"


async def authenticate_user(
    db: AsyncSession, username: str, password: str
) -> Optional[User]:
    """
    Validate username and password.
    Returns the User if valid, None otherwise.
    """
    result = await db.execute(
        select(User).where(User.username == username, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"Login failed: user '{username}' not found")
        return None
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Login failed: wrong password for '{username}'")
        return None
    return user


async def create_tokens(user: User) -> Tuple[str, str, int]:
    """
    Create a new access + refresh token pair.

    Returns:
        (access_token, refresh_token, expires_in_seconds)
    """
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return access_token, refresh_token, expires_in


async def refresh_access_token(
    db: AsyncSession, refresh_token: str
) -> Optional[Tuple[str, str, int]]:
    """
    Validate refresh token and issue a new token pair (token rotation).
    Returns None if the refresh token is invalid, expired, or blacklisted.
    """
    # Check blacklist
    is_blacklisted = await cache_get(f"{BLACKLIST_PREFIX}{refresh_token}")
    if is_blacklisted:
        logger.warning("Refresh token is blacklisted")
        return None

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        return None

    user_id = payload.get("sub")
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        return None

    # Blacklist the old refresh token
    await cache_set(
        f"{BLACKLIST_PREFIX}{refresh_token}",
        "used",
        ttl=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    return await create_tokens(user)


async def logout_user(refresh_token: str) -> bool:
    """
    Blacklist the refresh token so it can't be used again.
    Returns True on success.
    """
    payload = decode_token(refresh_token)
    if not payload:
        return False

    await cache_set(
        f"{BLACKLIST_PREFIX}{refresh_token}",
        "revoked",
        ttl=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    logger.info(f"Refresh token blacklisted for user: {payload.get('sub')}")
    return True
