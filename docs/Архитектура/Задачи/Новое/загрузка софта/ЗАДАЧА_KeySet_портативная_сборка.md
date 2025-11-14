# Р—Р°РґР°С‡Р°: РџРѕСЂС‚Р°С‚РёРІРЅР°СЏ СЃР±РѕСЂРєР° KeySet-MVP

> **Р Р°Р±РѕС‡Р°СЏ РґРёСЂРµРєС‚РѕСЂРёСЏ:** `C:\AI\yandex\KeySet-MVP`
> **Р¦РµР»СЊ:** РЎРґРµР»Р°С‚СЊ СЂР°Р±РѕС‡СѓСЋ РІРµСЂСЃРёСЋ СЃ РїРѕСЂС‚Р°С‚РёРІРЅРѕР№ СЃС‚СЂСѓРєС‚СѓСЂРѕР№ (runtime/, www/), Р·Р°С‚РµРј .exe

---

## РўРµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ

- вњ… Р•СЃС‚СЊ СЂР°Р±РѕС‡РёРµ РїР°СЂСЃРµСЂС‹ РІ `C:\AI\yandex\KeySet-MVP\keyset`
- вњ… РЎРѕР·РґР°РЅ РјРѕРґСѓР»СЊ `keyset/core/app_paths.py` РґР»СЏ РїРѕСЂС‚Р°С‚РёРІРЅС‹С… РїСѓС‚РµР№
- вњ… РћР±РЅРѕРІР»РµРЅ `keyset/core/db.py` - РёСЃРїРѕР»СЊР·СѓРµС‚ РїРѕСЂС‚Р°С‚РёРІРЅС‹Рµ РїСѓС‚Рё
- вњ… РћР±РЅРѕРІР»РµРЅ `backend/main.py` - СЂР°Р·РґР°РµС‚ SPA РёР· `www/`
- вњ… РћР±РЅРѕРІР»РµРЅ `launcher.py` - Edge --app СЂРµР¶РёРј СЃ РїРѕСЂС‚Р°С‚РёРІРЅС‹РјРё РїСѓС‚СЏРјРё
- вњ… РЎРѕР·РґР°РЅ `keyset/core/playwright_config.py` - РЅР°СЃС‚СЂРѕР№РєР° Playwright

## РџСЂРѕР±Р»РµРјР°

UI РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ, РЅРѕ:
- **Failed to fetch** - С„СЂРѕРЅС‚ РЅРµ РІРёРґРёС‚ API
- РџСѓСЃС‚С‹Рµ РІРєР»Р°РґРєРё РђРєРєР°СѓРЅС‚С‹/Р”Р°РЅРЅС‹Рµ
- API Рё UI РЅР° СЂР°Р·РЅС‹С… РїРѕСЂС‚Р°С…/origin

## Р РµС€РµРЅРёРµ: 2 СЌС‚Р°РїР°

### Р­С‚Р°Рї 1: DEV-СЂРµР¶РёРј (СЃРµР№С‡Р°СЃ РґРµР»Р°РµРј)

Р”РµР»Р°РµРј СЂР°Р±РѕС‡СѓСЋ РІРµСЂСЃРёСЋ РїСЂСЏРјРѕ РІ `C:\AI\yandex\KeySet-MVP` Р±РµР· СЃР±РѕСЂРєРё .exe:

```
C:\AI\yandex\KeySet-MVP\
в”њв”Ђ keyset/              # вњ… СЂР°Р±РѕС‡РёРµ РїР°СЂСЃРµСЂС‹ (РЅРµ С‚СЂРѕРіР°РµРј)
в”њв”Ђ backend/             # вњ… FastAPI
в”њв”Ђ frontend/            # вњ… React
в”‚  в””в”Ђ dist/            # в†’ РєРѕРїРёСЂСѓРµС‚СЃСЏ РІ www/
в”њв”Ђ runtime/             # вљ пёЏ СЃРѕР·РґР°РµРј Р·РґРµСЃСЊ, РЅР° РјРµСЃС‚Рµ
в”‚  в”њв”Ђ db/              # Р‘Р”
в”‚  в”њв”Ђ profiles/        # РїСЂРѕС„РёР»Рё Р°РєРєР°СѓРЅС‚РѕРІ
в”‚  в”њв”Ђ browsers/        # Playwright Chromium
в”‚  в”њв”Ђ geo/             # regions_tree_full.json
в”‚  в”њв”Ђ config/          # proxies.json
в”‚  в”њв”Ђ edge_profile/    # РїСЂРѕС„РёР»СЊ Edge
в”‚  в””в”Ђ logs/
в”њв”Ђ www/                 # вљ пёЏ СЃРѕР·РґР°РµРј: РєРѕРїРёСЏ frontend/dist
в”‚  в”њв”Ђ index.html
в”‚  в””в”Ђ assets/
в”њв”Ђ launcher.py          # вњ… РѕР±РЅРѕРІР»РµРЅ
в””в”Ђ .venv/               # Python РѕРєСЂСѓР¶РµРЅРёРµ
```

