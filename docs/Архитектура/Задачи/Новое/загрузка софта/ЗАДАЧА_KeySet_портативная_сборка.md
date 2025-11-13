# Задача: Портативная сборка KeySet-MVP

> **Рабочая директория:** `C:\AI\yandex\KeySet-MVP`
> **Цель:** Сделать рабочую версию с портативной структурой (runtime/, www/), затем .exe

---

## Текущее состояние

- ✅ Есть рабочие парсеры в `C:\AI\yandex\KeySet-MVP\keyset`
- ✅ Создан модуль `keyset/core/app_paths.py` для портативных путей
- ✅ Обновлен `keyset/core/db.py` - использует портативные пути
- ✅ Обновлен `backend/main.py` - раздает SPA из `www/`
- ✅ Обновлен `launcher.py` - Edge --app режим с портативными путями
- ✅ Создан `keyset/core/playwright_config.py` - настройка Playwright

## Проблема

UI открывается, но:
- **Failed to fetch** - фронт не видит API
- Пустые вкладки Аккаунты/Данные
- API и UI на разных портах/origin

## Решение: 2 этапа

### Этап 1: DEV-режим (сейчас делаем)

Делаем рабочую версию прямо в `C:\AI\yandex\KeySet-MVP` без сборки .exe:

```
C:\AI\yandex\KeySet-MVP\
├─ keyset/              # ✅ рабочие парсеры (не трогаем)
├─ backend/             # ✅ FastAPI
├─ frontend/            # ✅ React
│  └─ dist/            # → копируется в www/
├─ runtime/             # ⚠️ создаем здесь, на месте
│  ├─ db/              # БД
│  ├─ profiles/        # профили аккаунтов
│  ├─ browsers/        # Playwright Chromium
│  ├─ geo/             # regions_tree_full.json
│  ├─ config/          # proxies.json
│  ├─ edge_profile/    # профиль Edge
│  └─ logs/
├─ www/                 # ⚠️ создаем: копия frontend/dist
│  ├─ index.html
│  └─ assets/
├─ launcher.py          # ✅ обновлен
└─ .venv/               # Python окружение
```

**Важно:** Все делаем **на месте** в `KeySet-MVP`, никаких `out\KeySet` или других промежуточных папок!

### Этап 2: .exe сборка (потом)

После того как dev-режим заработает, соберем в .exe через PyInstaller.

---

## План действий (Этап 1: DEV)

### Шаг 1: Собрать frontend в www/

```bash
cd C:\AI\yandex\KeySet-MVP\frontend
npm run build
cd ..

# Копируем dist в www
rmdir /S /Q www 2>nul
xcopy /E /I /Y frontend\dist www
```

### Шаг 2: Установить Playwright браузер в runtime/browsers

```bash
cd C:\AI\yandex\KeySet-MVP
set PLAYWRIGHT_BROWSERS_PATH=runtime\browsers
.venv\Scripts\python.exe -m pip install playwright
.venv\Scripts\python.exe -m playwright install chromium
```

### Шаг 3: Проверить структуру путей

Файл `keyset/core/app_paths.py` (✅ уже создан):

```python
from __future__ import annotations
import os, sys, shutil
from pathlib import Path

ENV_APP_ROOT = os.environ.get("KEYSET_APP_ROOT")

def _app_root() -> Path:
    if ENV_APP_ROOT:
        return Path(ENV_APP_ROOT).resolve()
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).resolve().parent
    # dev-режим: корень репо C:\AI\yandex\KeySet-MVP
    return Path(__file__).resolve().parents[3]

APP_ROOT = _app_root()
RUNTIME   = APP_ROOT / "runtime"
WWW_DIR   = APP_ROOT / "www"

DB_DIR     = RUNTIME / "db"
PROFILES   = RUNTIME / "profiles"
BROWSERS   = RUNTIME / "browsers"
GEO_DIR    = RUNTIME / "geo"
CONFIG_DIR = RUNTIME / "config"
LOGS_DIR   = RUNTIME / "logs"
```

