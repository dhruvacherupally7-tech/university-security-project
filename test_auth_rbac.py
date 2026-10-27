import urllib.request
import json
import sys

BASE_URL = "http://localhost:5000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    body = json.dumps(data).encode("utf-8") if data else None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        return e.code, json.loads(res_body) if res_body else {"error": str(e)}

print("=== TESTING AUTH & RBAC SYSTEM ===")

# 1. Login with Admin
status, res = make_req("/auth/login", method="POST", data={"username_or_email": "admin", "password": "Admin@123"})
assert status == 200, f"Admin login failed: {status} {res}"
admin_token = res["access_token"]
print("✓ Admin login successful (200)")

# 2. Login with Invalid Password
status, res = make_req("/auth/login", method="POST", data={"username_or_email": "admin", "password": "WrongPassword"})
assert status == 401, f"Expected 401 for wrong password, got: {status}"
print("✓ Invalid password rejected (401)")

# 3. Login with Analyst & Viewer
status, res = make_req("/auth/login", method="POST", data={"username_or_email": "analyst", "password": "Analyst@123"})
assert status == 200, f"Analyst login failed: {status}"
analyst_token = res["access_token"]
print("✓ Analyst login successful (200)")

status, res = make_req("/auth/login", method="POST", data={"username_or_email": "viewer", "password": "Viewer@123"})
assert status == 200, f"Viewer login failed: {status}"
viewer_token = res["access_token"]
print("✓ Viewer login successful (200)")

# 4. GET /auth/me with and without token
status, res = make_req("/auth/me", token=admin_token)
assert status == 200 and res["username"] == "admin"
print("✓ GET /auth/me with token returns user (200)")

status, res = make_req("/auth/me")
assert status == 401
print("✓ GET /auth/me without token rejected (401)")

# 5. Register New User (Default role VIEWER)
reg_data = {
    "full_name": "Test Student",
    "username": "teststudent",
    "email": "teststudent@university.local",
    "password": "Password@123",
    "department": "Physics"
}
status, res = make_req("/auth/register", method="POST", data=reg_data)
assert status == 201 and res["user"]["role"] == "VIEWER"
print("✓ Public registration creates VIEWER role (201)")

# 6. Attempt to register ADMIN publicly
admin_reg_data = {
    "full_name": "Fake Admin",
    "username": "fakeadmin",
    "email": "fakeadmin@university.local",
    "password": "Password@123",
    "role": "ADMIN"
}
status, res = make_req("/auth/register", method="POST", data=admin_reg_data)
assert status == 403, f"Expected 403 for public admin registration, got {status}"
print("✓ Public registration of ADMIN blocked (403)")

# 7. RBAC Action Enforcement: Viewer cannot run vulnerability scan
status, res = make_req("/vulnerability/scan", method="POST", data={}, token=viewer_token)
assert status == 403, f"Expected 403 for viewer running scan, got {status}"
print("✓ Viewer running scan blocked by backend RBAC (403)")

# 8. RBAC Action Enforcement: Analyst CAN run vulnerability scan
status, res = make_req("/vulnerability/scan", method="POST", data={}, token=analyst_token)
assert status == 200, f"Expected 200 for analyst running scan, got {status}"
print("✓ Analyst running scan allowed (200)")

# 9. Admin User Management: Viewer cannot access /admin/users
status, res = make_req("/admin/users", token=viewer_token)
assert status == 403, f"Expected 403 for viewer accessing admin users, got {status}"
print("✓ Viewer accessing /admin/users blocked (403)")

# 10. Admin User Management: Admin CAN access /admin/users
status, res = make_req("/admin/users", token=admin_token)
assert status == 200 and res["total"] >= 6
print(f"✓ Admin accessing /admin/users allowed (200, {res['total']} users)")

# 11. Admin Safeguard: Cannot demote the final active admin
status, res = make_req("/admin/users/1/role", method="PATCH", data={"role": "VIEWER"}, token=admin_token)
assert status == 400 and "Safeguard Triggered" in res.get("error", "")
print("✓ Admin demote safeguard prevents removing last admin (400)")

# 12. Admin Updates User Role
status, res = make_req("/admin/users/5/role", method="PATCH", data={"role": "SECURITY_ANALYST"}, token=admin_token)
assert status == 200 and res["user"]["role"] == "SECURITY_ANALYST"
print("✓ Admin successfully updated user role (200)")

# 13. Admin Deactivates User & Deactivated User Cannot Login
status, res = make_req("/admin/users/5/status", method="PATCH", data={"status": "Disabled"}, token=admin_token)
assert status == 200 and res["user"]["status"] == "Disabled"
status, res = make_req("/auth/login", method="POST", data={"username_or_email": "student123", "password": "Student@123"})
assert status == 403 and "Account disabled" in res.get("error", "")
print("✓ Deactivated account login rejected (403)")

# Re-activate student123
make_req("/admin/users/5/status", method="PATCH", data={"status": "Active"}, token=admin_token)

# 14. Forgot and Reset Password
status, res = make_req("/auth/forgot-password", method="POST", data={"username_or_email": "student456"})
assert status == 200
print("✓ Forgot password generic response verified (200)")

status, res = make_req("/auth/reset-password", method="POST", data={"username_or_email": "student456", "new_password": "NewStudent@456"})
assert status == 200
status, res = make_req("/auth/login", method="POST", data={"username_or_email": "student456", "password": "NewStudent@456"})
assert status == 200
print("✓ Password reset and subsequent login verified (200)")

print("\nALL AUTH & RBAC BACKEND TESTS PASSED CLEANLY!")
