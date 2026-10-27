from flask import Blueprint, jsonify
from database.models import IPAddress, SecurityEvent
from utils.auth import token_required

ips_bp = Blueprint("ips", __name__)

@ips_bp.route("/ips", methods=["GET"])
@token_required
def get_ips():
    ips = IPAddress.query.all()
    results = []
    for ip in ips:
        ip_dict = ip.to_dict()
        # Ensure fresh event counts and unique users
        evs = SecurityEvent.query.filter_by(ip_address=ip.ip_address).all()
        ip_dict["event_count"] = len(evs)
        ip_dict["user_count"] = len(set(e.username for e in evs)) if evs else ip.user_count
        results.append(ip_dict)
    return jsonify(results)


@ips_bp.route("/ips/<ip_addr>", methods=["GET"])
@token_required
def get_ip(ip_addr):
    ip = IPAddress.query.filter_by(ip_address=ip_addr).first()
    if not ip:
        return jsonify({"error": f"IP address '{ip_addr}' not found"}), 404

    events = SecurityEvent.query.filter_by(ip_address=ip_addr).order_by(SecurityEvent.timestamp.desc()).all()
    data = ip.to_dict()
    data["event_count"] = len(events)
    data["user_count"] = len(set(e.username for e in events))
    data["recent_events"] = [e.to_dict() for e in events[:10]]
    return jsonify(data)
