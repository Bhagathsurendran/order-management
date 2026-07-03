"""
app/core/logging_config.py
Configures structured logging for the entire application.
Logs include timestamp, level, logger name, and message.
SQL queries are logged at DEBUG level only in development.
"""
import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configure root logger and named loggers for the application."""
    log_level = logging.DEBUG if settings.APP_DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # SQLAlchemy — only show SQL in debug mode
    sql_level = logging.DEBUG if settings.APP_DEBUG else logging.WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(sql_level)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger for a specific module."""
    return logging.getLogger(name)
