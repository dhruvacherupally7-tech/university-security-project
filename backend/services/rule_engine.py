from datetime import datetime, timedelta
from database.database import db
from database.models import SecurityEvent, ThreatFinding

class RuleEngine:
    """
    Defensive rule correlation engine for University Security SOC.
    Evaluates incoming or existing events against 5 security rules.
    """

    @staticmethod
    def evaluate_all():
        """
        Runs comprehensive rule evaluation against recent events in the database
        and stores any newly discovered threat findings.
        """
        new_findings = []
        now = datetime.utcnow()
        time_window = now - timedelta(hours=24)

        events = SecurityEvent.query.filter(SecurityEvent.timestamp >= time_window).order_by(SecurityEvent.timestamp.asc()).all()
        if not events:
            return new_findings

        # Existing finding titles to prevent spam duplicates
        existing_evidence = set([f.evidence for f in ThreatFinding.query.all()])

        # RULE 1: Repeated failed login attempts (>= 3 failed logins in short window)
        failed_by_user = {}
        for ev in events:
            if ev.event_type == "LOGIN_FAILED" or ev.status_code == 401:
                key = (ev.username, ev.ip_address)
                failed_by_user.setdefault(key, []).append(ev)

        for (user, ip), fail_evs in failed_by_user.items():
            if len(fail_evs) >= 3:
                evidence = f"{len(fail_evs)} failed login attempts from user '{user}' at IP {ip} within active window."
                if evidence not in existing_evidence:
                    finding = ThreatFinding(
                        title=f"Potential Brute-Force / Credential Stuffing on {user}",
                        description="Repeated failed authentications detected over short interval indicative of password guessing.",
                        severity="High" if len(fail_evs) >= 5 else "Medium",
                        category="Credential Access",
                        username=user,
                        ip_address=ip,
                        event_id=fail_evs[-1].id,
                        evidence=evidence,
                        status="Investigating",
                        detection_method="Rule-Based",
                        confidence=0.89,
                        created_at=now
                    )
                    db.session.add(finding)
                    new_findings.append(finding)
                    existing_evidence.add(evidence)

        # RULE 2: Repeated HTTP 401 responses (>= 3)
        code_401_by_ip = {}
        for ev in events:
            if ev.status_code == 401:
                code_401_by_ip.setdefault(ev.ip_address, []).append(ev)

        for ip, evs_401 in code_401_by_ip.items():
            if len(evs_401) >= 3:
                evidence = f"IP {ip} received {len(evs_401)} HTTP 401 Unauthorized responses across multiple endpoints."
                if evidence not in existing_evidence:
                    finding = ThreatFinding(
                        title=f"Excessive 401 Unauthorized Responses from {ip}",
                        description="Client continues sending requests with absent or invalid authorization credentials.",
                        severity="Medium",
                        category="Authentication Bypass",
                        username=evs_401[0].username,
                        ip_address=ip,
                        event_id=evs_401[-1].id,
                        evidence=evidence,
                        status="Open",
                        detection_method="Rule-Based",
                        confidence=0.82,
                        created_at=now
                    )
                    db.session.add(finding)
                    new_findings.append(finding)
                    existing_evidence.add(evidence)

        # RULE 3: Repeated HTTP 403 responses (>= 2)
        code_403_by_ip = {}
        for ev in events:
            if ev.status_code == 403 or ev.event_type == "UNAUTHORIZED_ACCESS":
                code_403_by_ip.setdefault(ev.ip_address, []).append(ev)

        for ip, evs_403 in code_403_by_ip.items():
            if len(evs_403) >= 2:
                evidence = f"IP {ip} triggered {len(evs_403)} HTTP 403 Forbidden events attempting access to restricted scopes."
                if evidence not in existing_evidence:
                    finding = ThreatFinding(
                        title=f"Repeated Access Forbidden (403) from {ip}",
                        description="Client attempted repeated transactions against forbidden university resources.",
                        severity="High" if len(evs_403) >= 4 else "Medium",
                        category="Privilege Escalation",
                        username=evs_403[0].username,
                        ip_address=ip,
                        event_id=evs_403[-1].id,
                        evidence=evidence,
                        status="Investigating",
                        detection_method="Rule-Based",
                        confidence=0.87,
                        created_at=now
                    )
                    db.session.add(finding)
                    new_findings.append(finding)
                    existing_evidence.add(evidence)

        # RULE 4: Unauthorized access to /admin or /reports
        for ev in events:
            if any(priv in ev.resource.lower() for priv in ["/admin", "/reports"]):
                # If non-staff or status code is 401/403
                if ev.status_code in [401, 403] or ("student" in ev.username.lower() and "admin" in ev.resource.lower()):
                    evidence = f"Prohibited access attempt by '{ev.username}' ({ev.ip_address}) targeting privileged path '{ev.resource}' with status {ev.status_code}."
                    if evidence not in existing_evidence:
                        finding = ThreatFinding(
                            title=f"Privileged Resource Access Probe: {ev.resource}",
                            description="Unauthorized attempt to enumerate or access restricted administrative or reporting endpoints.",
                            severity="High" if "/admin" in ev.resource else "Medium",
                            category="Unauthorized Access",
                            username=ev.username,
                            ip_address=ev.ip_address,
                            event_id=ev.id,
                            evidence=evidence,
                            status="Investigating",
                            detection_method="Rule-Based",
                            confidence=0.94,
                            created_at=now
                        )
                        db.session.add(finding)
                        new_findings.append(finding)
                        existing_evidence.add(evidence)

        # RULE 5: Unusual repeated activity from the same IP (>= 15 requests in short window)
        ip_counts = {}
        for ev in events:
            ip_counts.setdefault(ev.ip_address, []).append(ev)

        for ip, ip_evs in ip_counts.items():
            if len(ip_evs) >= 15:
                evidence = f"IP {ip} generated {len(ip_evs)} events in 24h window, demonstrating high request volume."
                if evidence not in existing_evidence:
                    finding = ThreatFinding(
                        title=f"High Frequency Traffic Burst from {ip}",
                        description="Elevated volume of transactional log entries originated from a single host IP.",
                        severity="Low",
                        category="Traffic Anomaly",
                        username=ip_evs[0].username,
                        ip_address=ip,
                        event_id=ip_evs[-1].id,
                        evidence=evidence,
                        status="Open",
                        detection_method="Rule-Based",
                        confidence=0.72,
                        created_at=now
                    )
                    db.session.add(finding)
                    new_findings.append(finding)
        if new_findings:
            import json
            from services.risk_engine import calculate_finding_risk
            for f in new_findings:
                r_info = calculate_finding_risk(f)
                f.risk_score = r_info["risk_score"]
                f.risk_level = r_info["risk_level"]
                f.risk_factors = json.dumps(r_info["risk_factors"])

            db.session.commit()

        return new_findings
