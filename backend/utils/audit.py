"""
Centralized Audit Logging Utility
Records administrative and security-relevant actions to the audit_logs table.
"""

from datetime import datetime
from flask import g, request
from database.models import db, AuditLog

def log_audit_action(action, resource_type=None, resource_id=None, description=None, user_id=None, username=None, ip_address=None):
    """
    Safely creates an AuditLog record.
    If user_id or username are not provided, attempts extraction from g.current_user.
    If ip_address is not provided, extracts client IP from active Flask request context.
    """
    try:
        # Extract user if available
        if not user_id and hasattr(g, "current_user") and g.current_user:
            user_id = g.current_user.id
            if not username:
                username = g.current_user.username

        if not username:
            username = "system"

        # Extract client IP if available
        if not ip_address:
            try:
                if request.headers.get("X-Forwarded-For"):
                    ip_address = request.headers.get("X-Forwarded-For").split(",")[0].strip()
                else:
                    ip_address = request.remote_addr or "127.0.0.1"
            except Exception:
                ip_address = "127.0.0.1"

        audit_entry = AuditLog(
            user_id=user_id,
            username=username,
            action=action.upper(),
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            description=description,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.session.add(audit_entry)
        db.session.commit()
        return audit_entry
    except Exception as e:
        print(f"  [Audit Log Error] Failed to log action '{action}': {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return None
