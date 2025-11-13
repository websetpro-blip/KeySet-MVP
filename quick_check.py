#!/usr/bin/env python3
# Мгновенная диагностика

import os
import sqlite3
from pathlib import Path

# Проверим обе БД
root = Path(__file__).resolve().parent
paths = {
    "dist": root / "dist" / "keyset.db",
    "main": root / "keyset.db",
}

for name, path in paths.items():
    print(f"\n= {name}: {path}")
    
    if not os.path.exists(path):
        print("NOT FOUND")
        continue
    
    size = os.path.getsize(path)
    print(f"Size: {size} bytes ({size/1024/1024:.2f} MB)")
    
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        
        # Получим все таблицы
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cur.fetchall()
        
        print(f"Tables: {len(tables)}")
        
        # Ключевые
        for tbl in ["accounts", "frequencies", "groups", "tasks"]:
            try:
                cur.execute(f"SELECT COUNT(*) FROM [{tbl}]")
                cnt = cur.fetchone()[0]
                print(f"  - {tbl}: {cnt} rows")
            except:
                print(f"  - {tbl}: NOT EXIST")
        
        conn.close()
    except Exception as e:
        print(f"ERROR: {e}")
