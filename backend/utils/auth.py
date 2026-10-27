import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "university-soc-jwt-secret-academic-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Centralized Role Permissions Matrix
ROLE_PERMISSIONS = {
    "ADMIN": [
        "VIEW_DASHBOARD",
        "VIEW_EVENTS",
        "VIEW_FINDINGS",
        "VIEW_USERS",
        "VIEW_IPS",
        "VIEW_VULNERABILITIES",
        "VIEW_ML",
        "VIEW_HEALTH",
        "VIEW_REPORTS",
        "MANAGE_USERS",
        "RUN_SCAN",
        "RUN_ML",
        "GENERATE_REPORT",
        "INGEST_LOGS",
    ],
    "SECURITY_ANALYST": [
        "VIEW_DASHBOARD",
        "VIEW_EVENTS",
        "VIEW_FINDINGS",
        "VIEW_USERS",
        "VIEW_IPS",
        "VIEW_VULNERABILITIES",
        "VIEW_ML",
        "VIEW_HEALTH",
        "VIEW_REPORTS",
        "RUN_SCAN",
        "RUN_ML",
        "GENERATE_REPORT",
        "INGEST_LOGS",
    ],
    "VIEWER": [
        "VIEW_DASHBOARD",
        "VIEW_EVENTS",
        "VIEW_FINDINGS",
        "VIEW_USERS",
        "VIEW_IPS",
        "VIEW_VULNERABILITIES",
        "VIEW_ML",
        "VIEW_HEALTH",
        "VIEW_REPORTS",
    ],
}

def hash_password(password: str) -> str:
    """Hashes a password securely using Werkzeug."""
    return generate_password_hash(password, method="pbkdf2:sha256")

def verify_password(stored_hash: str, password: str) -> bool:
    """Verifies a plaintext password against the stored Werkzeug hash."""
    if not stored_hash or not password:
        return False
    return check_password_hash(stored_hash, password)

def generate_jwt_token(user) -> str:
    """Generates a signed JWT access token for a user."""
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str):
    """Decodes and validates a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception as e:
        return None

def get_permissions_for_role(role: str) -> list:
    """Returns permission keys allowed for a given role."""
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["VIEWER"])

def token_required(f):
    """
    Decorator to protect routes. Extracts Bearer token from Authorization header.
    Verifies user exists, account is active, and attaches user to Flask g.current_user.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "Authentication token missing or invalid",
                "message": "Authorization header with Bearer token required",
                "status_code": 401
            }), 401

        token = auth_header.split(" ")[1].strip()
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({
                "error": "Invalid or expired token",
                "message": "Session expired or signature invalid. Please sign in again.",
                "status_code": 401
            }), 401

        from database.models import User
        sub_val = payload.get("sub")
        try:
            user_id = int(sub_val)
        except (ValueError, TypeError):
            user_id = sub_val

        user = User.query.get(user_id)
        if not user:
            return jsonify({
                "error": "User not found",
                "message": "Account associated with token no longer exists.",
                "status_code": 401
            }), 401

        if user.status != "Active":
            return jsonify({
                "error": "Account disabled",
                "message": f"Account is {user.status}. Contact administrator.",
                "status_code": 403
            }), 403

        g.current_user = user
        return f(*args, **kwargs)

    return decorated

def role_required(*allowed_roles):
    """
    Decorator ensuring user possesses one of the allowed roles.
    Must be applied after @token_required.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"error": "Unauthorized", "status_code": 401}), 401

            if user.role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden - Access Denied",
                    "message": f"Role '{user.role}' lacks permission for this action. Required: {', '.join(allowed_roles)}",
                    "status_code": 403
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator

def permission_required(permission: str):
    """
    Decorator ensuring user possesses a specific permission.
    Must be applied after @token_required.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"error": "Unauthorized", "status_code": 401}), 401

            user_perms = get_permissions_for_role(user.role)
            if permission not in user_perms:
                return jsonify({
                    "error": "Forbidden - Insufficient Permissions",
                    "message": f"Action requires permission '{permission}'. Role '{user.role}' is restricted.",
                    "status_code": 403
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
