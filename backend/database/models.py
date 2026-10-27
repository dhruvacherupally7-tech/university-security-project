from datetime import datetime
from database.database import db
from utils.auth import hash_password, verify_password, get_permissions_for_role

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(50), default="VIEWER", nullable=False)
    department = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str):
        """Sets the securely hashed password."""
        self.password_hash = hash_password(password)

    def check_password(self, password: str) -> bool:
        """Validates the password against the stored hash."""
        return verify_password(self.password_hash, password)

    def get_permissions(self):
        """Returns the permission array based on the user's role."""
        return get_permissions_for_role(self.role)

    def to_dict(self):
        """Safe serialization for user directory and admin views (excludes password hash)."""
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def to_auth_dict(self):
        """Safe serialization for authentication responses."""
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "status": self.status,
            "permissions": self.get_permissions(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class IPAddress(db.Model):
    __tablename__ = "ip_addresses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False, index=True)
    location = db.Column(db.String(100), nullable=True)
    device = db.Column(db.String(100), nullable=True)
    user_count = db.Column(db.Integer, default=0)
    event_count = db.Column(db.Integer, default=0)
    risk_level = db.Column(db.String(20), default="Low")
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "ip_address": self.ip_address,
            "location": self.location,
            "device": self.device,
            "user_count": self.user_count,
            "event_count": self.event_count,
            "risk_level": self.risk_level,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None
        }


class SecurityEvent(db.Model):
    __tablename__ = "security_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    resource = db.Column(db.String(255), nullable=True)
    message = db.Column(db.String(255), nullable=True)
    severity = db.Column(db.String(20), default="Low", index=True)
    processed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "username": self.username,
            "ip_address": self.ip_address,
            "event_type": self.event_type,
            "status_code": self.status_code,
            "resource": self.resource,
            "message": self.message,
            "severity": self.severity,
            "processed": bool(self.processed),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ThreatFinding(db.Model):
    __tablename__ = "threat_findings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    severity = db.Column(db.String(20), nullable=False, index=True)  # Critical, High, Medium, Low
    category = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True, index=True)
    event_id = db.Column(db.Integer, nullable=True, index=True)
    evidence = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="Open")  # Open, Investigating, Resolved
    detection_method = db.Column(db.String(50), default="Rule-Based")
    confidence = db.Column(db.Float, default=0.90)
    risk_score = db.Column(db.Integer, default=70, index=True)
    risk_level = db.Column(db.String(20), default="HIGH", index=True)
    risk_factors = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        factors_parsed = []
        if self.risk_factors:
            try:
                import json
                factors_parsed = json.loads(self.risk_factors)
            except Exception:
                factors_parsed = []

        if not self.risk_score or not factors_parsed:
            from services.risk_engine import calculate_finding_risk
            risk_calc = calculate_finding_risk(self)
            calculated_score = risk_calc["risk_score"]
            calculated_level = risk_calc["risk_level"]
            calculated_factors = risk_calc["risk_factors"]
        else:
            calculated_score = self.risk_score
            calculated_level = self.risk_level or "HIGH"
            calculated_factors = factors_parsed

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "category": self.category,
            "username": self.username,
            "ip_address": self.ip_address,
            "event_id": self.event_id,
            "evidence": self.evidence,
            "status": self.status,
            "detection_method": self.detection_method,
            "confidence": self.confidence,
            "risk_score": calculated_score,
            "risk_level": calculated_level,
            "risk_factors": calculated_factors,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Vulnerability(db.Model):
    __tablename__ = "vulnerabilities"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=True)
    description = db.Column(db.Text, nullable=True)
    severity = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(20), nullable=False)  # Passed, Warning, Failed
    target = db.Column(db.String(200), nullable=True)
    evidence = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.Text, nullable=True)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "severity": self.severity,
            "status": self.status,
            "target": self.target,
            "evidence": self.evidence,
            "recommendation": self.recommendation,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None
        }


class MLAnomaly(db.Model):
    __tablename__ = "ml_anomalies"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, nullable=True, index=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    ip_address = db.Column(db.String(45), nullable=True, index=True)
    anomaly_score = db.Column(db.Float, nullable=True)
    is_anomaly = db.Column(db.Integer, default=0)
    model_name = db.Column(db.String(80), default="Isolation Forest")
    features = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "username": self.username,
            "ip_address": self.ip_address,
            "anomaly_score": round(self.anomaly_score, 4) if self.anomaly_score is not None else 0.0,
            "is_anomaly": bool(self.is_anomaly),
            "model_name": self.model_name,
            "features": self.features,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SystemHealth(db.Model):
    __tablename__ = "system_health"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    service_name = db.Column(db.String(80), nullable=False)
    status = db.Column(db.String(20), default="Healthy")
    response_time = db.Column(db.Float, default=0.0)
    details = db.Column(db.Text, nullable=True)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "service_name": self.service_name,
            "status": self.status,
            "response_time": round(self.response_time, 2) if self.response_time is not None else 0.0,
            "details": self.details,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None
        }


class AuditReport(db.Model):
    __tablename__ = "audit_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    report_name = db.Column(db.String(150), nullable=False)
    report_type = db.Column(db.String(80), default="Security Assessment")
    total_events = db.Column(db.Integer, default=0)
    total_findings = db.Column(db.Integer, default=0)
    high_severity = db.Column(db.Integer, default=0)
    medium_severity = db.Column(db.Integer, default=0)
    low_severity = db.Column(db.Integer, default=0)
    vulnerabilities = db.Column(db.Integer, default=0)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "report_name": self.report_name,
            "report_type": self.report_type,
            "total_events": self.total_events,
            "total_findings": self.total_findings,
            "high_severity": self.high_severity,
            "medium_severity": self.medium_severity,
            "low_severity": self.low_severity,
            "vulnerabilities": self.vulnerabilities,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=True, index=True)
    username = db.Column(db.String(80), nullable=True, index=True)
    action = db.Column(db.String(80), nullable=False, index=True)
    resource_type = db.Column(db.String(80), nullable=True)
    resource_id = db.Column(db.String(80), nullable=True)
    description = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "description": self.description,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }

