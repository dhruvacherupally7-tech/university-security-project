from flask import Blueprint, jsonify
from database.models import User, SecurityEvent
from utils.auth import token_required

users_bp = Blueprint("users", __name__)

@users_bp.route("/users", methods=["GET"])
@token_required
def get_users():
    users = User.query.all()
    result = []

    for u in users:
        u_events = SecurityEvent.query.filter_by(username=u.username).all()
        event_count = len(u_events)
        failed_logins = sum(1 for e in u_events if e.event_type == "LOGIN_FAILED" or e.status_code == 401)
        successful_logins = sum(1 for e in u_events if e.event_type == "LOGIN_SUCCESS" or (e.resource == "/login" and e.status_code == 200))
        
        # Determine user risk level based on failed logins / unauthorized activity
        unauth_count = sum(1 for e in u_events if e.status_code == 403)
        if failed_logins >= 4 or unauth_count >= 2:
            risk_level = "High"
        elif failed_logins >= 1 or unauth_count >= 1:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        latest_event = SecurityEvent.query.filter_by(username=u.username).order_by(SecurityEvent.timestamp.desc()).first()
        last_activity = latest_event.timestamp.isoformat() if latest_event and latest_event.timestamp else None

        user_data = u.to_dict()
        user_data.update({
            "event_count": event_count,
            "failed_logins": failed_logins,
            "successful_logins": successful_logins,
            "risk_level": risk_level,
            "last_activity": last_activity
        })
        result.append(user_data)

    return jsonify(result)


@users_bp.route("/users/<username>", methods=["GET"])
@token_required
def get_user(username):
    user = User.query.filter(User.username.ilike(username)).first()
    if not user:
        return jsonify({"error": f"User '{username}' not found"}), 404

    events = SecurityEvent.query.filter(SecurityEvent.username.ilike(username)).order_by(SecurityEvent.timestamp.desc()).all()
    failed_logins = sum(1 for e in events if e.event_type == "LOGIN_FAILED" or e.status_code == 401)
    successful_logins = sum(1 for e in events if e.event_type == "LOGIN_SUCCESS" or (e.resource == "/login" and e.status_code == 200))
    unauth_count = sum(1 for e in events if e.status_code == 403)

    if failed_logins >= 4 or unauth_count >= 2:
        risk_level = "High"
    elif failed_logins >= 1 or unauth_count >= 1:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    data = user.to_dict()
    data.update({
        "event_count": len(events),
        "failed_logins": failed_logins,
        "successful_logins": successful_logins,
        "risk_level": risk_level,
        "recent_events": [e.to_dict() for e in events[:10]]
    })
    return jsonify(data)
