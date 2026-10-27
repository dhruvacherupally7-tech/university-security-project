# University Security SOC
### AI-Based Intelligent University Log Pre-Processing, Threat Detection, and Automated Security Vulnerability Scanning System

An authorized academic cybersecurity prototype simulating a modern University Security Operations Center (SOC). Built using **React + Vite** for the frontend and **Python Flask** with **scikit-learn Isolation Forest** and **SQLite** for the backend.

---

## Architecture Overview

```
University Application Logs
        ↓
Log Collection & Ingestion (POST /api/logs/sync)
        ↓
Log Preprocessing (Validation, Sanitization, Normalization)
        ↓
Rule-Based Threat Correlation Engine (5 Defensive Correlation Rules)
        ↓
Machine Learning Anomaly Detection (Isolation Forest Feature Vectors)
        ↓
Threat Findings Repository (High / Medium / Low Alerting)
        ↓
Safe Security Configuration Vulnerability Audit (Headers & Flags)
        ↓
Centralized SOC Dashboard & Interactive Incident Review
        ↓
Executive Security Audit Reports (JSON / Analytical Summaries)
```

---

## Technology Stack

- **Frontend**: React, Vite, React Router, Recharts, Lucide React, Glassmorphic SOC Design System.
- **Backend**: Python 3.13, Flask, Flask-CORS, Flask-SQLAlchemy, scikit-learn (Isolation Forest), NumPy.
- **Database**: SQLite (`backend/database/university_security.db`).

---

## Seed Data & Defensive Posture

The application automatically initializes and seeds demo data on backend startup:
- **46 Security Events** (Authentications, administrative resource access, probes, and logouts)
- **5 Correlated Threat Findings**:
  - `1 High`: Unauthorized Admin Resource Enumeration (`/admin` and `/reports`)
  - `3 Medium`: Repeated Failed Authentication Burst, Unusual IP Activity Burst, Repeated HTTP 401
  - `1 Low`: Off-Subnet Restricted Route Probe
- **3 Monitored Active Users**: `student123`, `student456`, `staff01`
- **3 Monitored IP Addresses**: `192.168.1.25`, `192.168.1.30`, `192.168.1.45`
- **6 Vulnerability Audit Checks**:
  - `2 Passed`: X-Frame-Options Clickjacking Defense, X-Content-Type-Options Sniffing Defense
  - `4 Warning`: CSP Directives, HSTS Policy, Secure Session Cookie Flags, Referrer-Policy
  - `0 Failed`
- **6 Core Pipeline Services**: API Server, Database, Log Collector, Preprocessor, Rule Engine, ML Engine.

---

## Quick Start & Running Locally

### 1. Start the Flask Backend
```bash
# From workspace root:
python backend/app.py
```
*Backend will start on `http://localhost:5000/api` and auto-seed `backend/database/university_security.db`.*

### 2. Start the React Frontend
```bash
# In another terminal:
npm run dev
# OR:
cd frontend && npm run dev
```
*Frontend will launch on `http://localhost:5173/`.*

---

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and database liveness ping |
| `GET` | `/api/dashboard/summary` | KPI counters, chart datasets, top users & top IPs |
| `GET` | `/api/events` | Query security events with filtering, search & pagination |
| `GET` | `/api/events/<id>` | Retrieve specific security event details |
| `POST` | `/api/logs/sync` | Ingest and preprocess new log entries |
| `GET` | `/api/findings` | Query correlated threat findings with severity filters |
| `GET` | `/api/findings/<id>` | Retrieve individual threat finding with evidence |
| `GET` | `/api/users` | List monitored user accounts, activity counts & risk levels |
| `GET` | `/api/users/<username>` | Retrieve specific user account and recent event trail |
| `GET` | `/api/ips` | Monitored IP addresses, locations & user counts |
| `GET` | `/api/ips/<ip>` | Host diagnostics and associated log stream |
| `GET` | `/api/vulnerabilities` | Baseline security configuration audit posture |
| `POST` | `/api/vulnerability/scan` | Trigger safe, non-destructive configuration audit scan |
| `GET` | `/api/ml/summary` | Isolation Forest model status and parameters |
| `GET` | `/api/ml/anomalies` | Entity anomaly scores and Potential Anomaly classifications |
| `POST` | `/api/ml/run` | Execute feature vector extraction and Isolation Forest fit |
| `GET` | `/api/system-health` | Micro-service health, response latency & details |
| `GET` | `/api/reports` | List generated security audit reports |
| `POST` | `/api/reports/generate` | Generate on-demand comprehensive security audit report |

---

## Automated Verification

You can verify all backend endpoints at any time by running:
```bash
python test_endpoints.py
```
All endpoints will report HTTP 200/201 status codes.
