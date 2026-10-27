from flask import Blueprint, jsonify
from services.ml_engine import MLEngine
from utils.auth import token_required, permission_required
from utils.audit import log_audit_action

ml_bp = Blueprint("ml", __name__)

@ml_bp.route("/ml/summary", methods=["GET"])
@token_required
def get_ml_summary():
    summary = MLEngine.get_summary()
    return jsonify(summary)


@ml_bp.route("/ml/anomalies", methods=["GET"])
@token_required
def get_ml_anomalies():
    summary = MLEngine.get_summary()
    return jsonify(summary.get("anomalies", []))


@ml_bp.route("/ml/run", methods=["POST"])
@token_required
@permission_required("RUN_ML")
def run_ml():
    result = MLEngine.run_detection()
    anomalies_cnt = result.get("potential_anomalies", 0)
    log_audit_action(
        "ML_ANALYSIS_EXECUTED",
        resource_type="ML_ENGINE",
        resource_id=result.get("model_name", "Isolation Forest"),
        description=f"Executed Isolation Forest behavioral anomaly detection. Evaluated {result.get('total_evaluated', 0)} entities, identified {anomalies_cnt} anomalies."
    )
    return jsonify(result)
