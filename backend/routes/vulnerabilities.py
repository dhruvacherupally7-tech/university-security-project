from flask import Blueprint, jsonify, request
from database.models import Vulnerability
from services.vulnerability_scanner import VulnerabilityScanner
from utils.auth import token_required, permission_required
from utils.audit import log_audit_action

vulnerabilities_bp = Blueprint("vulnerabilities", __name__)

@vulnerabilities_bp.route("/vulnerabilities", methods=["GET"])
@token_required
def get_vulnerabilities():
    vulns = Vulnerability.query.all()
    results = [v.to_dict() for v in vulns]

    summary = {
        "total": len(results),
        "passed": sum(1 for v in results if v["status"] == "Passed"),
        "warning": sum(1 for v in results if v["status"] == "Warning"),
        "failed": sum(1 for v in results if v["status"] == "Failed")
    }

    return jsonify({
        "summary": summary,
        "vulnerabilities": results
    })


@vulnerabilities_bp.route("/vulnerability/scan", methods=["POST"])
@token_required
@permission_required("RUN_SCAN")
def scan_vulnerabilities():
    data = request.get_json(silent=True) or {}
    target = data.get("target")

    results = VulnerabilityScanner.run_scan(target_url=target)

    summary = {
        "total": len(results),
        "passed": sum(1 for v in results if v["status"] == "Passed"),
        "warning": sum(1 for v in results if v["status"] == "Warning"),
        "failed": sum(1 for v in results if v["status"] == "Failed")
    }

    log_audit_action(
        "VULNERABILITY_AUDIT",
        resource_type="VULNERABILITY",
        resource_id=target or "local_headers",
        description=f"Executed security configuration audit scan. Passed: {summary['passed']}, Warnings: {summary['warning']}, Failed: {summary['failed']}"
    )

    return jsonify({
        "status": "success",
        "message": "Security configuration audit scan completed successfully.",
        "summary": summary,
        "vulnerabilities": results
    })
