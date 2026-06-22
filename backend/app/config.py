"""Application configuration."""

import os
import sys


def _get_base_dir() -> str:
    """Return the writable directory for database and data files.

    When running as a PyInstaller bundle (sys.frozen), the executable
    directory may be read-only.  Use the user's AppData folder instead
    so the database survives updates and doesn't need admin rights.
    """
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller one-file exe
        appdata = os.environ.get('APPDATA', os.path.expanduser('~'))
        data_dir = os.path.join(appdata, 'DailyLikeTrees')
        os.makedirs(data_dir, exist_ok=True)
        return data_dir
    else:
        # Running from source
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


BASE_DIR = _get_base_dir()
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'data.db')}"

# CORS — allow Vite dev server + Tauri production WebView origins.
# In production the Tauri webview loads the page from tauri://localhost,
# which is a different origin from localhost:5173, so both are needed.
CORS_ORIGINS = [
    # Vite dev server
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Tauri v2 production (custom protocol)
    "tauri://localhost",
    "https://tauri.localhost",
    "http://tauri.localhost",
    # Tauri v2 — some WebView versions send "null" for custom protocols
    "null",
    # Allow all origins in development (CORS preflight 400 workaround)
    "*",
]
