from flask import Blueprint, request, jsonify, g
from database.database import db
from database.models import User
from utils.auth import token_required, role_required
from utils.audit import log_audit_action

admin_bp = Blueprint("admin_bp", __name__)

@admin_bp.route("/admin/users", methods=["GET"])
@token_required
@role_required("ADMIN")
def list_admin_users():
    """
    GET /api/admin/users
    ADMIN-only user management roster. Supports role and status filtering.
    """
    role = request.args.get("role")
    status = request.args.get("status")
    search = request.args.get("search", "").strip().lower()

    query = User.query

    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.department.ilike(f"%{search}%"))
        )

    users = query.order_by(User.id.asc()).all()
    return jsonify({
        "total": len(users),
        "users": [u.to_dict() for u in users]
    }), 200

@admin_bp.route("/admin/users/<int:user_id>/role", methods=["PATCH"])
@token_required
@role_required("ADMIN")
def update_user_role(user_id):
    """
    PATCH /api/admin/users/<id>/role
    Updates user role (ADMIN, SECURITY_ANALYST, VIEWER).
    Safeguard: Prevents removing the final active ADMIN.
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_role = data.get("role", "").strip().upper()

    ALLOWED_ROLES = ["ADMIN", "SECURITY_ANALYST", "VIEWER"]
    if new_role not in ALLOWED_ROLES:
        return jsonify({
            "error": "Invalid role",
            "message": f"Role must be one of: {', '.join(ALLOWED_ROLES)}",
            "status_code": 400
        }), 400

    # Safeguard: Do not allow demoting the final active admin
    if user.role == "ADMIN" and new_role != "ADMIN":
        active_admins = User.query.filter_by(role="ADMIN", status="Active").count()
        if active_admins <= 1:
            return jsonify({
                "error": "Safeguard Triggered",
                "message": "Cannot demote the final active Administrator. Promote another account to ADMIN first.",
                "status_code": 400
            }), 400

    old_role = user.role
    user.role = new_role
    db.session.commit()

    log_audit_action(
        "ROLE_CHANGED",
        resource_type="USER",
        resource_id=user.id,
        description=f"Changed user '{user.username}' role from {old_role} to {new_role}"
    )

    return jsonify({
        "message": f"User '{user.username}' role updated to {user.role}.",
        "user": user.to_dict()
    }), 200

@admin_bp.route("/admin/users/<int:user_id>/status", methods=["PATCH"])
@token_required
@role_required("ADMIN")
def update_user_status(user_id):
    """
    PATCH /api/admin/users/<id>/status
    Activates or deactivates a user account.
    Safeguard: Prevents deactivating the final active ADMIN account.
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().capitalize()

    if new_status not in ["Active", "Disabled", "Suspended", "Inactive"]:
        return jsonify({
            "error": "Invalid status",
            "message": "Status must be 'Active', 'Disabled', 'Inactive', or 'Suspended'.",
            "status_code": 400
        }), 400

    # Safeguard: Do not deactivate the final active admin
    if user.role == "ADMIN" and new_status != "Active":
        active_admins = User.query.filter_by(role="ADMIN", status="Active").count()
        if active_admins <= 1:
            return jsonify({
                "error": "Safeguard Triggered",
                "message": "Cannot deactivate the final active Administrator.",
                "status_code": 400
            }), 400

    old_status = user.status
    user.status = new_status
    db.session.commit()

    log_audit_action(
        "STATUS_CHANGED",
        resource_type="USER",
        resource_id=user.id,
        description=f"Changed user '{user.username}' status from '{old_status}' to '{new_status}'"
    )

    return jsonify({
        "message": f"User '{user.username}' status set to {user.status}.",
        "user": user.to_dict()
    }), 200
