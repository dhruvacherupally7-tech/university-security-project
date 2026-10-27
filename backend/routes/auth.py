import re
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from database.database import db
from database.models import User
from utils.auth import (
    hash_password,
    verify_password,
    generate_jwt_token,
    token_required,
    ROLE_PERMISSIONS,
    get_permissions_for_role,
)
from utils.audit import log_audit_action

auth_bp = Blueprint("auth_bp", __name__)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

def validate_password_strength(password: str):
    """
    Validates password strength:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    return True, None

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    POST /api/auth/register
    Registers a new user account with validation and password hashing.
    Public registration creates VIEWER or SECURITY_ANALYST. ADMIN cannot be registered publicly.
    """
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    department = data.get("department", "University Campus").strip()
    requested_role = data.get("role", "VIEWER").strip()

    # Validation
    if not full_name:
        return jsonify({"error": "Full Name is required.", "status_code": 400}), 400

    if not username or len(username) < 3:
        return jsonify({"error": "Username is required (minimum 3 characters).", "status_code": 400}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "A valid email address is required.", "status_code": 400}), 400

    is_strong, err_msg = validate_password_strength(password)
    if not is_strong:
        return jsonify({"error": err_msg, "status_code": 400}), 400

    # Check for duplicates
    if User.query.filter_by(username=username).first():
        return jsonify({"error": f"Username '{username}' is already in use.", "status_code": 409}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"error": f"Email '{email}' is already registered.", "status_code": 409}), 409

    # Security rule: Do not allow arbitrary creation of ADMIN accounts
    if requested_role.upper() == "ADMIN":
        return jsonify({
            "error": "Forbidden",
            "message": "Administrator accounts cannot be created via public registration.",
            "status_code": 403
        }), 403

    # Public registration strictly defaults to VIEWER role (Least Privilege)
    # Administrative or Analyst promotions are performed by administrators in /admin/users
    role = "VIEWER"

    new_user = User(
        full_name=full_name,
        username=username,
        email=email,
        password_hash=hash_password(password),
        department=department,
        role=role,
        status="Active",
        created_at=datetime.utcnow()
    )

    db.session.add(new_user)
    db.session.commit()

    log_audit_action(
        "USER_REGISTERED",
        resource_type="USER",
        resource_id=new_user.id,
        description=f"Public registration: User '{new_user.username}' created with role '{new_user.role}' in department '{new_user.department}'",
        user_id=new_user.id,
        username=new_user.username
    )

    return jsonify({
        "message": "Account created successfully.",
        "user": new_user.to_dict()
    }), 201

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    POST /api/auth/login
    Authenticates username or email against stored password hash.
    Returns JWT access_token, user info, role, and permissions.
    """
    data = request.get_json() or {}
    identifier = data.get("username_or_email", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password are required.", "status_code": 400}), 400

    # Query by username OR email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        log_audit_action(
            "FAILED_LOGIN",
            resource_type="AUTH",
            resource_id=None,
            description=f"Failed login attempt for identifier '{identifier}' (invalid credentials)",
            username=identifier
        )
        return jsonify({
            "error": "Invalid username or password.",
            "message": "Authentication failed. Check your credentials.",
            "status_code": 401
        }), 401

    if user.status != "Active":
        log_audit_action(
            "FAILED_LOGIN",
            resource_type="AUTH",
            resource_id=user.id,
            description=f"Rejected login attempt for '{user.username}': Account status is '{user.status}'",
            user_id=user.id,
            username=user.username
        )
        return jsonify({
            "error": "Account disabled.",
            "message": f"This account is {user.status}. Contact your SOC system administrator.",
            "status_code": 403
        }), 403

    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Log successful login
    log_audit_action(
        "LOGIN",
        resource_type="AUTH",
        resource_id=user.id,
        description=f"Successful login for user '{user.username}' ({user.role})",
        user_id=user.id,
        username=user.username
    )

    # Generate JWT
    token = generate_jwt_token(user)

    return jsonify({
        "access_token": token,
        "token_type": "Bearer",
        "user": user.to_auth_dict(),
        "role": user.role,
        "permissions": user.get_permissions(),
        "message": f"Welcome back, {user.full_name or user.username}."
    }), 200

@auth_bp.route("/auth/me", methods=["GET"])
@token_required
def get_current_user():
    """
    GET /api/auth/me
    Returns current authenticated user profile, active role, and permission array.
    """
    user = g.current_user
    return jsonify(user.to_auth_dict()), 200

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """
    POST /api/auth/logout
    Stateless JWT client-side termination confirmation.
    """
    log_audit_action(
        "LOGOUT",
        resource_type="AUTH",
        resource_id=None,
        description="User signed out of SOC session"
    )
    return jsonify({
        "message": "Logged out successfully.",
        "status": "success"
    }), 200

@auth_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """
    POST /api/auth/forgot-password
    Academic local prototype reset initiation. Never reveals if account exists.
    """
    data = request.get_json() or {}
    identifier = data.get("username_or_email", "").strip()

    if not identifier:
        return jsonify({"error": "Username or email is required.", "status_code": 400}), 400

    # User lookup
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    # Academic prototype hint for local testing convenience
    prototype_hint = "For this local SOC academic prototype, you can proceed to the Reset Password step directly." if user else None

    return jsonify({
        "message": "If the account exists, password reset instructions would be provided.",
        "prototype_available": bool(user),
        "prototype_hint": prototype_hint
    }), 200

@auth_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """
    POST /api/auth/reset-password
    Academic local prototype reset execution.
    """
    data = request.get_json() or {}
    identifier = data.get("username_or_email", "").strip()
    new_password = data.get("new_password", "")

    if not identifier or not new_password:
        return jsonify({"error": "Identifier and new password are required.", "status_code": 400}), 400

    is_strong, err_msg = validate_password_strength(new_password)
    if not is_strong:
        return jsonify({"error": err_msg, "status_code": 400}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user:
        # Generic message to avoid email enumeration
        return jsonify({"message": "If the account exists, password reset instructions would be provided."}), 200

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "message": "Password updated successfully. You can now log in with your new password.",
        "status": "success"
    }), 200

@auth_bp.route("/auth/permissions", methods=["GET"])
def get_permissions_matrix():
    """
    GET /api/auth/permissions
    Returns the centralized RBAC permissions matrix.
    """
    return jsonify({
        "roles": ROLE_PERMISSIONS,
        "available_roles": ["ADMIN", "SECURITY_ANALYST", "VIEWER"]
    }), 200
