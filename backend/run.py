"""PyInstaller entry point — starts the FastAPI server via uvicorn.

IMPORTANT: The app must be imported explicitly (not just referenced as a
string in uvicorn.run()) so that PyInstaller detects the dependency and
includes all backend modules in the one-file bundle.

When built with console=False (Windows GUI subsystem), sys.stdout and
sys.stderr are None — we redirect them to a log file so uvicorn's
logging doesn't crash.
"""

import os
import sys

# ── Handle GUI mode (no console attached) ──
if sys.stdout is None or sys.stderr is None:
    log_dir = os.path.join(os.environ.get('APPDATA', os.path.expanduser('~')), 'DailyLikeTrees')
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, 'backend.log')
    f = open(log_path, 'a', encoding='utf-8')
    if sys.stdout is None:
        sys.stdout = f
    if sys.stderr is None:
        sys.stderr = f

import uvicorn
from app.main import app  # ← explicit import so PyInstaller bundles 'app'

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info",
    )
