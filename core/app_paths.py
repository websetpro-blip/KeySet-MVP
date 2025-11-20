from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

# Allow specifying app root via environment variable for smoke tests
ENV_APP_ROOT = os.environ.get("KEYSET_APP_ROOT")


def _app_root() -> Path:
    """Determine the application root directory."""
    if ENV_APP_ROOT:
        return Path(ENV_APP_ROOT).resolve()
    if getattr(sys, "frozen", False):
        # PyInstaller frozen executable - root is next to .exe
        return Path(sys.executable).resolve().parent
    # Development mode: repository root (KeySet-MVP)
    return Path(__file__).resolve().parents[1]


# Main paths
APP_ROOT = _app_root()
RUNTIME = APP_ROOT / "runtime"
WWW_DIR = APP_ROOT / "www"
DATA_PRIMARY = APP_ROOT / "core" / "data"
LEGACY_DATA = APP_ROOT / "keyset" / "data"

# Runtime subdirectories
DB_DIR = RUNTIME / "db"
PROFILES_DIR = RUNTIME / ".profiles"
PROFILES = PROFILES_DIR  # backwards compatibility
BROWSERS = RUNTIME / "browsers"  # PLAYWRIGHT_BROWSERS_PATH
GEO_DIR = RUNTIME / "geo"
CONFIG_DIR = RUNTIME / "config"
LOGS_DIR = RUNTIME / "logs"

# Surface runtime paths for legacy modules
os.environ.setdefault("KEYSET_RUNTIME_DB", str(DB_DIR / "keyset.db"))
os.environ.setdefault("KEYSET_RUNTIME_ROOT", str(RUNTIME))


def ensure_runtime() -> None:
    """Create all runtime directories if they don't exist."""
    for path in (DB_DIR, PROFILES_DIR, BROWSERS, GEO_DIR, CONFIG_DIR, LOGS_DIR):
        path.mkdir(parents=True, exist_ok=True)


def _bundle_dir() -> Path:
    """Get the directory where bundled resources are located."""
    return Path(getattr(sys, "_MEIPASS", APP_ROOT))


def _candidate_data_dirs() -> list[Path]:
    """
    Produce ordered list of directories that may contain data templates.

    Priority:
        1. runtime (geo/db/config) – живые данные пользователя
        2. core/data (новое расположение шаблонов)
        3. keyset/data (legacy)
        4. Те же пути внутри PyInstaller bundle.
    """
    dirs: list[Path] = []

    runtime_dirs = (DB_DIR, GEO_DIR, CONFIG_DIR)
    for path in runtime_dirs:
        if path not in dirs:
            dirs.append(path)

    for base in (APP_ROOT, _bundle_dir()):
        for rel in ("core/data", "keyset/data"):
            candidate = base / rel
            if candidate not in dirs:
                dirs.append(candidate)

    return dirs


def locate_data_file(filename: str) -> Path | None:
    """Return the first existing data file among candidate directories."""
    if filename == "keyset.db":
        for candidate in (
            APP_ROOT / "dist" / filename,
            APP_ROOT / filename,
        ):
            if candidate.exists():
                return candidate

    for data_dir in _candidate_data_dirs():
        candidate = data_dir / filename
        if candidate.exists():
            return candidate
    return None


def bootstrap_files() -> None:
    """Copy template files from bundle to runtime on first launch."""
    ensure_runtime()

    # Database
    def _db_has_table(db_path: Path, table: str) -> bool:
        try:
            import sqlite3
            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            row = cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table,),
            ).fetchone()
            conn.close()
            return bool(row)
        except Exception:
            return False

    # Template DB packaged with the app (dev: APP_ROOT/resources/db, exe: _MEIPASS/resources/db)
    template_bases = [APP_ROOT, Path(getattr(sys, "_MEIPASS", APP_ROOT))]
    for base in template_bases:
        template_db = base / "resources" / "db" / "keyset_template.db"
        if template_db.exists():
            target_db = DB_DIR / "keyset.db"
            if (not target_db.exists()) or (not _db_has_table(target_db, "accounts")):
                shutil.copy2(template_db, target_db)
            break

    bundled_db = locate_data_file("keyset.db")
    target_db = DB_DIR / "keyset.db"
    if bundled_db and not target_db.exists():
        shutil.copy2(bundled_db, target_db)

    # GEO data
    bundled_geo = locate_data_file("regions_tree_full.json")
    target_geo = GEO_DIR / "regions_tree_full.json"
    if bundled_geo and not target_geo.exists():
        shutil.copy2(bundled_geo, target_geo)

    # Config files (if default templates exist)
    bundled_proxies = locate_data_file("proxies.json")
    if bundled_proxies and not (CONFIG_DIR / "proxies.json").exists():
        shutil.copy2(bundled_proxies, CONFIG_DIR / "proxies.json")


def sqlite_url() -> str:
    """Get SQLite database URL."""
    return f"sqlite:///{(DB_DIR / 'keyset.db').as_posix()}"
