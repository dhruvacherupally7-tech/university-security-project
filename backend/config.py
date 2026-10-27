import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_DIR = os.path.join(BASE_DIR, "database")
DATABASE_PATH = os.path.join(DATABASE_DIR, "university_security.db")

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-soc-key-univ-sec-prototype")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "university-soc-jwt-secret-academic-2026")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24
    DATABASE_PATH = DATABASE_PATH
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH.replace(os.sep, '/')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    PORT = 5000
    HOST = "0.0.0.0"
