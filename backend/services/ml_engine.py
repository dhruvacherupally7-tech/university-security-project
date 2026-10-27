import json
from datetime import datetime
import numpy as np
from sklearn.ensemble import IsolationForest
from database.database import db
from database.models import SecurityEvent, MLAnomaly

class MLEngine:
    """
    AI-Based Anomaly Detection Engine using scikit-learn Isolation Forest.
    Analyzes aggregated entity features to flag 'Potential Anomalies' without making definitive attack claims.
    """

    FEATURES = [
        "total_events",
        "failed_logins",
        "successful_logins",
        "unauthorized_events",
        "unique_resources",
        "failure_ratio",
        "hour_of_day"
    ]

    @staticmethod
    def extract_features():
        """
        Extracts behavior metrics grouped by (username, ip_address).
        """
        events = SecurityEvent.query.all()
        if not events:
            return [], []

        # Group events by (username, ip_address)
        groups = {}
        for ev in events:
            key = (ev.username, ev.ip_address)
            groups.setdefault(key, []).append(ev)

        data = []
        meta = []

        for (user, ip), ev_list in groups.items():
            total_events = len(ev_list)
            failed_logins = sum(1 for e in ev_list if e.event_type == "LOGIN_FAILED" or e.status_code == 401)
            successful_logins = sum(1 for e in ev_list if e.event_type == "LOGIN_SUCCESS" or (e.resource == "/login" and e.status_code == 200))
            unauthorized_events = sum(1 for e in ev_list if e.event_type == "UNAUTHORIZED_ACCESS" or e.status_code == 403)
            unique_resources = len(set(e.resource for e in ev_list))
            failure_ratio = float(failed_logins) / total_events if total_events > 0 else 0.0
            
            # Median or latest hour of activity
            latest_hour = ev_list[-1].timestamp.hour if ev_list[-1].timestamp else 12

            feature_vector = [
                float(total_events),
                float(failed_logins),
                float(successful_logins),
                float(unauthorized_events),
                float(unique_resources),
                float(failure_ratio),
                float(latest_hour)
            ]

            feature_dict = {
                "total_events": total_events,
                "failed_logins": failed_logins,
                "successful_logins": successful_logins,
                "unauthorized_events": unauthorized_events,
                "unique_resources": unique_resources,
                "failure_ratio": round(failure_ratio, 3),
                "hour_of_day": latest_hour
            }

            data.append(feature_vector)
            meta.append({
                "username": user,
                "ip_address": ip,
                "event_id": ev_list[-1].id,
                "features": feature_dict
            })

        return data, meta

    @classmethod
    def run_detection(cls):
        """
        Executes Isolation Forest anomaly scoring on extracted entity profiles.
        Stores results in ml_anomalies table and returns detailed summary.
        """
        data, meta = cls.extract_features()
        if len(data) < 2:
            return {
                "status": "warning",
                "message": "Insufficient data points for robust Isolation Forest clustering. Need at least 2 distinct entity profiles.",
                "total_evaluated": len(data),
                "potential_anomalies": 0,
                "results": []
            }

        X = np.array(data, dtype=float)

        # Standard Isolation Forest configuration
        # contamination sets expected proportion of outliers (e.g. 0.3 for a mini demo set)
        contamination_rate = min(0.35, max(0.1, 1.0 / len(data)))
        model = IsolationForest(
            n_estimators=100,
            contamination=contamination_rate,
            random_state=42
        )
        model.fit(X)

        # scores: lower is more abnormal, negative implies anomaly in standard sklearn
        scores = model.decision_function(X)
        predictions = model.predict(X)  # -1 for anomaly, 1 for normal

        now = datetime.utcnow()
        results = []
        anomaly_count = 0

        # Clear previous run results to prevent unbounded accumulation
        MLAnomaly.query.delete()

        for i in range(len(meta)):
            is_anomaly = bool(predictions[i] == -1)
            if is_anomaly:
                anomaly_count += 1
            anomaly_score = float(scores[i])

            record = MLAnomaly(
                event_id=meta[i]["event_id"],
                username=meta[i]["username"],
                ip_address=meta[i]["ip_address"],
                anomaly_score=anomaly_score,
                is_anomaly=is_anomaly,
                model_name="IsolationForest (n_estimators=100, contamination=auto)",
                features=json.dumps(meta[i]["features"]),
                created_at=now
            )
            db.session.add(record)
            
            res_dict = record.to_dict()
            res_dict["classification"] = "Potential Anomaly" if is_anomaly else "Normal Baseline"
            res_dict["parsed_features"] = meta[i]["features"]
            results.append(res_dict)

        db.session.commit()

        avg_score = float(np.mean(scores)) if len(scores) > 0 else 0.0

        return {
            "status": "success",
            "model_name": "Isolation Forest",
            "total_evaluated": len(data),
            "potential_anomalies": anomaly_count,
            "average_anomaly_score": round(avg_score, 4),
            "features_used": cls.FEATURES,
            "last_model_run": now.isoformat(),
            "results": results
        }

    @classmethod
    def get_summary(cls):
        """
        Retrieves the latest ML anomaly status and stats without retraining.
        """
        anomalies = MLAnomaly.query.order_by(MLAnomaly.anomaly_score.asc()).all()
        potential_anomalies = sum(1 for a in anomalies if a.is_anomaly)
        avg_score = np.mean([a.anomaly_score for a in anomalies]) if anomalies else 0.0
        last_run = anomalies[0].created_at.isoformat() if anomalies and anomalies[0].created_at else None

        results = []
        for a in anomalies:
            item = a.to_dict()
            item["classification"] = "Potential Anomaly" if a.is_anomaly else "Normal Baseline"
            try:
                item["parsed_features"] = json.loads(a.features) if a.features else {}
            except Exception:
                item["parsed_features"] = {}
            results.append(item)

        return {
            "model_name": "Isolation Forest",
            "model_status": "Ready",
            "features": cls.FEATURES,
            "total_profiles": len(anomalies),
            "anomaly_count": potential_anomalies,
            "average_anomaly_score": round(float(avg_score), 4),
            "last_model_run": last_run,
            "anomalies": results
        }
