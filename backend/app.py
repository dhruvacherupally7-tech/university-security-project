import os
import sys

# Ensure backend root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database.database import init_db
from database.seed import seed_database

# Import Route Blueprints
from routes.health import health_bp
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.audit import audit_bp
from routes.dashboard import dashboard_bp
from routes.events import events_bp
from routes.findings import findings_bp
from routes.users import users_bp
from routes.ips import ips_bp
from routes.vulnerabilities import vulnerabilities_bp
from routes.ml import ml_bp
from routes.reports import reports_bp
from database.seed import seed_database, ensure_admin_exists
from database.migrate import run_migrations

def create_app():
    # Ensure database directory exists
    os.makedirs(os.path.join(BASE_DIR, "database"), exist_ok=True)

    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all local dev origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database and Models
    init_db(app)

    # Automatically Run Migrations, Seed Demo Data and guarantee Administrator account
    db_file_path = os.path.join(BASE_DIR, "database", "university_security.db")
    run_migrations(db_file_path)

    with app.app_context():
        seed_database()
        ensure_admin_exists()

    # Register Blueprints
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(events_bp, url_prefix="/api")
    app.register_blueprint(findings_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(ips_bp, url_prefix="/api")
    app.register_blueprint(vulnerabilities_bp, url_prefix="/api")
    app.register_blueprint(ml_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")

    # Global Error Handlers for clean JSON
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app

app = create_app()

if __name__ == "__main__":
    print("==================================================")
    print(" University Security SOC - Backend API Starting")
    print(" Database: backend/database/university_security.db")
    print(" REST API URL: http://localhost:5000/api")
    print("==================================================")
    app.run(host="0.0.0.0", port=5000, debug=True)
