"""
Safe SQLite schema migration & initialization script
Ensures new columns and tables exist without destroying existing operational data.
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta

def run_migrations(db_path):
    """Safely adds missing columns and tables to the SQLite database."""
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Check threat_findings columns
        cursor.execute("PRAGMA table_info(threat_findings)")
        tf_columns = [col[1] for col in cursor.fetchall()]

        if "risk_score" not in tf_columns:
            cursor.execute("ALTER TABLE threat_findings ADD COLUMN risk_score INTEGER DEFAULT 70")
            print("  [Migration] Added 'risk_score' column to threat_findings.")

        if "risk_level" not in tf_columns:
            cursor.execute("ALTER TABLE threat_findings ADD COLUMN risk_level VARCHAR(20) DEFAULT 'HIGH'")
            print("  [Migration] Added 'risk_level' column to threat_findings.")

        if "risk_factors" not in tf_columns:
            cursor.execute("ALTER TABLE threat_findings ADD COLUMN risk_factors TEXT")
            print("  [Migration] Added 'risk_factors' column to threat_findings.")

        # 2. Check audit_logs table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'")
        if not cursor.fetchone():
            cursor.execute("""
                CREATE TABLE audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    username VARCHAR(80),
                    action VARCHAR(80) NOT NULL,
                    resource_type VARCHAR(80),
                    resource_id VARCHAR(80),
                    description TEXT,
                    ip_address VARCHAR(45),
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("  [Migration] Created 'audit_logs' table.")

            # Seed initial audit logs for demonstration
            now = datetime.utcnow()
            sample_logs = [
                (1, "admin", "SYSTEM_INIT", "SECURITY_CORE", "1", "University Security SOC initialized with RBAC & telemetry pipelines.", "127.0.0.1", (now - timedelta(hours=3)).isoformat()),
                (1, "admin", "LOGIN", "AUTH", "1", "Successful administrator login to Security Center portal.", "192.168.1.10", (now - timedelta(hours=2, minutes=30)).isoformat()),
                (2, "analyst", "LOGIN", "AUTH", "2", "Security Analyst session established.", "192.168.1.15", (now - timedelta(hours=2)).isoformat()),
                (2, "analyst", "VULNERABILITY_AUDIT", "VULNERABILITY", "all", "Executed safe non-destructive configuration audit across web headers.", "192.168.1.15", (now - timedelta(hours=1, minutes=45)).isoformat()),
                (1, "admin", "ROLE_CHANGED", "USER", "4", "Changed user 'staff01' role to SECURITY_ANALYST.", "192.168.1.10", (now - timedelta(hours=1, minutes=15)).isoformat()),
                (2, "analyst", "VIEW_FINDING", "THREAT_FINDING", "1", "Investigated Potential Brute-Force / Credential Stuffing finding.", "192.168.1.15", (now - timedelta(minutes=45)).isoformat()),
                (1, "admin", "GENERATE_REPORT", "REPORT", "1", "Generated comprehensive University Security Assessment Report.", "192.168.1.10", (now - timedelta(minutes=10)).isoformat()),
            ]
            cursor.executemany("""
                INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, description, ip_address, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, sample_logs)
            print("  [Migration] Seeded initial audit logs.")

        conn.commit()
    except Exception as e:
        print(f"  [Migration Error] {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(base_dir, "database", "university_security.db")
    run_migrations(db_file)
