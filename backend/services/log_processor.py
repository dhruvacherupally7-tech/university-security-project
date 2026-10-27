from datetime import datetime
import re
from database.database import db
from database.models import SecurityEvent, User, IPAddress
from services.rule_engine import RuleEngine
from services.ml_engine import MLEngine

class LogProcessor:
    """
    Log Preprocessing Pipeline:
    COLLECT -> VALIDATE -> NORMALIZE -> PROCESS -> RULE DETECTION -> ML ANALYSIS -> STORE
    """

    ALLOWED_EVENT_TYPES = {
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "UNAUTHORIZED_ACCESS",
        "RESOURCE_ACCESS",
        "ADMIN_ACCESS",
        "LOGOUT"
    }

    IP_PATTERN = re.compile(r"^(\d{1,3}\.){3}\d{1,3}$")

    @classmethod
    def validate(cls, raw_entry):
        """
        Validates minimum required log fields.
        """
        if not isinstance(raw_entry, dict):
            return False, "Log record must be a JSON object"

        user = raw_entry.get("username")
        ip = raw_entry.get("ip_address")
        resource = raw_entry.get("resource")

        if not user or not isinstance(user, str) or len(user.strip()) == 0:
            return False, "Missing or invalid username"

        if not ip or not isinstance(ip, str) or not cls.IP_PATTERN.match(ip.strip()):
            return False, f"Missing or invalid IPv4 address: '{ip}'"

        if not resource or not isinstance(resource, str):
            return False, "Missing or invalid resource path"

        return True, "Valid"

    @classmethod
    def normalize(cls, raw_entry):
        """
        Normalizes timestamps, usernames, IP addresses, event types, and HTTP status codes.
        """
        user = raw_entry.get("username", "").strip().lower()
        ip = raw_entry.get("ip_address", "").strip()
        resource = raw_entry.get("resource", "").strip()
        if not resource.startswith("/"):
            resource = "/" + resource

        # Status code normalization
        try:
            status_code = int(raw_entry.get("status_code", 200))
        except (ValueError, TypeError):
            status_code = 200

        # Event type normalization
        ev_type = str(raw_entry.get("event_type", "")).strip().upper()
        if ev_type not in cls.ALLOWED_EVENT_TYPES:
            if status_code in [401, 403]:
                ev_type = "UNAUTHORIZED_ACCESS"
            elif "/admin" in resource:
                ev_type = "ADMIN_ACCESS"
            else:
                ev_type = "RESOURCE_ACCESS"

        # Severity classification
        severity = str(raw_entry.get("severity", "")).strip().capitalize()
        if severity not in ["High", "Medium", "Low"]:
            if status_code in [403, 500] or ev_type == "UNAUTHORIZED_ACCESS":
                severity = "Medium"
            elif "/admin" in resource and status_code != 200:
                severity = "High"
            else:
                severity = "Low"

        # Timestamp normalization
        raw_ts = raw_entry.get("timestamp")
        timestamp = datetime.utcnow()
        if raw_ts:
            if isinstance(raw_ts, str):
                try:
                    # Clean potential trailing Z or ISO formats
                    clean_ts = raw_ts.replace("Z", "+00:00")
                    timestamp = datetime.fromisoformat(clean_ts)
                except Exception:
                    timestamp = datetime.utcnow()
            elif isinstance(raw_ts, (int, float)):
                try:
                    timestamp = datetime.fromtimestamp(raw_ts)
                except Exception:
                    timestamp = datetime.utcnow()

        message = str(raw_entry.get("message") or f"{ev_type} on {resource} by {user} (HTTP {status_code})")

        return {
            "timestamp": timestamp,
            "username": user,
            "ip_address": ip,
            "event_type": ev_type,
            "status_code": status_code,
            "resource": resource,
            "message": message,
            "severity": severity,
            "processed": True
        }

    @classmethod
    def process_and_store(cls, raw_logs):
        """
        Executes full pipeline over list of raw log dictionaries:
        Collects, validates, normalizes, stores events, updates IP stats, runs rules and ML.
        """
        if not isinstance(raw_logs, list):
            raw_logs = [raw_logs]

        processed_events = []
        errors = []

        for idx, item in enumerate(raw_logs):
            valid, reason = cls.validate(item)
            if not valid:
                errors.append({"index": idx, "error": reason, "raw": item})
                continue

            clean = cls.normalize(item)
            event = SecurityEvent(
                timestamp=clean["timestamp"],
                username=clean["username"],
                ip_address=clean["ip_address"],
                event_type=clean["event_type"],
                status_code=clean["status_code"],
                resource=clean["resource"],
                message=clean["message"],
                severity=clean["severity"],
                processed=True,
                created_at=datetime.utcnow()
            )
            db.session.add(event)
            processed_events.append(event)

            # Update or create IP Address record
            ip_rec = IPAddress.query.filter_by(ip_address=clean["ip_address"]).first()
            if ip_rec:
                ip_rec.event_count += 1
                ip_rec.last_seen = datetime.utcnow()
                if clean["severity"] == "High":
                    ip_rec.risk_level = "High"
            else:
                new_ip = IPAddress(
                    ip_address=clean["ip_address"],
                    location="Campus Network Subnet",
                    device="Generic Network Terminal",
                    user_count=1,
                    event_count=1,
                    risk_level=clean["severity"],
                    last_seen=datetime.utcnow()
                )
                db.session.add(new_ip)

            # Update or create User record
            user_rec = User.query.filter_by(username=clean["username"]).first()
            if not user_rec:
                new_user = User(
                    username=clean["username"],
                    full_name=clean["username"].capitalize(),
                    role="Student" if "student" in clean["username"] else "Staff",
                    department="General Campus",
                    status="Active",
                    created_at=datetime.utcnow()
                )
                db.session.add(new_user)

        db.session.commit()

        # Step 6: Trigger Rule Engine correlation
        new_findings = RuleEngine.evaluate_all()

        # Step 7: Trigger ML anomaly evaluation
        ml_summary = MLEngine.run_detection()

        return {
            "total_submitted": len(raw_logs),
            "successfully_processed": len(processed_events),
            "rejected_records": len(errors),
            "errors": errors,
            "new_findings_detected": len(new_findings),
            "ml_anomalies_detected": ml_summary.get("potential_anomalies", 0),
            "processed_events": [e.to_dict() for e in processed_events]
        }