### Шаг 4: Проверить backend/main.py

Файл `backend/main.py` (✅ уже обновлен):

```python
from keyset.core.app_paths import WWW_DIR, ensure_runtime, bootstrap_files

# Инициализация runtime при старте
ensure_runtime()
bootstrap_files()

# ...routers...

# Раздача SPA из www/ (один origin!)
def _resolve_frontend_paths() -> tuple[Path, Path]:
    if WWW_DIR.exists():
        return WWW_DIR, APP_ROOT
    # Fallback на dev
    repo_root = BASE_DIR.parent
    return repo_root / "frontend" / "dist", repo_root
```

### Шаг 5: Запустить dev-версию

```bash
cd C:\AI\yandex\KeySet-MVP
.venv\Scripts\python.exe launcher.py
```

**Проверка:**
1. Edge откроется на `http://127.0.0.1:8765`
2. `http://127.0.0.1:8765/api/health` → 200 OK
3. `http://127.0.0.1:8765/api/accounts` → `[]` или данные
4. Вкладки "Аккаунты" и "Данные" **без** "Failed to fetch"

---

## Структура модулей (что уже готово)

### ✅ keyset/core/app_paths.py
Централизованные пути для портативной структуры.

### ✅ keyset/core/db.py
```python
from .app_paths import bootstrap_files, sqlite_url, DB_DIR

bootstrap_files()  # Копирует шаблон БД в runtime/db/
DATABASE_URL = sqlite_url()  # sqlite:///runtime/db/keyset.db
```

### ✅ keyset/core/playwright_config.py
```python
import os
from .app_paths import BROWSERS, PROFILES

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(BROWSERS)

def get_profile_dir(account_id: int) -> str:
    profile_path = PROFILES / f"acc_{account_id}"
    profile_path.mkdir(parents=True, exist_ok=True)
    return str(profile_path)
```

### ✅ backend/main.py
Раздает SPA из `www/`, один origin с API.

### ✅ launcher.py
```python
from keyset.core.app_paths import APP_ROOT, RUNTIME

# Edge профиль в runtime/
user_data = RUNTIME / "edge_profile"

# Запуск на фиксированном порту 8765
# Health-check перед открытием браузера
```

---

## Что НЕ трогаем

- `C:\AI\yandex\KeySet-MVP\keyset\` - рабочие парсеры, не меняем
- Бизнес-логику - только пути и упаковку
- Существующую БД - все портируется через bootstrap

---

## Типичные ошибки

### ❌ "Failed to fetch"

**Причина:** UI и API на разных портах/origin.

**Решение:**
1. Проверь что `www/` содержит собранный frontend
2. Backend должен раздавать `www/` через StaticFiles
3. Лаунчер должен открывать Edge на том же порту что и backend (8765)

### ❌ "Runtime not found"

**Причина:** Папка `runtime/` не создалась.

**Решение:**
1. Запусти `ensure_runtime()` вручную
2. Проверь что `app_paths.py` корректно определяет `APP_ROOT`

### ❌ "Playwright browser not found"

**Причина:** Chromium не установлен в `runtime/browsers`.

**Решение:**
```bash
set PLAYWRIGHT_BROWSERS_PATH=C:\AI\yandex\KeySet-MVP\runtime\browsers
.venv\Scripts\python.exe -m playwright install chromium
```

---

## Следующие шаги

После того как dev-режим заработает:

1. ✅ Убедиться что все работает: парсер, БД, аккаунты, API, UI
2. 📦 Создать `build/KeySet.spec` для PyInstaller
3. 📦 Собрать .exe: `pyinstaller -y build/KeySet.spec`
4. 📦 Протестировать .exe на чистой Windows VM

---

**Статус:** Этап 1 (DEV) в процессе
**Дата:** 2025-11-12
