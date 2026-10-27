from flask import Blueprint, jsonify, request, g
from datetime import datetime
from database.models import AuditLog
from utils.auth import token_required

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/audit-logs", methods=["GET"])
@token_required
def get_audit_logs():
    """
    GET /api/audit-logs
    Returns paginated and filtered audit log entries.
    RBAC: ADMIN has full access; SECURITY_ANALYST has security-relevant log access; VIEWER is rejected (403).
    """
    current_role = g.current_user.role

    if current_role == "VIEWER":
        return jsonify({
            "error": "Forbidden - Insufficient Clearance",
            "message": "Viewer role cannot access system audit trails.",
            "status_code": 403
        }), 403

    # Query Parameters
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 25, type=int)
    search = request.args.get("search", "").strip()
    action = request.args.get("action", "").strip()
    username = request.args.get("username", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()

    query = AuditLog.query

    # Analysts only see security-relevant actions
    if current_role == "SECURITY_ANALYST":
        query = query.filter(AuditLog.action.in_([
            "LOGIN", "LOGOUT", "FAILED_LOGIN", "VULNERABILITY_AUDIT",
            "ML_ANALYSIS_EXECUTED", "VIEW_FINDING", "UPDATE_FINDING", "GENERATE_REPORT"
        ]))

    # Filters
    if action:
        query = query.filter(AuditLog.action == action.upper())

    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (AuditLog.description.ilike(search_pattern)) |
            (AuditLog.action.ilike(search_pattern)) |
            (AuditLog.username.ilike(search_pattern)) |
            (AuditLog.ip_address.ilike(search_pattern)) |
            (AuditLog.resource_type.ilike(search_pattern))
        )

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            pass

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

    # Distinct actions for filter dropdown
    distinct_actions = [r[0] for r in AuditLog.query.with_entities(AuditLog.action).distinct().all()]

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "distinct_actions": sorted(distinct_actions),
        "audit_logs": [l.to_dict() for l in logs]
    }), 200
