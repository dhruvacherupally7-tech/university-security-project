from datetime import datetime
from sqlalchemy import func
from database.database import db
from database.models import SecurityEvent, ThreatFinding, User, IPAddress, Vulnerability, MLAnomaly, AuditReport

class ReportGenerator:
    """
    Generates comprehensive University Security SOC Audit Reports
    and persists an audit report entry in the database.
    """

    PROJECT_TITLE = "AI-Based Intelligent University Log Pre-Processing, Threat Detection, and Automated Security Vulnerability Scanning System"

    @classmethod
    def generate_report(cls, report_type="Comprehensive SOC Audit"):
        now = datetime.utcnow()

        # 1. High-level counts
        total_events = SecurityEvent.query.count()
        total_findings = ThreatFinding.query.count()
        
        high_findings = ThreatFinding.query.filter_by(severity="High").count()
        medium_findings = ThreatFinding.query.filter_by(severity="Medium").count()
        low_findings = ThreatFinding.query.filter_by(severity="Low").count()

        # 2. Vulnerability Posture
        total_vulns = Vulnerability.query.count()
        passed_vulns = Vulnerability.query.filter_by(status="Passed").count()
        warning_vulns = Vulnerability.query.filter_by(status="Warning").count()
        failed_vulns = Vulnerability.query.filter_by(status="Failed").count()
        vuln_list = [v.to_dict() for v in Vulnerability.query.all()]

        # 3. Top Users by Event Volume
        top_users_query = (
            db.session.query(SecurityEvent.username, func.count(SecurityEvent.id).label("count"))
            .group_by(SecurityEvent.username)
            .order_by(func.count(SecurityEvent.id).desc())
            .limit(5)
            .all()
        )
        top_users = [{"username": u[0], "event_count": u[1]} for u in top_users_query]

        # 4. Top IPs by Event Volume
        top_ips_query = (
            db.session.query(SecurityEvent.ip_address, func.count(SecurityEvent.id).label("count"))
            .group_by(SecurityEvent.ip_address)
            .order_by(func.count(SecurityEvent.id).desc())
            .limit(5)
            .all()
        )
        top_ips = [{"ip_address": ip[0], "event_count": ip[1]} for ip in top_ips_query]

        # 5. ML Anomaly Summary
        anomalies_count = MLAnomaly.query.filter_by(is_anomaly=True).count()
        total_ml_eval = MLAnomaly.query.count()

        # 6. Findings Breakdown
        recent_findings = [f.to_dict() for f in ThreatFinding.query.order_by(ThreatFinding.created_at.desc()).limit(10).all()]

        # 7. Actionable Recommendations
        recommendations = [
            "Enforce Multi-Factor Authentication (MFA) strictly across all student and staff portals to neutralize repeated failed login attempts.",
            "Implement automated rate limiting on administrative paths (/admin, /reports) to drop repeated unauthorized requests (HTTP 401/403).",
            "Configure mandatory HTTP Security Headers including strict Content-Security-Policy and HTTP Strict Transport Security (HSTS).",
            "Maintain continuous Isolation Forest anomaly scoring to baseline user request velocity and detect out-of-band resource probes early.",
            "Set HttpOnly, Secure, and SameSite=Lax flags on all authentication session cookies prior to staging or production deployment."
        ]

        # Persist report record
        report_name = f"University SOC Audit - {now.strftime('%Y-%m-%d %H:%M:%S UTC')}"
        report_record = AuditReport(
            report_name=report_name,
            report_type=report_type,
            total_events=total_events,
            total_findings=total_findings,
            high_severity=high_findings,
            medium_severity=medium_findings,
            low_severity=low_findings,
            vulnerabilities=total_vulns,
            generated_at=now
        )
        db.session.add(report_record)
        db.session.commit()

        # Assemble clean JSON response
        return {
            "report_id": report_record.id,
            "report_name": report_name,
            "project_title": cls.PROJECT_TITLE,
            "application_name": "University Security SOC",
            "report_type": report_type,
            "generated_at": now.isoformat(),
            "executive_summary": {
                "total_events": total_events,
                "total_findings": total_findings,
                "severity_posture": {
                    "high": high_findings,
                    "medium": medium_findings,
                    "low": low_findings
                },
                "vulnerability_posture": {
                    "total": total_vulns,
                    "passed": passed_vulns,
                    "warning": warning_vulns,
                    "failed": failed_vulns
                },
                "ml_anomaly_posture": {
                    "potential_anomalies": anomalies_count,
                    "total_profiles_evaluated": total_ml_eval,
                    "detection_model": "Isolation Forest"
                }
            },
            "top_active_users": top_users,
            "top_active_ips": top_ips,
            "threat_findings": recent_findings,
            "vulnerability_audit_details": vuln_list,
            "security_recommendations": recommendations
        }
