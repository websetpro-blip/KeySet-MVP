from __future__ import annotations
import os
import sys
import shutil
from pathlib import Path

# Allow specifying app root via environment variable for smoke tests
ENV_APP_ROOT = os.environ.get("KEYSET_APP_ROOT")

def _app_root() -> Path:
    """Determine the application root directory."""
    if ENV_APP_ROOT:
        return Path(ENV_APP_ROOT).resolve()
    if getattr(sys, 'frozen', False):
        # PyInstaller frozen executable - root is next to .exe
        return Path(sys.executable).resolve().parent
    # Development mode: repository root
    return Path(__file__).resolve().parents[3]

# Main paths
APP_ROOT = _app_root()
RUNTIME   = APP_ROOT / "runtime"
WWW_DIR   = APP_ROOT / "www"

# Runtime subdirectories
DB_DIR     = RUNTIME / "db"
PROFILES   = RUNTIME / "profiles"
BROWSERS   = RUNTIME / "browsers"   # PLAYWRIGHT_BROWSERS_PATH
GEO_DIR    = RUNTIME / "geo"
CONFIG_DIR = RUNTIME / "config"
LOGS_DIR   = RUNTIME / "logs"

def ensure_runtime():
    """Create all runtime directories if they don't exist."""
    for p in (DB_DIR, PROFILES, BROWSERS, GEO_DIR, CONFIG_DIR, LOGS_DIR):
        p.mkdir(parents=True, exist_ok=True)

def _bundle_dir() -> Path:
    """Get the directory where bundled resources are located."""
    return Path(getattr(sys, "_MEIPASS", APP_ROOT))

def bootstrap_files():
    """Copy template files from bundle to runtime on first launch."""
    ensure_runtime()

    # Database
    bundled_db = _bundle_dir() / "keyset" / "data" / "keyset.db"
    target_db  = DB_DIR / "keyset.db"
    if bundled_db.exists() and not target_db.exists():
        shutil.copy2(bundled_db, target_db)

    # GEO data
    bundled_geo = _bundle_dir() / "keyset" / "data" / "regions_tree_full.json"
    target_geo  = GEO_DIR / "regions_tree_full.json"
    if bundled_geo.exists() and not target_geo.exists():
        shutil.copy2(bundled_geo, target_geo)

    # Config files (if default templates exist)
    bundled_proxies = _bundle_dir() / "keyset" / "data" / "proxies.json"
    if bundled_proxies.exists() and not (CONFIG_DIR / "proxies.json").exists():
        shutil.copy2(bundled_proxies, CONFIG_DIR / "proxies.json")

def sqlite_url() -> str:
    """Get SQLite database URL."""
    return f"sqlite:///{(DB_DIR / 'keyset.db').as_posix()}"
