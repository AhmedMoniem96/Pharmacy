from __future__ import annotations

from typing import Optional

from .models import AuditLog


def log_audit_event(
    *,
    company,
    user,
    action: str,
    entity_type: str,
    entity_id: Optional[int],
    summary: str,
):
    if not company or not user:
        return None
    return AuditLog.objects.create(
        company=company,
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else "",
        summary=summary,
    )
