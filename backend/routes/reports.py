from flask import Blueprint, jsonify, request, send_file, g
from datetime import datetime
from database.models import (
    AuditReport,
    ThreatFinding,
    SecurityEvent,
    Vulnerability,
    AuditLog,
    db
)
from services.report_generator import ReportGenerator
from services.ml_engine import MLEngine
from utils.auth import token_required, permission_required
from utils.audit import log_audit_action
from utils.pdf_generator import generate_security_pdf

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/reports", methods=["GET"])
@token_required
def get_reports():
    reports = AuditReport.query.order_by(AuditReport.generated_at.desc()).all()
    return jsonify([r.to_dict() for r in reports])

@reports_bp.route("/reports/generate", methods=["POST"])
@token_required
@permission_required("GENERATE_REPORT")
def generate_report():
    data = request.get_json(silent=True) or {}
    report_type = data.get("report_type", "Comprehensive Security Audit")
    report = ReportGenerator.generate_report(report_type=report_type)

    log_audit_action(
        "GENERATE_REPORT",
        resource_type="REPORT",
        resource_id=report.get("id"),
        description=f"Generated report '{report.get('report_name')}' ({report_type})"
    )

    return jsonify(report), 201

@reports_bp.route("/reports/security-pdf", methods=["GET"])
@token_required
def download_security_pdf():
    """
    GET /api/reports/security-pdf
    Compiles live database records and generates a downloadable ReportLab PDF.
    """
    findings = ThreatFinding.query.order_by(ThreatFinding.created_at.desc()).all()
    events_count = SecurityEvent.query.count()

    # Event distribution
    from sqlalchemy import func
    ev_types_query = db.session.query(
        SecurityEvent.event_type, func.count(SecurityEvent.id)
    ).group_by(SecurityEvent.event_type).all()
    event_types = {k: v for k, v in ev_types_query}

    vulnerabilities = Vulnerability.query.all()
    ml_summary = MLEngine.get_summary()
    audit_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(15).all()

    current_user_name = g.current_user.full_name or g.current_user.username if hasattr(g, "current_user") and g.current_user else "SOC Administrator"

    db_data = {
        "findings": findings,
        "events_count": events_count,
        "event_types": event_types,
        "vulnerabilities": vulnerabilities,
        "ml_summary": ml_summary,
        "audit_logs": audit_logs,
        "generated_by": current_user_name,
        "report_date": datetime.utcnow()
    }

    pdf_buffer = generate_security_pdf(db_data)

    log_audit_action(
        "DOWNLOAD_REPORT",
        resource_type="REPORT",
        resource_id="SECURITY_PDF",
        description=f"User '{current_user_name}' exported and downloaded the official SOC Security Assessment PDF."
    )

    filename = f"University_SOC_Security_Report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )

