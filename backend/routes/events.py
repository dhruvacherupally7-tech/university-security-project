from flask import Blueprint, jsonify, request
from database.models import SecurityEvent
from services.log_processor import LogProcessor
from utils.auth import token_required, permission_required

events_bp = Blueprint("events", __name__)

@events_bp.route("/events", methods=["GET"])
@token_required
def get_events():
    search = request.args.get("search", "").strip()
    event_type = request.args.get("event_type", "").strip()
    severity = request.args.get("severity", "").strip()
    username = request.args.get("username", "").strip()
    ip_address = request.args.get("ip_address", "").strip()
    status_code = request.args.get("status_code", "").strip()

    query = SecurityEvent.query

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (SecurityEvent.username.ilike(search_pattern)) |
            (SecurityEvent.ip_address.ilike(search_pattern)) |
            (SecurityEvent.resource.ilike(search_pattern)) |
            (SecurityEvent.message.ilike(search_pattern))
        )

    if event_type:
        query = query.filter_by(event_type=event_type)

    if severity:
        query = query.filter_by(severity=severity)

    if username:
        query = query.filter(SecurityEvent.username.ilike(f"%{username}%"))

    if ip_address:
        query = query.filter(SecurityEvent.ip_address.ilike(f"%{ip_address}%"))

    if status_code and status_code.isdigit():
        query = query.filter_by(status_code=int(status_code))

    total = query.count()

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 50, type=int)
    offset = (page - 1) * limit

    events = query.order_by(SecurityEvent.timestamp.desc()).offset(offset).limit(limit).all()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "events": [e.to_dict() for e in events]
    })


@events_bp.route("/events/<int:event_id>", methods=["GET"])
@token_required
def get_event(event_id):
    event = SecurityEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Security event not found"}), 404
    return jsonify(event.to_dict())


@events_bp.route("/logs/sync", methods=["POST"])
@token_required
@permission_required("INGEST_LOGS")
def sync_logs():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    raw_logs = data.get("logs") if isinstance(data, dict) and "logs" in data else data
    result = LogProcessor.process_and_store(raw_logs)
    return jsonify(result), 200
