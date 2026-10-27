import os
import sys

# Ensure backend root directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app import app
from database.database import db, reset_db
from database.seed import seed_database
from database.models import (
    User,
    IPAddress,
    SecurityEvent,
    ThreatFinding,
    Vulnerability,
    MLAnomaly,
    SystemHealth,
    AuditReport
)

def print_status():
    with app.app_context():
        print("\n==================================================")
        print(" UNIVERSITY SECURITY SOC - DATABASE STATUS")
        print(" Database: backend/database/university_security.db")
        print("==================================================")
        print(f" 1. users:            {User.query.count():>4} records")
        print(f" 2. ip_addresses:     {IPAddress.query.count():>4} records")
        print(f" 3. security_events:  {SecurityEvent.query.count():>4} records")
        print(f" 4. threat_findings:  {ThreatFinding.query.count():>4} records")
        print(f" 5. vulnerabilities:  {Vulnerability.query.count():>4} records")
        print(f" 6. ml_anomalies:     {MLAnomaly.query.count():>4} records")
        print(f" 7. system_health:    {SystemHealth.query.count():>4} records")
        print(f" 8. audit_reports:    {AuditReport.query.count():>4} records")
        print("==================================================")

        # Posture Verification
        print("\n--- SECURITY POSTURE VERIFICATION ---")
        vuln_posture = {s: Vulnerability.query.filter_by(status=s).count() for s in ['Passed', 'Warning', 'Failed']}
        print(f" Vulnerabilities: {vuln_posture['Passed']} Passed, {vuln_posture['Warning']} Warning, {vuln_posture['Failed']} Failed")

        threat_posture = {s: ThreatFinding.query.filter_by(severity=s).count() for s in ['Critical', 'High', 'Medium', 'Low']}
        print(f" Threat Severity: {threat_posture['High']} High, {threat_posture['Medium']} Medium, {threat_posture['Low']} Low")

        ml_outliers = MLAnomaly.query.filter_by(is_anomaly=1).count()
        print(f" Initial ML Outliers: {ml_outliers} (Zero initial outliers)")
        print("==================================================\n")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="University Security SOC Database Manager")
    parser.add_argument("--reset", action="store_true", help="Drop, recreate tables, and reseed demo data")
    parser.add_argument("--seed", action="store_true", help="Seed demo data if tables are empty")
    parser.add_argument("--status", action="store_true", help="Print table record counts and posture")

    args = parser.parse_args()

    if args.reset:
        reset_db(app)

    with app.app_context():
        seed_database()

    print_status()
