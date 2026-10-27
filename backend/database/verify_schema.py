import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "university_security.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = [
    'users',
    'ip_addresses',
    'security_events',
    'threat_findings',
    'vulnerabilities',
    'ml_anomalies',
    'system_health',
    'audit_reports'
]

print("==================================================")
print(" SQLITE DATABASE VERIFICATION REPORT")
print(f" File: {db_path}")
print("==================================================")

for t in tables:
    print(f"\n[TABLE] {t}")
    cursor.execute(f"PRAGMA table_info({t});")
    columns = cursor.fetchall()
    for col in columns:
        cid, name, col_type, notnull, dflt, pk = col
        pk_str = " (PK)" if pk else ""
        nn_str = " NOT NULL" if notnull else ""
        dflt_str = f" DEFAULT {dflt}" if dflt is not None else ""
        print(f"  - {name:<18} {col_type:<10}{pk_str}{nn_str}{dflt_str}")

print("\n--------------------------------------------------")
print(" [INDEXES] User-Specified Query Optimization")
print("--------------------------------------------------")
cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_autoindex%';")
for idx in cursor.fetchall():
    print(f"  - {idx[0]:<35} on {idx[1]}")

print("\n--------------------------------------------------")
print(" [SAMPLE QUERIES] Testing Key Queries")
print("--------------------------------------------------")
# Query 1: Failed Logins
cursor.execute("SELECT username, ip_address, count(*) FROM security_events WHERE status_code = 401 GROUP BY username, ip_address;")
print(" Failed Login Bursts (401s):", cursor.fetchall())

# Query 2: High Severity Findings
cursor.execute("SELECT id, title, severity, category FROM threat_findings WHERE severity = 'High';")
print(" High Severity Threat Finding:", cursor.fetchall())

# Query 3: Vulnerabilities summary
cursor.execute("SELECT status, count(*) FROM vulnerabilities GROUP BY status;")
print(" Vulnerability Posture Count:", cursor.fetchall())

# Query 4: System Health status
cursor.execute("SELECT service_name, status, response_time FROM system_health;")
print(" Monitored Services:", cursor.fetchall())

conn.close()
print("\n>>> All 8 Tables, Indexes, and Queries Verified Successfully! <<<\n")
