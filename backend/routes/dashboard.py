from flask import Blueprint, jsonify
from sqlalchemy import func
from database.database import db
from database.models import SecurityEvent, ThreatFinding, User, IPAddress, Vulnerability, MLAnomaly
from utils.auth import token_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/summary", methods=["GET"])
@token_required
def get_dashboard_summary():
    # KPI Counts
    total_events = SecurityEvent.query.count()
    total_findings = ThreatFinding.query.count()
    active_users = User.query.filter_by(status="Active").count()
    monitored_ips = IPAddress.query.count()

    # Severity Counts
    high_severity = ThreatFinding.query.filter_by(severity="High").count()
    medium_severity = ThreatFinding.query.filter_by(severity="Medium").count()
    low_severity = ThreatFinding.query.filter_by(severity="Low").count()

    # ML Anomalies
    ml_anomalies = MLAnomaly.query.filter_by(is_anomaly=True).count()

    # Vulnerability Status Counts
    passed_vulnerabilities = Vulnerability.query.filter_by(status="Passed").count()
    warning_vulnerabilities = Vulnerability.query.filter_by(status="Warning").count()
    failed_vulnerabilities = Vulnerability.query.filter_by(status="Failed").count()

    # 1. Events by Type
    type_counts = (
        db.session.query(SecurityEvent.event_type, func.count(SecurityEvent.id))
        .group_by(SecurityEvent.event_type)
        .all()
    )
    events_by_type = [{"name": t[0], "value": t[1]} for t in type_counts]

    # 2. Events by Severity
    sev_counts = (
        db.session.query(SecurityEvent.severity, func.count(SecurityEvent.id))
        .group_by(SecurityEvent.severity)
        .all()
    )
    events_by_severity = [{"severity": s[0], "count": s[1]} for s in sev_counts]

    # 3. Events by Time (Chronological order)
    all_events = SecurityEvent.query.order_by(SecurityEvent.timestamp.asc()).all()
    # Group into hourly or chronological time buckets
    time_map = {}
    for ev in all_events:
        t_key = ev.timestamp.strftime("%H:%M") if ev.timestamp else "12:00"
        time_map[t_key] = time_map.get(t_key, 0) + 1

    events_by_time = [{"time": k, "events": v} for k, v in time_map.items()]

    # 4. Top Users
    user_counts = (
        db.session.query(SecurityEvent.username, func.count(SecurityEvent.id))
        .group_by(SecurityEvent.username)
        .order_by(func.count(SecurityEvent.id).desc())
        .limit(5)
        .all()
    )
    top_users = [{"username": u[0], "count": u[1]} for u in user_counts]

    # 5. Top IPs
    ip_counts = (
        db.session.query(SecurityEvent.ip_address, func.count(SecurityEvent.id))
        .group_by(SecurityEvent.ip_address)
        .order_by(func.count(SecurityEvent.id).desc())
        .limit(5)
        .all()
    )
    top_ips = [{"ip": ip[0], "count": ip[1]} for ip in ip_counts]

    # 6. Overall System Risk Score & Level
    all_findings = ThreatFinding.query.all()
    if all_findings:
        findings_risks = [f.to_dict()["risk_score"] for f in all_findings]
        overall_risk_score = min(max(int(round(sum(findings_risks) / len(findings_risks))), 10), 100)
    else:
        overall_risk_score = 25

    if overall_risk_score >= 80:
        overall_risk_level = "CRITICAL"
    elif overall_risk_score >= 60:
        overall_risk_level = "HIGH"
    elif overall_risk_score >= 30:
        overall_risk_level = "MEDIUM"
    else:
        overall_risk_level = "LOW"

    return jsonify({
        "total_events": total_events,
        "total_findings": total_findings,
        "active_users": active_users,
        "monitored_ips": monitored_ips,
        "high_severity": high_severity,
        "medium_severity": medium_severity,
        "low_severity": low_severity,
        "ml_anomalies": ml_anomalies,
        "passed_vulnerabilities": passed_vulnerabilities,
        "warning_vulnerabilities": warning_vulnerabilities,
        "failed_vulnerabilities": failed_vulnerabilities,
        "overall_risk_score": overall_risk_score,
        "overall_risk_level": overall_risk_level,
        "events_by_time": events_by_time,
        "events_by_type": events_by_type,
        "events_by_severity": events_by_severity,
        "top_users": top_users,
        "top_ips": top_ips
    })
