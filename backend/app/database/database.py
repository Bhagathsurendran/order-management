"""
app/database/database.py
Async SQLAlchemy 2.0 engine and session factory.
- Uses asyncpg driver for PostgreSQL
- Provides get_session() dependency for FastAPI
- Base declarative model with UUID + timestamp mixins
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Engine ───────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,   # Log SQL statements in debug mode
    pool_pre_ping=True,         # Verify connections before use
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,          # Recycle connections every hour
)

# ── Session Factory ───────────────────────────────────────────────────────────
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,     # Don't expire objects after commit
    autoflush=False,
    autocommit=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ── Session Dependency ────────────────────────────────────────────────────────
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session with auto-rollback on error."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables() -> None:
    """Create all tables (used in development / testing)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
