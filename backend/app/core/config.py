"""
app/core/config.py
Central Pydantic Settings class — loads all configuration from environment
variables with type validation. Single source of truth for all settings.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    PROJECT_NAME: str = "Order Management Dashboard"
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/orderdb"

    # ── JWT ──────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-must-be-at-least-32-chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Currency API ─────────────────────────────────────────
    EXCHANGE_RATE_API_KEY: str = ""
    EXCHANGE_RATE_BASE_CURRENCY: str = "INR"
    EXCHANGE_RATE_FALLBACK_USD: float = 83.0  # 1 USD = 83 INR fallback

    # ── Redis ────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300  # 5 minutes

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # ── Rate Limiting ─────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
