#!/usr/bin/env python3
# Диагностика кейсетовой БД

import sqlite3
import json
import os
from pathlib import Path

# Проверяем обе БД
dist_db = r'C:\AI\yandex\KeySet-MVP\dist\keyset.db'main_db = r'C:\AI\yandex\KeySet-MVP\keyset\keyset.db'

result = {}

print("\n=== Проверка БАЗ ДАННЫХ ===")

# Проверим что существует
for db_path, db_name in [(dist_db, "DIST (prod)"), (main_db, "MAIN (dev)")]:
    print(f"\n[] БАЗА: {db_name}")
    print(f" Путь: {db_path}")
    
    if not os.path.exists(db_path):
        print(" ❌ Файл не найден!")
        result[db_name] = "NOT_FOUND"
        continue
    
    file_size = os.path.getsize(db_path)
    print(f" ✡ Размер: {file_size} байт {(file_size / 1024 / 1024):.2f} MB")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Получим таблицы
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        
        print(f" ✡ Таблиц: {len(tables)}")
        
        table_info = {}
        for (table_name,) in tables:
            cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
            count = cursor.fetchone()[0]
            table_info[table_name] = count
            print(f"    - {table_name}: {count} ров (records)")
        
        result[db_name] = {
            "size": file_size,
            "tables": [{"name": t[0], "rows": table_info[t[0]]} for t in tables]
        }
        
        # Найдем самые важные таблицы
        print(f"  🔎 Ключевые таблицы:")
        
        for key_table in ["accounts", "frequencies", "groups", "tasks"]:
            if key_table in table_info:
                count = table_info[key_table]
                status = "✅" if count > 0 else "🟡"
                print(f"        {status} {key_table}: {count}")
        
        conn.close()
        
    except Exception as e:
        print(f" ❌ Ошибка при открытии БД: {e}")


print("\n=== РЕЗУЛЬТАТ ===")
print(json.dumps(result, indent=2, ensure_ascii=False))