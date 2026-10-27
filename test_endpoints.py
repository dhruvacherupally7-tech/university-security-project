import urllib.request
import json

endpoints = [
  '/api/health',
  '/api/dashboard/summary',
  '/api/events',
  '/api/events/1',
  '/api/findings',
  '/api/findings/1',
  '/api/users',
  '/api/users/student123',
  '/api/ips',
  '/api/ips/192.168.1.25',
  '/api/vulnerabilities',
  '/api/ml/summary',
  '/api/ml/anomalies',
  '/api/system-health',
  '/api/reports'
]

# 0. Obtain Admin Token
login_req = urllib.request.Request(
    'http://127.0.0.1:5000/api/auth/login',
    data=json.dumps({"username_or_email": "admin", "password": "Admin@123"}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(login_req, timeout=3) as resp:
    token = json.loads(resp.read().decode())["access_token"]
    print("✓ Acquired Admin Auth Bearer Token")

print("\n=== VERIFYING API GET ENDPOINTS ===")
for ep in endpoints:
    url = 'http://127.0.0.1:5000' + ep
    try:
        req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = resp.read()
            print(f"{ep:25} -> Status: {resp.status} | Length: {len(data)}")
    except Exception as e:
        print(f"{ep:25} -> ERROR: {e}")

print("\n=== VERIFYING POST /api/logs/sync ===")
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/logs/sync',
    data=json.dumps([{"username": "staff01", "ip_address": "192.168.1.45", "event_type": "LOGIN_SUCCESS", "status_code": 200, "resource": "/profile", "severity": "Low"}]).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req, timeout=3) as resp:
    print("POST /api/logs/sync -> Status:", resp.status)

print("\n=== VERIFYING POST /api/vulnerability/scan ===")
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/vulnerability/scan',
    data=json.dumps({}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req, timeout=3) as resp:
    print("POST /api/vulnerability/scan -> Status:", resp.status)

print("\n=== VERIFYING POST /api/ml/run ===")
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/ml/run',
    data=json.dumps({}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req, timeout=3) as resp:
    print("POST /api/ml/run -> Status:", resp.status)

print("\n=== VERIFYING POST /api/reports/generate ===")
req = urllib.request.Request(
    'http://127.0.0.1:5000/api/reports/generate',
    data=json.dumps({"report_type": "Automated SOC Verification"}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req, timeout=3) as resp:
    print("POST /api/reports/generate -> Status:", resp.status)

print("\nALL BACKEND API TESTS COMPLETED!")