**Р’Р°Р¶РЅРѕ:** Р’СЃРµ РґРµР»Р°РµРј **РЅР° РјРµСЃС‚Рµ** РІ `KeySet-MVP`, РЅРёРєР°РєРёС… `out\KeySet` РёР»Рё РґСЂСѓРіРёС… РїСЂРѕРјРµР¶СѓС‚РѕС‡РЅС‹С… РїР°РїРѕРє!

### Р­С‚Р°Рї 2: .exe СЃР±РѕСЂРєР° (РїРѕС‚РѕРј)

РџРѕСЃР»Рµ С‚РѕРіРѕ РєР°Рє dev-СЂРµР¶РёРј Р·Р°СЂР°Р±РѕС‚Р°РµС‚, СЃРѕР±РµСЂРµРј РІ .exe С‡РµСЂРµР· PyInstaller.

---

## РџР»Р°РЅ РґРµР№СЃС‚РІРёР№ (Р­С‚Р°Рї 1: DEV)

### РЁР°Рі 1: РЎРѕР±СЂР°С‚СЊ frontend РІ www/

```bash
cd C:\AI\yandex\KeySet-MVP\frontend
npm run build
cd ..

# РљРѕРїРёСЂСѓРµРј dist РІ www
rmdir /S /Q www 2>nul
xcopy /E /I /Y frontend\dist www
```

### РЁР°Рі 2: РЈСЃС‚Р°РЅРѕРІРёС‚СЊ Playwright Р±СЂР°СѓР·РµСЂ РІ runtime/browsers

```bash
cd C:\AI\yandex\KeySet-MVP
set PLAYWRIGHT_BROWSERS_PATH=runtime\browsers
.venv\Scripts\python.exe -m pip install playwright
.venv\Scripts\python.exe -m playwright install chromium
```

### РЁР°Рі 3: РџСЂРѕРІРµСЂРёС‚СЊ СЃС‚СЂСѓРєС‚СѓСЂСѓ РїСѓС‚РµР№

Р¤Р°Р№Р» `keyset/core/app_paths.py` (вњ… СѓР¶Рµ СЃРѕР·РґР°РЅ):

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
    # dev-СЂРµР¶РёРј: РєРѕСЂРµРЅСЊ СЂРµРїРѕ C:\AI\yandex\KeySet-MVP
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

### РЁР°Рі 4: РџСЂРѕРІРµСЂРёС‚СЊ backend/main.py

Р¤Р°Р№Р» `backend/main.py` (вњ… СѓР¶Рµ РѕР±РЅРѕРІР»РµРЅ):

```python
from keyset.core.app_paths import WWW_DIR, ensure_runtime, bootstrap_files

# РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ runtime РїСЂРё СЃС‚Р°СЂС‚Рµ
ensure_runtime()
bootstrap_files()

# ...routers...

# Р Р°Р·РґР°С‡Р° SPA РёР· www/ (РѕРґРёРЅ origin!)
def _resolve_frontend_paths() -> tuple[Path, Path]:
    if WWW_DIR.exists():
        return WWW_DIR, APP_ROOT
    # Fallback РЅР° dev
    repo_root = BASE_DIR.parent
    return repo_root / "frontend" / "dist", repo_root
```

### РЁР°Рі 5: Р—Р°РїСѓСЃС‚РёС‚СЊ dev-РІРµСЂСЃРёСЋ

```bash
cd C:\AI\yandex\KeySet-MVP
.venv\Scripts\python.exe launcher.py
```

**РџСЂРѕРІРµСЂРєР°:**
1. Edge РѕС‚РєСЂРѕРµС‚СЃСЏ РЅР° `http://127.0.0.1:8765`
2. `http://127.0.0.1:8765/api/health` в†’ 200 OK
3. `http://127.0.0.1:8765/api/accounts` в†’ `[]` РёР»Рё РґР°РЅРЅС‹Рµ
4. Р’РєР»Р°РґРєРё "РђРєРєР°СѓРЅС‚С‹" Рё "Р”Р°РЅРЅС‹Рµ" **Р±РµР·** "Failed to fetch"

---

## РЎС‚СЂСѓРєС‚СѓСЂР° РјРѕРґСѓР»РµР№ (С‡С‚Рѕ СѓР¶Рµ РіРѕС‚РѕРІРѕ)

### вњ… keyset/core/app_paths.py
Р¦РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅС‹Рµ РїСѓС‚Рё РґР»СЏ РїРѕСЂС‚Р°С‚РёРІРЅРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹.

### вњ… keyset/core/db.py
```python
from .app_paths import bootstrap_files, sqlite_url, DB_DIR

bootstrap_files()  # РљРѕРїРёСЂСѓРµС‚ С€Р°Р±Р»РѕРЅ Р‘Р” РІ runtime/db/
DATABASE_URL = sqlite_url()  # sqlite:///runtime/db/keyset.db
```

