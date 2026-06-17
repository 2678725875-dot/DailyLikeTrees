"""Application configuration."""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'data.db')}"

# CORS - allow all origins in development
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
