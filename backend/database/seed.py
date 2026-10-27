from datetime import datetime, timedelta
import json
from database.database import db
from database.models import User, IPAddress, SecurityEvent, ThreatFinding, Vulnerability, MLAnomaly, SystemHealth, AuditReport

def seed_database(force=False):
    """
    Seeds realistic demo data into the SQLite database.
    Only seeds when tables are empty unless force=True.
    """
    # Avoid duplicate demo records
    if not force and SecurityEvent.query.first():
        return

    now = datetime.utcnow()

    # 1. System Users with RBAC Roles & Secure Password Hashes
    from utils.auth import hash_password

    users = [
        User(
            username="admin",
            full_name="SOC Administrator",
            email="admin@university.local",
            password_hash=hash_password("Admin@123"),
            role="ADMIN",
            department="Information Security SOC",
            status="Active",
            created_at=now - timedelta(days=90),
            last_login=now - timedelta(hours=2)
        ),
        User(
            username="analyst",
            full_name="SOC Senior Analyst",
            email="analyst@university.local",
            password_hash=hash_password("Analyst@123"),
            role="SECURITY_ANALYST",
            department="Cyber Threat Intelligence",
            status="Active",
            created_at=now - timedelta(days=60),
            last_login=now - timedelta(hours=4)
        ),
        User(
            username="viewer",
            full_name="Campus Security Auditor",
            email="viewer@university.local",
            password_hash=hash_password("Viewer@123"),
            role="VIEWER",
            department="IT Compliance",
            status="Active",
            created_at=now - timedelta(days=30),
            last_login=now - timedelta(days=1)
        ),
        User(
            username="staff01",
            full_name="Dr. Marcus Vance",
            email="staff01@university.local",
            password_hash=hash_password("Staff@123"),
            role="SECURITY_ANALYST",
            department="Academic Affairs",
            status="Active",
            created_at=now - timedelta(days=120),
            last_login=now - timedelta(days=2)
        ),
        User(
            username="student123",
            full_name="Alex Chen",
            email="student123@university.local",
            password_hash=hash_password("Student@123"),
            role="VIEWER",
            department="Computer Science",
            status="Active",
            created_at=now - timedelta(days=60),
            last_login=now - timedelta(days=3)
        ),
        User(
            username="student456",
            full_name="Priya Sharma",
            email="student456@university.local",
            password_hash=hash_password("Student@123"),
            role="VIEWER",
            department="Electrical Engineering",
            status="Active",
            created_at=now - timedelta(days=45),
            last_login=now - timedelta(days=4)
        )
    ]
    db.session.add_all(users)

    # 2. Monitored IP Addresses (At least 3 IP addresses)
    ips = [
        IPAddress(
            ip_address="192.168.1.25",
            location="CS Lab - Campus West",
            device="Desktop Workstation (Linux/X11)",
            user_count=1,
            event_count=15,
            risk_level="Medium",
            last_seen=now - timedelta(minutes=5)
        ),
        IPAddress(
            ip_address="192.168.1.30",
            location="Library Wi-Fi Zone B",
            device="Mobile Device (Android 14)",
            user_count=1,
            event_count=11,
            risk_level="Low",
            last_seen=now - timedelta(minutes=12)
        ),
        IPAddress(
            ip_address="192.168.1.45",
            location="Admin Building - Room 302",
            device="Staff Laptop (macOS 14)",
            user_count=2,
            event_count=20,
            risk_level="High",
            last_seen=now - timedelta(minutes=2)
        )
    ]
    db.session.add_all(ips)

    # 3. Exactly 46 Security Events
    # Simulates realistic university day across resources: /login, /attendance, /students, /profile, /admin, /reports
    # HTTP status codes: 200, 201, 401, 403, 404, 500
    # Includes: repeated failed logins, unauthorized /admin access, repeated 401s, repeated 403s
    event_specs = [
        # 1-6: Normal morning routine
        (now - timedelta(hours=8, minutes=10), "student123", "192.168.1.25", "LOGIN_SUCCESS", 200, "/login", "User student123 logged in successfully", "Low"),
        (now - timedelta(hours=8, minutes=8), "student123", "192.168.1.25", "RESOURCE_ACCESS", 200, "/profile", "Student profile access", "Low"),
        (now - timedelta(hours=8, minutes=5), "student123", "192.168.1.25", "RESOURCE_ACCESS", 200, "/attendance", "Attendance portal access", "Low"),
        (now - timedelta(hours=8, minutes=2), "student123", "192.168.1.25", "RESOURCE_ACCESS", 200, "/students", "User accessed student course catalog", "Low"),
        (now - timedelta(hours=7, minutes=50), "student123", "192.168.1.25", "LOGOUT", 200, "/login", "User student123 logged out cleanly", "Low"),
        (now - timedelta(hours=7, minutes=45), "student456", "192.168.1.30", "LOGIN_SUCCESS", 200, "/login", "Successful login via library Wi-Fi", "Low"),

        # 7-12: student456 browsing & single 403
        (now - timedelta(hours=7, minutes=40), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/attendance", "Attendance access verified", "Low"),
        (now - timedelta(hours=7, minutes=35), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/profile", "Student profile view retrieved", "Low"),
        (now - timedelta(hours=7, minutes=30), "student456", "192.168.1.30", "UNAUTHORIZED_ACCESS", 403, "/admin", "Unauthorized access attempt to /admin", "Medium"),
        (now - timedelta(hours=7, minutes=25), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/students", "Viewed student schedule", "Low"),
        (now - timedelta(hours=7, minutes=20), "student456", "192.168.1.30", "LOGOUT", 200, "/login", "Session ended cleanly", "Low"),
        (now - timedelta(hours=6, minutes=50), "staff01", "192.168.1.45", "LOGIN_SUCCESS", 200, "/login", "Successful login by faculty administrator", "Low"),

        # 13-18: staff01 authorized operations
        (now - timedelta(hours=6, minutes=45), "staff01", "192.168.1.45", "ADMIN_ACCESS", 200, "/admin", "Administrative console accessed by authorized staff", "Low"),
        (now - timedelta(hours=6, minutes=40), "staff01", "192.168.1.45", "RESOURCE_ACCESS", 200, "/reports", "Report access for department grading", "Low"),
        (now - timedelta(hours=6, minutes=35), "staff01", "192.168.1.45", "RESOURCE_ACCESS", 201, "/students", "Updated grade records for semester", "Low"),
        (now - timedelta(hours=6, minutes=30), "staff01", "192.168.1.45", "RESOURCE_ACCESS", 200, "/attendance", "Validated instructor timesheet", "Low"),
        (now - timedelta(hours=6, minutes=10), "staff01", "192.168.1.45", "LOGOUT", 200, "/login", "Staff logged out", "Low"),
        (now - timedelta(hours=5, minutes=55), "student123", "192.168.1.25", "LOGIN_FAILED", 401, "/login", "Repeated failed login attempt #1", "Low"),

        # 19-24: Repeated failed logins on student123 (Brute force pattern)
        (now - timedelta(hours=5, minutes=54), "student123", "192.168.1.25", "LOGIN_FAILED", 401, "/login", "Repeated failed login attempt #2", "Medium"),
        (now - timedelta(hours=5, minutes=53), "student123", "192.168.1.25", "LOGIN_FAILED", 401, "/login", "Repeated failed login attempt #3", "Medium"),
        (now - timedelta(hours=5, minutes=52), "student123", "192.168.1.25", "LOGIN_FAILED", 401, "/login", "Repeated failed login attempt #4", "High"),
        (now - timedelta(hours=5, minutes=50), "student123", "192.168.1.25", "LOGIN_SUCCESS", 200, "/login", "Successful login following credentials reset", "Low"),
        (now - timedelta(hours=5, minutes=45), "student123", "192.168.1.25", "RESOURCE_ACCESS", 200, "/profile", "Student profile access", "Low"),
        (now - timedelta(hours=5, minutes=30), "student123", "192.168.1.25", "LOGOUT", 200, "/login", "User student123 logged out", "Low"),

        # 25-30: Suspicious probes & repeated 403 responses
        (now - timedelta(hours=4, minutes=40), "student123", "192.168.1.45", "UNAUTHORIZED_ACCESS", 403, "/admin", "Unauthorized access to /admin", "High"),
        (now - timedelta(hours=4, minutes=38), "student123", "192.168.1.45", "UNAUTHORIZED_ACCESS", 403, "/reports", "Repeated 403 response on /reports", "High"),
        (now - timedelta(hours=4, minutes=35), "student123", "192.168.1.45", "RESOURCE_ACCESS", 404, "/admin/config.php", "Probe to non-existent admin configuration", "Medium"),
        (now - timedelta(hours=4, minutes=30), "student123", "192.168.1.45", "RESOURCE_ACCESS", 500, "/reports/export", "500 Internal error caused by invalid payload", "Medium"),
        (now - timedelta(hours=4, minutes=15), "student456", "192.168.1.30", "LOGIN_SUCCESS", 200, "/login", "Successful login", "Low"),
        (now - timedelta(hours=4, minutes=10), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/attendance", "Attendance access", "Low"),

        # 31-36: Midday campus activity
        (now - timedelta(hours=3, minutes=50), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/students", "Student course catalog access", "Low"),
        (now - timedelta(hours=3, minutes=40), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/profile", "Student profile access", "Low"),
        (now - timedelta(hours=3, minutes=20), "student456", "192.168.1.30", "LOGOUT", 200, "/login", "Logout", "Low"),
        (now - timedelta(hours=2, minutes=50), "staff01", "192.168.1.45", "LOGIN_SUCCESS", 200, "/login", "Successful login", "Low"),
        (now - timedelta(hours=2, minutes=45), "staff01", "192.168.1.45", "ADMIN_ACCESS", 200, "/admin", "Authorized admin access", "Low"),
        (now - timedelta(hours=2, minutes=40), "staff01", "192.168.1.45", "RESOURCE_ACCESS", 200, "/reports", "Report access", "Low"),

        # 37-41: Repeated 401 responses on 192.168.1.25
        (now - timedelta(hours=2, minutes=10), "student123", "192.168.1.25", "LOGIN_FAILED", 401, "/login", "Repeated 401 response - missing credentials", "Low"),
        (now - timedelta(hours=2, minutes=8), "student123", "192.168.1.25", "UNAUTHORIZED_ACCESS", 401, "/profile", "Repeated 401 response - unauthenticated", "Low"),
        (now - timedelta(hours=2, minutes=5), "student123", "192.168.1.25", "UNAUTHORIZED_ACCESS", 401, "/attendance", "Repeated 401 response - token expired", "Medium"),
        (now - timedelta(hours=1, minutes=45), "student456", "192.168.1.30", "LOGIN_SUCCESS", 200, "/login", "Successful login", "Low"),
        (now - timedelta(hours=1, minutes=40), "student456", "192.168.1.30", "RESOURCE_ACCESS", 200, "/attendance", "Attendance access", "Low"),

        # 42-46: Concluding events (total 46 records)
        (now - timedelta(hours=1, minutes=20), "staff01", "192.168.1.45", "RESOURCE_ACCESS", 200, "/students", "Student records review", "Low"),
        (now - timedelta(hours=1, minutes=10), "staff01", "192.168.1.45", "ADMIN_ACCESS", 200, "/admin", "System status verification", "Low"),
        (now - timedelta(hours=0, minutes=45), "student123", "192.168.1.25", "LOGIN_SUCCESS", 200, "/login", "Successful login", "Low"),
        (now - timedelta(hours=0, minutes=30), "student123", "192.168.1.25", "RESOURCE_ACCESS", 200, "/attendance", "Attendance access", "Low"),
        (now - timedelta(hours=0, minutes=10), "staff01", "192.168.1.45", "LOGOUT", 200, "/login", "Staff logout", "Low"),
    ]

    events = []
    for ts, user, ip, ev_type, code, res, msg, sev in event_specs:
        events.append(SecurityEvent(
            timestamp=ts,
            username=user,
            ip_address=ip,
            event_type=ev_type,
            status_code=code,
            resource=res,
            message=msg,
            severity=sev,
            processed=1,
            created_at=ts
        ))

    db.session.add_all(events)
    db.session.flush()

    # 4. Exactly 5 Threat Findings (Posture: 1 High, 3 Medium, 1 Low)
    findings = [
        ThreatFinding(
            title="Unauthorized Admin Resource Enumeration & Access",
            description="Multiple unauthorized HTTP 403 requests detected targeting privileged administrative paths (/admin and /reports).",
            severity="High",  # 1 High
            category="Privilege Escalation",
            username="student123",
            ip_address="192.168.1.45",
            event_id=events[24].id,
            evidence="Detected HTTP 403 Forbidden on restricted route /admin followed by probe on /reports within 2 minutes.",
            status="Investigating",
            detection_method="Rule-Based",
            confidence=0.95,
            created_at=now - timedelta(hours=4, minutes=35)
        ),
        ThreatFinding(
            title="Repeated Failed Authentication Burst",
            description="Multiple consecutive failed login attempts detected against account student123 in under 3 minutes.",
            severity="Medium",  # 1st Medium
            category="Credential Access",
            username="student123",
            ip_address="192.168.1.25",
            event_id=events[19].id,
            evidence="4 failed login attempts (HTTP 401) observed consecutively between 06:15 and 06:18.",
            status="Investigating",
            detection_method="Rule-Based",
            confidence=0.88,
            created_at=now - timedelta(hours=5, minutes=50)
        ),
        ThreatFinding(
            title="Unusual IP Activity Burst & Route Probing",
            description="Workstation IP 192.168.1.45 exhibited abnormal request frequency including 404/500 errors on administrative endpoints.",
            severity="Medium",  # 2nd Medium
            category="Reconnaissance",
            username="student123",
            ip_address="192.168.1.45",
            event_id=events[26].id,
            evidence="Requests targeted /admin/config.php and /reports/export generating 404 and 500 error codes.",
            status="Open",
            detection_method="Rule-Based",
            confidence=0.82,
            created_at=now - timedelta(hours=4, minutes=30)
        ),
        ThreatFinding(
            title="Repeated HTTP 401 Unauthorized API Invocations",
            description="Session token absence or expiration caused repeated 401 status codes from IP 192.168.1.25.",
            severity="Medium",  # 3rd Medium
            category="Authentication Bypass",
            username="student123",
            ip_address="192.168.1.25",
            event_id=events[38].id,
            evidence="Three consecutive 401 events within 5 minutes on /login, /profile, and /attendance.",
            status="Open",
            detection_method="Rule-Based",
            confidence=0.80,
            created_at=now - timedelta(hours=2, minutes=5)
        ),
        ThreatFinding(
            title="Off-Subnet Restricted Route Probe",
            description="Single prohibited request to /admin originated from student mobile Wi-Fi subnet.",
            severity="Low",  # 1 Low
            category="Policy Violation",
            username="student456",
            ip_address="192.168.1.30",
            event_id=events[8].id,
            evidence="HTTP 403 Forbidden on /admin from library mobile client 192.168.1.30.",
            status="Resolved",
            detection_method="Rule-Based",
            confidence=0.75,
            created_at=now - timedelta(hours=7, minutes=30)
        )
    ]
    db.session.add_all(findings)

    # 5. Exactly 6 Vulnerabilities (Posture: 2 Passed, 4 Warning, 0 Failed)
    vulnerabilities = [
        Vulnerability(
            name="Missing Content Security Policy",
            category="HTTP Security Headers",
            description="Validates presence and restrictive configuration of Content-Security-Policy directives against XSS.",
            severity="Medium",
            status="Warning",  # 1 Warning
            target="http://localhost:5000 (Campus Web Application)",
            evidence="CSP header missing or using 'unsafe-inline' in script directives.",
            recommendation="Configure strict Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self';",
            checked_at=now - timedelta(hours=3)
        ),
        Vulnerability(
            name="HTTPS Configuration & HSTS",
            category="Transport Encryption",
            description="Enforces strict HTTPS connections to prevent SSL stripping attacks.",
            severity="High",
            status="Warning",  # 2 Warning
            target="http://localhost:5000 (Portal Gateway)",
            evidence="Strict-Transport-Security header not detected on localhost HTTP listener.",
            recommendation="Enable HSTS header with max-age=31536000 and includeSubDomains on production reverse proxy.",
            checked_at=now - timedelta(hours=3)
        ),
        Vulnerability(
            name="Missing X-Frame-Options",
            category="UI Redressing Protection",
            description="Ensures application frames cannot be rendered within unauthorized iframes.",
            severity="Medium",
            status="Passed",  # 1 Passed
            target="http://localhost:5000 (All Endpoints)",
            evidence="X-Frame-Options: SAMEORIGIN header present on response streams.",
            recommendation="Maintain SAMEORIGIN or DENY policy across all student/staff portals.",
            checked_at=now - timedelta(hours=3)
        ),
        Vulnerability(
            name="Missing X-Content-Type-Options",
            category="MIME Sniffing",
            description="Prevents MIME-type sniffing from executable files uploaded or served by users.",
            severity="Low",
            status="Passed",  # 2 Passed
            target="http://localhost:5000 (API & Static Assets)",
            evidence="X-Content-Type-Options: nosniff header verified.",
            recommendation="Preserve nosniff directive to prevent executable interpretation of text/plain assets.",
            checked_at=now - timedelta(hours=3)
        ),
        Vulnerability(
            name="Weak Cookie Configuration",
            category="Session Security",
            description="Checks session cookie flags for defense against session hijacking and CSRF.",
            severity="Medium",
            status="Warning",  # 3 Warning
            target="Session Storage & Auth Tokens",
            evidence="Local session cookie missing 'Secure' attribute because app is operating over localhost HTTP.",
            recommendation="Enforce SameSite=Lax/Strict, HttpOnly, and Secure flag in production TLS deployment.",
            checked_at=now - timedelta(hours=3)
        ),
        Vulnerability(
            name="Missing Security Headers (Referrer-Policy)",
            category="Information Disclosure",
            description="Controls how much referrer information should be included with requests made.",
            severity="Low",
            status="Warning",  # 4 Warning
            target="Campus Portal Navigation",
            evidence="Referrer-Policy header is unconfigured, defaulting to origin-when-cross-origin.",
            recommendation="Explicitly declare 'Referrer-Policy: strict-origin-when-cross-origin'.",
            checked_at=now - timedelta(hours=3)
        )
    ]
    db.session.add_all(vulnerabilities)

    # 6. Initial ML Anomalies (Zero detected outliers initially, baseline feature profiles)
    ml_records = [
        MLAnomaly(
            event_id=events[0].id,
            username="student123",
            ip_address="192.168.1.25",
            anomaly_score=0.1824,
            is_anomaly=0,  # Zero initial outliers
            model_name="Isolation Forest",
            features=json.dumps({"total_events": 16, "failed_logins": 4, "unauthorized_events": 0, "failure_ratio": 0.25, "hour_of_day": 8}),
            created_at=now - timedelta(hours=1)
        ),
        MLAnomaly(
            event_id=events[5].id,
            username="student456",
            ip_address="192.168.1.30",
            anomaly_score=0.2215,
            is_anomaly=0,  # Zero initial outliers
            model_name="Isolation Forest",
            features=json.dumps({"total_events": 11, "failed_logins": 0, "unauthorized_events": 1, "failure_ratio": 0.0, "hour_of_day": 8}),
            created_at=now - timedelta(hours=1)
        ),
        MLAnomaly(
            event_id=events[11].id,
            username="staff01",
            ip_address="192.168.1.45",
            anomaly_score=0.2541,
            is_anomaly=0,  # Zero initial outliers
            model_name="Isolation Forest",
            features=json.dumps({"total_events": 20, "failed_logins": 0, "unauthorized_events": 0, "failure_ratio": 0.0, "hour_of_day": 9}),
            created_at=now - timedelta(hours=1)
        )
    ]
    db.session.add_all(ml_records)

    # 7. System Health Services (All major services specified)
    health_services = [
        SystemHealth(service_name="Log Collector", status="Healthy", response_time=18.2, details="Ingesting university authentication and web server event stream", checked_at=now),
        SystemHealth(service_name="Preprocessor", status="Healthy", response_time=15.1, details="Active log sanitization, normalization and schema validation", checked_at=now),
        SystemHealth(service_name="Rule Engine", status="Healthy", response_time=21.6, details="5 defensive correlation rules active and evaluating", checked_at=now),
        SystemHealth(service_name="ML Engine", status="Healthy", response_time=42.0, details="Isolation Forest anomaly detector initialized and operational", checked_at=now),
        SystemHealth(service_name="Database", status="Healthy", response_time=4.8, details="SQLite database connected (university_security.db)", checked_at=now),
        SystemHealth(service_name="API Server", status="Healthy", response_time=12.4, details="Flask REST API responding on port 5000", checked_at=now),
    ]
    db.session.add_all(health_services)

    # 8. Initial Audit Report
    report = AuditReport(
        report_name="Baseline University Cyber Security Audit Report",
        report_type="SOC Executive Assessment",
        total_events=46,
        total_findings=5,
        high_severity=1,
        medium_severity=3,
        low_severity=1,
        vulnerabilities=6,
        generated_at=now - timedelta(hours=2)
    )
    db.session.add(report)

    db.session.commit()

def ensure_admin_exists():
    """
    Guarantees that an initial administrator account exists and is active.
    Required by SOC RBAC specifications.
    """
    from utils.auth import hash_password
    admin = User.query.filter_by(role="ADMIN", status="Active").first()
    if not admin:
        admin_user = User.query.filter_by(username="admin").first()
        if admin_user:
            admin_user.role = "ADMIN"
            admin_user.status = "Active"
            if not admin_user.password_hash:
                admin_user.password_hash = hash_password("Admin@123")
        else:
            admin_user = User(
                username="admin",
                full_name="SOC Administrator",
                email="admin@university.local",
                password_hash=hash_password("Admin@123"),
                role="ADMIN",
                department="Information Security SOC",
                status="Active"
            )
            db.session.add(admin_user)
        db.session.commit()

