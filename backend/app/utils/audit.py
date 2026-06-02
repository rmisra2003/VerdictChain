"""Audit logging helper for recording application-level actions."""

from __future__ import annotations

import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AuditLog


async def log_action(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    case_id: Optional[uuid.UUID] = None,
    details: Optional[dict[str, Any]] = None,
) -> AuditLog:
    """Create an :class:`AuditLog` record and persist it immediately.

    Parameters
    ----------
    db:
        The current async database session.
    action:
        A short verb describing what happened (e.g. ``"create"``, ``"upload"``).
    entity_type:
        The type of entity acted upon (e.g. ``"evidence"``, ``"case"``).
    entity_id:
        Primary key of the affected entity, if applicable.
    user_id:
        The user who performed the action, if known.
    case_id:
        The case the action relates to, if applicable.
    details:
        Free-form metadata stored as JSON on the audit row.

    Returns
    -------
    AuditLog
        The newly created and flushed audit record.
    """
    audit_entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        case_id=case_id,
        details=details or {},
    )
    db.add(audit_entry)
    await db.flush()
    await db.refresh(audit_entry)
    return audit_entry
