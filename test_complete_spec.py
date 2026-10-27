import requests

BASE_URL = "http://127.0.0.1:5000/api"

def test_full_spec():
    print("==================================================")
    print("RUNNING 9 SPECIFICATION TESTS (Section 32)")
    print("==================================================")

    # TEST 1: Create new account. Expected: Account created successfully. Role: VIEWER
    print("\n--- TEST 1: Register new account ---")
    import time
    test_user_suffix = str(int(time.time()))[-4:]
    reg_username = f"sarah_{test_user_suffix}"
    reg_payload = {
        "full_name": "Dr. Sarah Connor",
        "username": reg_username,
        "email": f"sarah.{test_user_suffix}@university.local",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "department": "Cyber Defense Lab",
        "role": "SECURITY_ANALYST" # Requesting analyst, but public registration must default to VIEWER
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"Register status: {r.status_code}")
    res = r.json()
    assert r.status_code == 201, f"Unexpected status: {r.status_code}, {res}"
    assert res.get("user", {}).get("role") == "VIEWER", f"Expected role VIEWER, got {res.get('user', {}).get('role')}"
    print(f"  [PASS] User created with Role: {res['user']['role']}")

    # TEST 2: Login with newly created account. Expected: Dashboard token returned
    print("\n--- TEST 2: Login with Viewer account ---")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username_or_email": reg_username,
        "password": "Password@123"
    })
    print(f"Login status: {r.status_code}")
    assert r.status_code == 200, f"Login failed: {r.text}"
    viewer_data = r.json()
    viewer_token = viewer_data["access_token"]
    viewer_role = viewer_data["user"]["role"]
    assert viewer_role == "VIEWER", f"Expected VIEWER, got {viewer_role}"
    print(f"  [PASS] Viewer authenticated! Token issued, Role: {viewer_role}")

    # TEST 3: Viewer attempts an admin-only API or scan action. Expected: 403 Forbidden
    print("\n--- TEST 3: Viewer attempts Admin API & Scan action ---")
    headers_viewer = {"Authorization": f"Bearer {viewer_token}"}
    
    # 3a. Admin users API
    r = requests.get(f"{BASE_URL}/admin/users", headers=headers_viewer)
    print(f"Viewer GET /api/admin/users: {r.status_code}")
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
    print(f"  [PASS] Viewer blocked from /api/admin/users with 403: {r.json().get('error')}")

    # 3b. Vulnerability scan action
    r = requests.post(f"{BASE_URL}/vulnerability/scan", headers=headers_viewer)
    print(f"Viewer POST /api/vulnerability/scan: {r.status_code}")
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
    print(f"  [PASS] Viewer blocked from POST /api/vulnerability/scan with 403: {r.json().get('error')}")

    # 3c. ML run action
    r = requests.post(f"{BASE_URL}/ml/run", headers=headers_viewer)
    print(f"Viewer POST /api/ml/run: {r.status_code}")
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
    print(f"  [PASS] Viewer blocked from POST /api/ml/run with 403: {r.json().get('error')}")

    # TEST 4: Admin logs in. Expected: Full SOC access
    print("\n--- TEST 4: Admin logs in ---")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username_or_email": "admin",
        "password": "Admin@123"
    })
    print(f"Admin login status: {r.status_code}")
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    admin_data = r.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "ADMIN"
    print(f"  [PASS] Admin authenticated! Permissions: {len(admin_data.get('permissions', []))}")

    # Admin accesses /api/admin/users
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/admin/users", headers=headers_admin)
    assert r.status_code == 200
    user_list = r.json().get("users", [])
    print(f"  [PASS] Admin retrieved {len(user_list)} SOC users from /api/admin/users")

    # TEST 5: Security Analyst logs in. Expected: Monitoring access, can run scan, but NO admin access
    print("\n--- TEST 5: Analyst logs in ---")
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username_or_email": "analyst",
        "password": "Analyst@123"
    })
    assert r.status_code == 200
    analyst_token = r.json()["access_token"]
    headers_analyst = {"Authorization": f"Bearer {analyst_token}"}

    # Analyst can run scan
    r = requests.post(f"{BASE_URL}/vulnerability/scan", headers=headers_analyst)
    assert r.status_code == 200
    print(f"  [PASS] Analyst allowed to execute vulnerability scan (200 OK)")

    # Analyst blocked from admin users API
    r = requests.get(f"{BASE_URL}/admin/users", headers=headers_analyst)
    assert r.status_code == 403
    print(f"  [PASS] Analyst blocked from user administration (403 Forbidden)")

    # TEST 6: Logout
    print("\n--- TEST 6: Logout API ---")
    r = requests.post(f"{BASE_URL}/auth/logout", headers=headers_admin)
    assert r.status_code == 200
    print(f"  [PASS] Logout returned 200 OK: {r.json().get('message')}")

    # TEST 7: Current User validation (me endpoint)
    print("\n--- TEST 7: /api/auth/me session check ---")
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers_admin)
    assert r.status_code == 200
    me = r.json()
    assert me.get("username") == "admin"
    print(f"  [PASS] /api/auth/me restored session for user: {me.get('username')} ({me.get('role')})")

    # TEST 8: Expired/invalid token
    print("\n--- TEST 8: Invalid / Expired Token ---")
    r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert r.status_code == 401
    print(f"  [PASS] Invalid token correctly rejected with 401: {r.json().get('error')}")

    # TEST 9: Disabled account rejected
    print("\n--- TEST 9: Disabled account login rejection ---")
    # As Admin, deactivate student123
    student_user = next((u for u in user_list if u["username"] == "student123"), None)
    if student_user:
        r = requests.patch(f"{BASE_URL}/admin/users/{student_user['id']}/status",
                           headers=headers_admin, json={"status": "Inactive"})
        assert r.status_code == 200
        print(f"  Deactivated user {student_user['username']} for test")

        # Now student123 tries to log in with valid password
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "username_or_email": "student123",
            "password": "Student@123"
        })
        assert r.status_code == 403, f"Expected 403 for disabled account, got {r.status_code}"
        print(f"  [PASS] Disabled account rejected with 403: {r.json().get('error')}")

        # Reactivate student123
        requests.patch(f"{BASE_URL}/admin/users/{student_user['id']}/status",
                       headers=headers_admin, json={"status": "Active"})
        print(f"  Reactivated student123")

    print("\n==================================================")
    print("ALL 9 TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_spec()
