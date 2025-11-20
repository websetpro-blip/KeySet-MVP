"""
Перенос legacy профилей из C:\\AI\\yandex\\.profiles в portable-runtime (.profiles внутри KeySet-MVP/runtime).
Безопасно копирует каталоги и обновляет пути в БД.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

OLD_BASE = Path(r"C:\AI\yandex\.profiles")
ROOT = Path(__file__).resolve().parents[1]
NEW_BASE = ROOT / "runtime" / ".profiles"


def migrate_profiles() -> None:
    if not OLD_BASE.exists():
        print(f"• Старая папка не найдена: {OLD_BASE}")
        return

    NEW_BASE.mkdir(parents=True, exist_ok=True)
    migrated = 0
    skipped = 0

    for old_profile in OLD_BASE.iterdir():
        if not old_profile.is_dir():
            continue
        target = NEW_BASE / old_profile.name
        if target.exists():
            print(f"• Пропуск {old_profile.name} (уже существует)")
            skipped += 1
            continue
        print(f"→ Копирую {old_profile.name}…")
        shutil.copytree(old_profile, target)
        migrated += 1

    total_size = sum(f.stat().st_size for f in NEW_BASE.rglob("*") if f.is_file())
    print(f"✓ Перенос завершён. Новые профили: {migrated}, пропущено: {skipped}")
    print(f"  Итоговый размер: {total_size / 1024 / 1024:.2f} MB")


def update_database_paths() -> None:
    try:
        sys.path.insert(0, str(ROOT))
        from core.db import SessionLocal
        from core.models import Account
    except Exception as exc:
        print(f"✗ Не удалось загрузить модуль БД: {exc}")
        return

    updated = 0
    with SessionLocal() as session:
        accounts = session.query(Account).all()
        for account in accounts:
            if not account.profile_path:
                continue
            old_path = Path(account.profile_path)
            try:
                old_path.relative_to(OLD_BASE)
            except Exception:
                continue
            new_path = Path(str(old_path).replace(str(OLD_BASE), str(NEW_BASE)))
            account.profile_path = str(new_path)
            updated += 1
            print(f"✓ Обновлён путь для {account.name}: {old_path} → {new_path}")
        if updated:
            session.commit()
    if updated:
        print(f"✓ Обновлено записей в БД: {updated}")
    else:
        print("• Пути в БД уже актуальны")


if __name__ == "__main__":
    print("🚚 Перенос профилей в runtime/.profiles")
    migrate_profiles()
    print("\n🔄 Обновление путей в БД…")
    update_database_paths()
    print("✅ Готово")
