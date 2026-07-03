"""
app/services/audit_service.py
Writes audit log entries to the database.
Called whenever an order or user is created, updated, or deleted.
"""
import json
import logging
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def log_action(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: str,
    action: str,
    performed_by: Optional[str] = None,
    before_state: Optional[Any] = None,
    after_state: Optional[Any] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry.

    Args:
        entity_type: e.g. "order", "user"
        entity_id:   UUID of the affected entity
        action:      e.g. "create", "update_status", "soft_delete"
        performed_by: UUID of the user who performed the action
        before_state: dict or None representing the entity before change
        after_state:  dict or None representing the entity after change
        ip_address:  client IP for tracing
    """
    audit = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        performed_by=performed_by,
        before_state=json.dumps(before_state, default=str) if before_state else None,
        after_state=json.dumps(after_state, default=str) if after_state else None,
        ip_address=ip_address,
    )
    db.add(audit)
    # Flush without committing (the outer transaction will commit)
    await db.flush()
    logger.debug(
        f"Audit: {action} on {entity_type}:{entity_id} by {performed_by}"
    )
    return audit
