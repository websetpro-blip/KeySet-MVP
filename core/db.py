from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
import json
import os
import shutil
import sqlite3
import uuid

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .app_paths import (
    CONFIG_DIR,
    DB_DIR,
    GEO_DIR,
    bootstrap_files,
    ensure_runtime,
    sqlite_url,
)

# Гарантируем наличие runtime и копируем шаблонные данные до инициализации engine
ensure_runtime()
bootstrap_files()

DB_PATH = DB_DIR / "keyset.db"
DATABASE_URL = sqlite_url()

# Keep DATA_DIR for backwards compatibility with groups.json loading
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = DB_PATH.parent  # Directory containing the active database


class Base(DeclarativeBase):
    pass


def ensure_schema() -> None:
    """Perform lightweight SQLite migrations for the tasks table."""
    engine = ensure_schema.engine  # type: ignore[attr-defined]
    inspector = inspect(engine)

    def _slugify(value: str) -> str:
        candidate = (value or '').strip().lower()
        if not candidate:
            return 'group'
        normalized = ''.join(ch if ch.isalnum() else '-' for ch in candidate)
        while '--' in normalized:
            normalized = normalized.replace('--', '-')
        normalized = normalized.strip('-')
        return normalized or 'group'
    
    # Create new tables for turbo parser pipeline
    with engine.begin() as conn:
        # Frequencies table (Wordstat results)
        if not inspector.has_table('frequencies'):
            conn.execute(text('''
                CREATE TABLE frequencies (
                    phrase TEXT PRIMARY KEY,
                    freq INTEGER,
                    region INTEGER DEFAULT 225,
                    processed BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            '''))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_freq_phrase ON frequencies(phrase)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_freq_processed ON frequencies(processed)"))
        
        # Forecasts table (Direct budget results)
        if not inspector.has_table('forecasts'):
            conn.execute(text('''
                CREATE TABLE forecasts (
                    phrase TEXT PRIMARY KEY,
                    cpc REAL,
                    impressions INTEGER,
                    budget REAL,
                    freq_ref TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (freq_ref) REFERENCES frequencies(phrase)
                )
            '''))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_forecast_phrase ON forecasts(phrase)"))
        
        # Clusters table (grouped/clustered results)
        if not inspector.has_table('clusters'):
            conn.execute(text('''
                CREATE TABLE clusters (
                    stem TEXT PRIMARY KEY,
                    phrases TEXT,
                    avg_freq REAL,
                    total_budget REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            '''))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_cluster_stem ON clusters(stem)"))

        groups_table_exists = inspector.has_table('groups')
        if not groups_table_exists:
            conn.execute(text('''
                CREATE TABLE groups (
                    id TEXT PRIMARY KEY,
                    slug TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    parent_id TEXT NULL,
                    color TEXT NOT NULL DEFAULT '#6366f1',
                    type TEXT NOT NULL DEFAULT 'normal',
                    locked INTEGER NOT NULL DEFAULT 0,
                    comment TEXT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(parent_id) REFERENCES groups(id)
                )
            '''))

        columns = {row[1] for row in conn.execute(text('PRAGMA table_info(groups)'))}
        if 'slug' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN slug TEXT"))
            conn.execute(text("UPDATE groups SET slug = '' WHERE slug IS NULL"))
        if 'parent_id' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN parent_id TEXT NULL"))
        if 'color' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN color TEXT NOT NULL DEFAULT '#6366f1'"))
        if 'type' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN type TEXT NOT NULL DEFAULT 'normal'"))
        if 'locked' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN locked INTEGER NOT NULL DEFAULT 0"))
        if 'comment' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN comment TEXT NULL"))
        if 'created_at' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"))
        if 'updated_at' not in columns:
            conn.execute(text("ALTER TABLE groups ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"))

        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_groups_parent_name ON groups(parent_id, name)"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_groups_slug ON groups(slug)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_groups_parent ON groups(parent_id)"))
        conn.execute(text("""
            INSERT OR IGNORE INTO groups (id, slug, name, parent_id, color, type, locked, comment)
            VALUES ('default', 'bez-gruppy', 'Без группы', NULL, '#6366f1', 'normal', 1, NULL)
        """))

        rows = conn.execute(text("SELECT id, name, slug FROM groups")).fetchall()
        existing_slugs = {row[2] for row in rows if row[2]}
        for row_id, row_name, row_slug in rows:
            if row_slug:
                continue
            base_slug = _slugify(row_name)
            candidate = base_slug
            suffix = 2
            while candidate in existing_slugs:
                candidate = f"{base_slug}-{suffix}"
                suffix += 1
            conn.execute(text("UPDATE groups SET slug = :slug WHERE id = :id"), {'slug': candidate, 'id': row_id})
            existing_slugs.add(candidate)

    groups_json_path = DATA_DIR / 'groups.json'
    if groups_json_path.exists():
        try:
            raw_groups = json.loads(groups_json_path.read_text(encoding='utf-8'))
        except Exception:
            raw_groups = None
        if isinstance(raw_groups, list) and raw_groups:
            with engine.begin() as conn:
                non_default_count = conn.execute(
                    text("SELECT COUNT(*) FROM groups WHERE id != 'default'")
                ).scalar_one()
                if non_default_count == 0:
                    existing_rows = conn.execute(text("SELECT id, slug FROM groups")).fetchall()
                    known_ids = {row[0] for row in existing_rows}
                    known_slugs = {row[1] for row in existing_rows if row[1]}
                    mapping: dict[str, str] = {}
                    pending = [entry for entry in raw_groups if isinstance(entry, dict)]
                    progress = True
                    while pending and progress:
                        progress = False
                        for entry in pending[:]:
                            name = str(entry.get('name') or '').strip()
                            if not name or name.lower() == 'без группы':
                                pending.remove(entry)
                                continue
                            original_id = entry.get('id') or entry.get('slug') or entry.get('name')
                            original_id_str = str(original_id) if original_id is not None else ''

                            parent_value = entry.get('parent_id') or entry.get('parentId')
                            parent_id: str | None = None
                            if parent_value is not None:
                                parent_key = str(parent_value)
                                parent_id = mapping.get(parent_key)
                                if parent_id is None and parent_key in known_ids:
                                    parent_id = parent_key
                                if parent_id is None and parent_key in mapping.values():
                                    parent_id = parent_key
                                if parent_id is None:
                                    continue

                            new_id = original_id_str or uuid.uuid4().hex
                            if not new_id or new_id in known_ids or new_id == 'default':
                                new_id = uuid.uuid4().hex
                            while new_id in known_ids or new_id == 'default':
                                new_id = uuid.uuid4().hex

                            raw_slug = entry.get('slug')
                            base_slug = _slugify(str(raw_slug or name))
                            candidate = base_slug
                            suffix = 2
                            while candidate in known_slugs or candidate == 'bez-gruppy':
                                candidate = f"{base_slug}-{suffix}"
                                suffix += 1
                            color = str(entry.get('color') or '#6366f1').strip() or '#6366f1'
                            group_type = str(entry.get('type') or 'normal').strip() or 'normal'
                            comment = entry.get('comment')
                            locked_flag = 1 if entry.get('locked') else 0

                            conn.execute(text("""
                                INSERT OR IGNORE INTO groups (id, slug, name, parent_id, color, type, locked, comment)
                                VALUES (:id, :slug, :name, :parent_id, :color, :type, :locked, :comment)
                            """), {
                                'id': new_id,
                                'slug': candidate,
                                'name': name,
                                'parent_id': parent_id,
                                'color': color,
                                'type': group_type,
                                'locked': locked_flag,
                                'comment': comment,
                            })
                            known_ids.add(new_id)
                            known_slugs.add(candidate)
                            if original_id_str:
                                mapping.setdefault(original_id_str, new_id)
                            if entry.get('slug'):
                                mapping.setdefault(str(entry['slug']), new_id)
                            mapping.setdefault(name, new_id)
                            pending.remove(entry)
                            progress = True

                    if pending:
                        for entry in pending:
                            name = str(entry.get('name') or '').strip()
                            if not name or name.lower() == 'без группы':
                                continue
                            new_id = uuid.uuid4().hex
                            while new_id in known_ids:
                                new_id = uuid.uuid4().hex
                            base_slug = _slugify(name)
                            candidate = base_slug
                            suffix = 2
                            while candidate in known_slugs or candidate == 'bez-gruppy':
                                candidate = f"{base_slug}-{suffix}"
                                suffix += 1
                            color = str(entry.get('color') or '#6366f1').strip() or '#6366f1'
                            group_type = str(entry.get('type') or 'normal').strip() or 'normal'
                            comment = entry.get('comment')
                            locked_flag = 1 if entry.get('locked') else 0
                            conn.execute(text("""
                                INSERT OR IGNORE INTO groups (id, slug, name, parent_id, color, type, locked, comment)
                                VALUES (:id, :slug, :name, NULL, :color, :type, :locked, :comment)
                            """), {
                                'id': new_id,
                                'slug': candidate,
                                'name': name,
                                'color': color,
                                'type': group_type,
                                'locked': locked_flag,
                                'comment': comment,
                            })
                            known_ids.add(new_id)
                            known_slugs.add(candidate)
    
    if inspector.has_table('accounts'):
        with engine.begin() as conn:
            columns = {row[1] for row in conn.execute(text('PRAGMA table_info(accounts)'))}
            if 'proxy_id' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN proxy_id VARCHAR(64)"))
            if 'proxy_strategy' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN proxy_strategy VARCHAR(32) DEFAULT 'fixed'"))
                conn.execute(text("UPDATE accounts SET proxy_strategy = 'fixed' WHERE proxy_strategy IS NULL"))
            if 'cookies' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN cookies TEXT"))
            if 'fingerprint_json' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN fingerprint_json TEXT"))
            if 'captcha_service' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN captcha_service VARCHAR(32) DEFAULT 'none'"))
                conn.execute(text("UPDATE accounts SET captcha_service = 'none' WHERE captcha_service IS NULL"))
            if 'captcha_auto' not in columns:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN captcha_auto INTEGER NOT NULL DEFAULT 0"))

    if not inspector.has_table('tasks'):
        return

    if not inspector.has_table('freq_results'):
        with engine.begin() as conn:
            conn.execute(text('''
                CREATE TABLE freq_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mask TEXT NOT NULL,
                    region INTEGER NOT NULL DEFAULT 225,
                    status TEXT NOT NULL DEFAULT 'queued',
                    freq_total INTEGER NOT NULL DEFAULT 0,
                    freq_exact INTEGER NOT NULL DEFAULT 0,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    error TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(mask, region)
                )
            '''))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_freq_status ON freq_results(status)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_freq_updated ON freq_results(updated_at)"))
    with engine.begin() as conn:
        freq_columns = {row[1] for row in conn.execute(text('PRAGMA table_info(freq_results)'))}
        if 'freq_quotes' not in freq_columns:
            conn.execute(text("ALTER TABLE freq_results ADD COLUMN freq_quotes INTEGER NOT NULL DEFAULT 0"))
        if 'freq_exact' not in freq_columns:
            conn.execute(text("ALTER TABLE freq_results ADD COLUMN freq_exact INTEGER NOT NULL DEFAULT 0"))
        if 'group' not in freq_columns:
            conn.execute(text("ALTER TABLE freq_results ADD COLUMN \"group\" TEXT NULL"))

    with engine.begin() as conn:
        info_rows = list(conn.execute(text('PRAGMA table_info(tasks)')))
        if not info_rows:
            return
        col_names = {row[1] for row in info_rows}
        account_notnull = any(row[1] == 'account_id' and row[3] == 1 for row in info_rows)
        needs_kind = 'kind' not in col_names
        needs_params = 'params' not in col_names

        if account_notnull:
            conn.execute(text('PRAGMA foreign_keys=OFF'))
            kind_select = 'kind' if 'kind' in col_names else "'frequency'"
            params_select = 'params' if 'params' in col_names else 'NULL'
            conn.execute(text('''
                CREATE TABLE tasks_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER REFERENCES accounts(id),
                    seed_file VARCHAR(255) NOT NULL,
                    region INTEGER DEFAULT 225,
                    headless INTEGER DEFAULT 0,
                    dump_json INTEGER DEFAULT 0,
                    created_at DATETIME NOT NULL,
                    started_at DATETIME,
                    finished_at DATETIME,
                    status VARCHAR(32) DEFAULT 'queued',
                    log_path VARCHAR(255),
                    output_path VARCHAR(255),
                    error_message TEXT,
                    kind VARCHAR(16) DEFAULT 'frequency',
                    params TEXT
                )
            '''))
            conn.execute(text(f'''INSERT INTO tasks_new (
                    id, account_id, seed_file, region, headless, dump_json,
                    created_at, started_at, finished_at, status,
                    log_path, output_path, error_message, kind, params
                )
                SELECT
                    id, account_id, seed_file, region, headless, dump_json,
                    created_at, started_at, finished_at, status,
                    log_path, output_path, error_message,
                    {kind_select}, {params_select}
                FROM tasks
            '''))
            conn.execute(text('DROP TABLE tasks'))
            conn.execute(text('ALTER TABLE tasks_new RENAME TO tasks'))
            conn.execute(text('PRAGMA foreign_keys=ON'))
            needs_kind = False
            needs_params = False
        if needs_kind:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN kind VARCHAR(16) DEFAULT 'frequency'"))
            conn.execute(text("UPDATE tasks SET kind = 'frequency' WHERE kind IS NULL"))
        if needs_params:
            conn.execute(text('ALTER TABLE tasks ADD COLUMN params TEXT'))


engine = create_engine(
    DATABASE_URL, 
    echo=False, 
    future=True,
    connect_args={"check_same_thread": False}
)


# Enable WAL mode for better concurrency
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


ensure_schema.engine = engine  # type: ignore[attr-defined]

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
    expire_on_commit=False,
)


@contextmanager
def get_db_connection():
    """Context manager for direct SQLite connection (for batch operations)."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.row_factory = sqlite3.Row  # Access columns by name
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


__all__ = ['Base', 'engine', 'SessionLocal', 'DB_PATH', 'ensure_schema', 'get_db_connection']
