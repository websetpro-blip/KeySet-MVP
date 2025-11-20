"""
Безопасная миграция базы keyset.db:
- автосоздание таблицы profile_slots и поля active_slot_id в accounts;
- создание дефолтных слотов для существующих аккаунтов на основе profile_path;
- автоматический бэкап перед любыми изменениями.
"""
from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_FILE = ROOT / "runtime" / "db" / "keyset.db"


def _backup_db() -> Path:
    backup_name = f"keyset.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    backup_path = DB_FILE.parent / backup_name
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DB_FILE, backup_path)
    return backup_path


def _table_exists(cursor: sqlite3.Cursor, name: str) -> bool:
    row = cursor.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (name,),
    ).fetchone()
    return bool(row)


def _column_exists(cursor: sqlite3.Cursor, table: str, column: str) -> bool:
    rows = cursor.execute(f"PRAGMA table_info({table})").fetchall()
    return any(r[1] == column for r in rows)


def safe_migrate() -> bool:
    if not DB_FILE.exists():
        print(f"✗ БД не найдена: {DB_FILE}")
        return False

    backup_file = _backup_db()
    print(f"✓ Бэкап создан: {backup_file}")

    conn = sqlite3.connect(DB_FILE)
    try:
        cursor = conn.cursor()

        # Таблица profile_slots
        if not _table_exists(cursor, "profile_slots"):
            print("→ Создаю таблицу profile_slots…")
            cursor.execute(
                """
                CREATE TABLE profile_slots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    profile_path TEXT NOT NULL,
                    cookies_file TEXT,
                    profile_size INTEGER DEFAULT 0,
                    cookies_count INTEGER DEFAULT 0,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                    UNIQUE(account_id, name)
                )
                """
            )
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_slots_account ON profile_slots(account_id)")
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_slots_active ON profile_slots(account_id, is_active)"
            )
            print("✓ Таблица profile_slots создана")
        else:
            print("• Таблица profile_slots уже существует — пропускаю")

        # Новое поле в accounts
        if not _column_exists(cursor, "accounts", "active_slot_id"):
            print("→ Добавляю колонку active_slot_id в accounts…")
            cursor.execute(
                "ALTER TABLE accounts ADD COLUMN active_slot_id INTEGER REFERENCES profile_slots(id)"
            )
            print("✓ Колонка active_slot_id добавлена")
        else:
            print("• Колонка active_slot_id уже существует — пропускаю")

        # Дефолтные слоты для уже существующих аккаунтов
        rows = cursor.execute(
            "SELECT id, name, profile_path FROM accounts WHERE active_slot_id IS NULL"
        ).fetchall()
        created_slots = 0
        for acc_id, acc_name, profile_path in rows:
            if not profile_path:
                continue
            cursor.execute(
                """
                INSERT INTO profile_slots (account_id, name, profile_path, is_active)
                VALUES (?, ?, ?, 1)
                """,
                (acc_id, "Default", profile_path),
            )
            slot_id = cursor.lastrowid
            cursor.execute(
                "UPDATE accounts SET active_slot_id = ? WHERE id = ?",
                (slot_id, acc_id),
            )
            created_slots += 1
            print(f"✓ Создан слот для {acc_name}: {profile_path}")

        if created_slots:
            print(f"✓ Дефолтные слоты созданы: {created_slots}")
        else:
            print("• Все аккаунты уже имеют активный слот — пропускаю создание дефолтных")

        conn.commit()
        print("✓ Миграция завершена успешно")
        return True
    except Exception as exc:  # pragma: no cover — аварийный сценарий
        conn.rollback()
        print(f"✗ Ошибка миграции: {exc}")
        if backup_file.exists():
            shutil.copy2(backup_file, DB_FILE)
            print("↩ БД восстановлена из бэкапа")
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    print("🚀 Безопасная миграция keyset.db")
    print(f"БД: {DB_FILE}")
    success = safe_migrate()
    if success:
        print("✅ Готово")
    else:
        print("⚠️ Миграция не выполнена")
