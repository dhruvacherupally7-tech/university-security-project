from flask import Blueprint, jsonify, request
from database.models import ThreatFinding, SecurityEvent, db
from utils.auth import token_required, permission_required
from utils.audit import log_audit_action
from services.risk_engine import generate_alert_explanation

findings_bp = Blueprint("findings", __name__)

@findings_bp.route("/findings", methods=["GET"])
@token_required
def get_findings():
    severity = request.args.get("severity", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    detection_method = request.args.get("detection_method", "").strip()
    search = request.args.get("search", "").strip()

    query = ThreatFinding.query

    if severity:
        query = query.filter_by(severity=severity)
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if detection_method:
        query = query.filter_by(detection_method=detection_method)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (ThreatFinding.title.ilike(search_pattern)) |
            (ThreatFinding.description.ilike(search_pattern)) |
            (ThreatFinding.evidence.ilike(search_pattern)) |
            (ThreatFinding.username.ilike(search_pattern)) |
            (ThreatFinding.ip_address.ilike(search_pattern))
        )

    findings = query.order_by(ThreatFinding.created_at.desc()).all()

    # Calculate summary metrics
    total = len(findings)
    high_count = sum(1 for f in findings if f.severity in ["High", "Critical"])
    med_count = sum(1 for f in findings if f.severity == "Medium")
    low_count = sum(1 for f in findings if f.severity == "Low")

    # Average risk score across findings
    avg_risk = round(sum(f.to_dict()["risk_score"] for f in findings) / total, 1) if total else 0

    return jsonify({
        "total": total,
        "average_risk_score": avg_risk,
        "summary": {
            "high": high_count,
            "medium": med_count,
            "low": low_count
        },
        "findings": [f.to_dict() for f in findings]
    })


@findings_bp.route("/findings/<int:finding_id>", methods=["GET"])
@token_required
def get_finding(finding_id):
    finding = ThreatFinding.query.get(finding_id)
    if not finding:
        return jsonify({"error": "Threat finding not found"}), 404

    # Log audit action
    log_audit_action("VIEW_FINDING", "THREAT_FINDING", finding.id, f"Viewed Threat Finding #{finding.id}: {finding.title}")

    return jsonify(finding.to_dict())


@findings_bp.route("/findings/<int:finding_id>/explanation", methods=["GET"])
@token_required
def get_finding_explanation(finding_id):
    """
    GET /api/findings/<id>/explanation
    Returns a comprehensive, deterministic AI Alert Explanation
    grounded strictly on actual finding details and related security events.
    """
    finding = ThreatFinding.query.get(finding_id)
    if not finding:
        return jsonify({"error": "Threat finding not found"}), 404

    # Fetch recent related security events for this user or IP
    related_events = []
    if finding.username or finding.ip_address:
        q = SecurityEvent.query
        filters = []
        if finding.username:
            filters.append(SecurityEvent.username == finding.username)
        if finding.ip_address:
            filters.append(SecurityEvent.ip_address == finding.ip_address)
        if filters:
            from sqlalchemy import or_
            related_events = q.filter(or_(*filters)).order_by(SecurityEvent.timestamp.desc()).limit(8).all()

    explanation = generate_alert_explanation(finding, related_events)

    # Log audit action
    log_audit_action("VIEW_AI_EXPLANATION", "THREAT_FINDING", finding.id, f"Retrieved AI Alert Explanation for finding #{finding.id}")

    return jsonify(explanation), 200


@findings_bp.route("/findings/<int:finding_id>/status", methods=["PATCH"])
@token_required
@permission_required("VIEW_FINDINGS")
def update_finding_status(finding_id):
    """
    PATCH /api/findings/<id>/status
    Updates the lifecycle status of a threat finding (Open, Investigating, Resolved).
    """
    finding = ThreatFinding.query.get(finding_id)
    if not finding:
        return jsonify({"error": "Threat finding not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status", "").strip().capitalize()
    if new_status not in ["Open", "Investigating", "Resolved"]:
        return jsonify({"error": "Status must be 'Open', 'Investigating', or 'Resolved'"}), 400

    old_status = finding.status
    finding.status = new_status
    db.session.commit()

    log_audit_action("UPDATE_FINDING", "THREAT_FINDING", finding.id, f"Updated finding #{finding.id} status from '{old_status}' to '{new_status}'")

    return jsonify({
        "message": f"Finding #{finding.id} status updated to {new_status}.",
        "finding": finding.to_dict()
    }), 200

