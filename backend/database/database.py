import os
import sys
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Initializes SQLAlchemy with the Flask application context,
    ensures the database directory exists, and creates all tables.
    """
    db.init_app(app)
    with app.app_context():
        import database.models  # noqa: F401
        db.create_all()

def reset_db(app):
    """
    Drops all existing tables, recreates schema with all indexes, and reseeds demo data.
    """
    with app.app_context():
        import database.models  # noqa: F401
        from database.seed import seed_database
        db.drop_all()
        db.create_all()
        seed_database(force=True)
        print("Database successfully reset and reseeded with clean demo data.")