### вњ… keyset/core/playwright_config.py
```python
import os
from .app_paths import BROWSERS, PROFILES

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(BROWSERS)

def get_profile_dir(account_id: int) -> str:
    profile_path = PROFILES / f"acc_{account_id}"
    profile_path.mkdir(parents=True, exist_ok=True)
    return str(profile_path)
```

### вњ… backend/main.py
Р Р°Р·РґР°РµС‚ SPA РёР· `www/`, РѕРґРёРЅ origin СЃ API.

### вњ… launcher.py
```python
from keyset.core.app_paths import APP_ROOT, RUNTIME

# Edge РїСЂРѕС„РёР»СЊ РІ runtime/
user_data = RUNTIME / "edge_profile"

# Р—Р°РїСѓСЃРє РЅР° С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕРј РїРѕСЂС‚Сѓ 8765
# Health-check РїРµСЂРµРґ РѕС‚РєСЂС‹С‚РёРµРј Р±СЂР°СѓР·РµСЂР°
```

---

## Р§С‚Рѕ РќР• С‚СЂРѕРіР°РµРј

- `C:\AI\yandex\KeySet-MVP\keyset\` - СЂР°Р±РѕС‡РёРµ РїР°СЂСЃРµСЂС‹, РЅРµ РјРµРЅСЏРµРј
- Р‘РёР·РЅРµСЃ-Р»РѕРіРёРєСѓ - С‚РѕР»СЊРєРѕ РїСѓС‚Рё Рё СѓРїР°РєРѕРІРєСѓ
- РЎСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ Р‘Р” - РІСЃРµ РїРѕСЂС‚РёСЂСѓРµС‚СЃСЏ С‡РµСЂРµР· bootstrap

---

## РўРёРїРёС‡РЅС‹Рµ РѕС€РёР±РєРё

### вќЊ "Failed to fetch"

**РџСЂРёС‡РёРЅР°:** UI Рё API РЅР° СЂР°Р·РЅС‹С… РїРѕСЂС‚Р°С…/origin.

**Р РµС€РµРЅРёРµ:**
1. РџСЂРѕРІРµСЂСЊ С‡С‚Рѕ `www/` СЃРѕРґРµСЂР¶РёС‚ СЃРѕР±СЂР°РЅРЅС‹Р№ frontend
2. Backend РґРѕР»Р¶РµРЅ СЂР°Р·РґР°РІР°С‚СЊ `www/` С‡РµСЂРµР· StaticFiles
3. Р›Р°СѓРЅС‡РµСЂ РґРѕР»Р¶РµРЅ РѕС‚РєСЂС‹РІР°С‚СЊ Edge РЅР° С‚РѕРј Р¶Рµ РїРѕСЂС‚Сѓ С‡С‚Рѕ Рё backend (8765)

### вќЊ "Runtime not found"

**РџСЂРёС‡РёРЅР°:** РџР°РїРєР° `runtime/` РЅРµ СЃРѕР·РґР°Р»Р°СЃСЊ.

**Р РµС€РµРЅРёРµ:**
1. Р—Р°РїСѓСЃС‚Рё `ensure_runtime()` РІСЂСѓС‡РЅСѓСЋ
2. РџСЂРѕРІРµСЂСЊ С‡С‚Рѕ `app_paths.py` РєРѕСЂСЂРµРєС‚РЅРѕ РѕРїСЂРµРґРµР»СЏРµС‚ `APP_ROOT`

### вќЊ "Playwright browser not found"

**РџСЂРёС‡РёРЅР°:** Chromium РЅРµ СѓСЃС‚Р°РЅРѕРІР»РµРЅ РІ `runtime/browsers`.

**Р РµС€РµРЅРёРµ:**
```bash
set PLAYWRIGHT_BROWSERS_PATH=C:\AI\yandex\KeySet-MVP\runtime\browsers
.venv\Scripts\python.exe -m playwright install chromium
```

---

## РЎР»РµРґСѓСЋС‰РёРµ С€Р°РіРё

РџРѕСЃР»Рµ С‚РѕРіРѕ РєР°Рє dev-СЂРµР¶РёРј Р·Р°СЂР°Р±РѕС‚Р°РµС‚:

1. вњ… РЈР±РµРґРёС‚СЊСЃСЏ С‡С‚Рѕ РІСЃРµ СЂР°Р±РѕС‚Р°РµС‚: РїР°СЂСЃРµСЂ, Р‘Р”, Р°РєРєР°СѓРЅС‚С‹, API, UI
2. рџ“¦ РЎРѕР·РґР°С‚СЊ `build/KeySet.spec` РґР»СЏ PyInstaller
3. рџ“¦ РЎРѕР±СЂР°С‚СЊ .exe: `pyinstaller -y build/KeySet.spec`
4. рџ“¦ РџСЂРѕС‚РµСЃС‚РёСЂРѕРІР°С‚СЊ .exe РЅР° С‡РёСЃС‚РѕР№ Windows VM

---

**РЎС‚Р°С‚СѓСЃ:** Р­С‚Р°Рї 1 (DEV) РІ РїСЂРѕС†РµСЃСЃРµ
**Р”Р°С‚Р°:** 2025-11-12
