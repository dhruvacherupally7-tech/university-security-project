import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def print_test_header(title):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def run_tests():
    # Authenticate as ADMIN first
    print("\n[INIT] Authenticating as ADMIN for test suite...")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": "admin", "password": "Admin@123"})
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin login successful. Token acquired.")

    print_test_header("TEST 1: Repeated Failed-Login Events & Finding Risk & AI Explanation")
    # Simulate 5 repeated failed logins for a specific attacker user & IP
    attacker_ip = "192.168.1.189"
    attacker_user = "brute_force_student"
    simulated_logs = [
        {
            "username": attacker_user,
            "ip_address": attacker_ip,
            "event_type": "LOGIN_FAILURE",
            "status_code": 401,
            "resource": "/api/auth/login",
            "message": f"Failed authentication attempt {i+1} for {attacker_user}",
            "severity": "HIGH",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - (5 - i) * 10))
        }
        for i in range(5)
    ]

    res = requests.post(f"{BASE_URL}/logs/sync", json={"logs": simulated_logs}, headers=admin_headers)
    print(f"Sync logs status: {res.status_code}")
    assert res.status_code == 200, f"Sync logs failed: {res.text}"
    sync_data = res.json()
    print(f"New findings detected: {sync_data.get('new_findings_detected')}")
    print(f"Events ingested: {sync_data.get('events_ingested')}")

    # Fetch findings to verify risk score and AI explanation
    res = requests.get(f"{BASE_URL}/findings", headers=admin_headers)
    assert res.status_code == 200, f"Fetch findings failed: {res.text}"
    findings_data = res.json()
    findings = findings_data.get("findings", [])
    print(f"Total findings retrieved: {len(findings)}")
    print(f"Overall average risk score: {findings_data.get('average_risk_score')}")

    # Find the most recent finding
    latest_finding = findings[0]
    print(f"Latest Finding ID: {latest_finding.get('id')}")
    print(f"Title: {latest_finding.get('title')}")
    print(f"Risk Score: {latest_finding.get('risk_score')} / 100 ({latest_finding.get('risk_level')})")
    print(f"Risk Factors: {latest_finding.get('risk_factors')}")
    print(f"Confidence: {latest_finding.get('confidence')}%")

    assert "risk_score" in latest_finding and latest_finding["risk_score"] > 0
    assert "risk_level" in latest_finding
    assert "confidence" in latest_finding

    # Test AI Alert Explanation endpoint
    exp_res = requests.get(f"{BASE_URL}/findings/{latest_finding['id']}/explanation", headers=admin_headers)
    assert exp_res.status_code == 200, f"Explanation failed: {exp_res.text}"
    exp_data = exp_res.json()
    print("\n--- AI Alert Explanation Response ---")
    print(f"Summary: {exp_data.get('summary')}")
    print(f"Why Detected: {exp_data.get('why_detected')}")
    print(f"Threat Type: {exp_data.get('threat_type')}")
    print(f"Confidence: {exp_data.get('confidence')}%")
    print(f"Evidence: {exp_data.get('evidence')}")
    print(f"Recommended Action: {exp_data.get('recommended_action')}")
    assert exp_data.get("why_detected") is not None
    assert exp_data.get("recommended_action") is not None
    print("[PASS] TEST 1 Verified Successfully!")

    print_test_header("TEST 2: Login as ADMIN, Audit Logs, and PDF Generation")
    # Check audit logs
    audit_res = requests.get(f"{BASE_URL}/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    logs = audit_data.get("audit_logs", [])
    print(f"Total audit logs retrieved by ADMIN: {audit_data.get('total')}")
    print(f"Most recent audit entry: [{logs[0].get('timestamp')}] {logs[0].get('username')} -> {logs[0].get('action')}: {logs[0].get('description')}")
    assert len(logs) > 0
    # Verify login was logged
    login_actions = [l for l in logs if l.get("action") == "LOGIN"]
    print(f"Found {len(login_actions)} LOGIN audit logs in system.")
    assert len(login_actions) > 0

    # Admin generate PDF
    pdf_res = requests.get(f"{BASE_URL}/reports/security-pdf", headers=admin_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("Content-Type") == "application/pdf"
    assert len(pdf_res.content) > 5000
    print(f"PDF Security Assessment successfully generated. Size: {len(pdf_res.content)} bytes.")
    print("[PASS] TEST 2 Verified Successfully!")

    print_test_header("TEST 3: Login as VIEWER, RBAC Protection on Audit Logs")
    # Login as viewer
    v_login = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": "viewer", "password": "Viewer@123"})
    assert v_login.status_code == 200, f"Viewer login failed: {v_login.text}"
    viewer_token = v_login.json()["access_token"]
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    print("Viewer login successful.")

    # Viewer accessing dashboard summary
    dash_res = requests.get(f"{BASE_URL}/dashboard/summary", headers=viewer_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    print(f"Viewer dashboard access: OK (Total Events: {dash_data.get('total_events')}, Overall Risk: {dash_data.get('overall_risk_score')})")

    # Viewer trying to access Audit Logs (must be 403 Forbidden)
    v_audit = requests.get(f"{BASE_URL}/audit-logs", headers=viewer_headers)
    print(f"Viewer audit logs response: {v_audit.status_code} (Expected: 403)")
    assert v_audit.status_code == 403

    # Viewer trying to access Admin Users list (must be 403 Forbidden)
    v_admin = requests.get(f"{BASE_URL}/admin/users", headers=viewer_headers)
    print(f"Viewer admin users list response: {v_admin.status_code} (Expected: 403)")
    assert v_admin.status_code == 403
    print("[PASS] TEST 3 Verified Successfully!")

    print_test_header("TEST 4: Validate PDF Report Content Integrity")
    # Verify PDF bytes start with %PDF
    assert pdf_res.content.startswith(b"%PDF")
    print("PDF Magic Bytes: %PDF header confirmed.")
    print(f"Report filename in header: {pdf_res.headers.get('Content-Disposition')}")
    print("[PASS] TEST 4 Verified Successfully!")

    print_test_header("TEST 5: Dashboard Live Summary & Risk Indicators")
    d_res = requests.get(f"{BASE_URL}/dashboard/summary", headers=admin_headers)
    assert d_res.status_code == 200
    d_json = d_res.json()
    print(f"Dashboard Overall Risk Score: {d_json.get('overall_risk_score')}")
    print(f"Dashboard Overall Risk Level: {d_json.get('overall_risk_level')}")
    print(f"Dashboard Total Events: {d_json.get('total_events')}")
    print(f"Dashboard Total Findings: {d_json.get('total_findings')}")
    print(f"Dashboard Top Users: {len(d_json.get('top_users', []))}")
    print(f"Dashboard Top IPs: {len(d_json.get('top_ips', []))}")
    assert d_json.get("overall_risk_score") is not None
    assert d_json.get("overall_risk_level") is not None
    print("[PASS] TEST 5 Verified Successfully!")

    print_test_header("ALL 5 FEATURES & INTEGRATION TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
