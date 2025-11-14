# 17. РљРѕРЅСЃРѕР»РёРґР°С†РёСЏ РјРѕРґСѓР»СЊРЅРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹ KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїРµСЂРµРЅРѕСЃР° РјРѕРґСѓР»РµР№ РёР· keyset/ РІ РїР»РѕСЃРєСѓСЋ СЃС‚СЂСѓРєС‚СѓСЂСѓ: core/, services/, utils/**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РџСЂРѕР±Р»РµРјР° Рё СЂРµС€РµРЅРёРµ](#РїСЂРѕР±Р»РµРјР°-Рё-СЂРµС€РµРЅРёРµ)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° РґРѕ Рё РїРѕСЃР»Рµ](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-РґРѕ-Рё-РїРѕСЃР»Рµ)
- [РР·РјРµРЅРµРЅРёСЏ РёРјРїРѕСЂС‚РѕРІ](#РёР·РјРµРЅРµРЅРёСЏ-РёРјРїРѕСЂС‚РѕРІ)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїСЂРѕС†РµСЃСЃР° РєРѕРЅСЃРѕР»РёРґР°С†РёРё РјРѕРґСѓР»РµР№ РёР· РІР»РѕР¶РµРЅРЅРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹ `keyset/` РІ РїР»РѕСЃРєСѓСЋ СЃС‚СЂСѓРєС‚СѓСЂСѓ `core/`, `services/`, `utils/` РЅР° СѓСЂРѕРІРЅРµ РєРѕСЂРЅСЏ РїСЂРѕРµРєС‚Р° РґР»СЏ СѓРїСЂРѕС‰РµРЅРёСЏ СЃР±РѕСЂРєРё Рё СѓСЃС‚СЂР°РЅРµРЅРёСЏ РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ РєРѕРґР°.

## Р”Р»СЏ РєРѕРіРѕ

- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё РґР»СЏ РїРѕРЅРёРјР°РЅРёСЏ РЅРѕРІРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹ РёРјРїРѕСЂС‚РѕРІ
- DevOps РёРЅР¶РµРЅРµСЂС‹ РґР»СЏ РЅР°СЃС‚СЂРѕР№РєРё PyInstaller СЃР±РѕСЂРєРё
- Tech Lead РґР»СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹С… СЂРµС€РµРЅРёР№
- QA РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ РїРѕСЃР»Рµ СЂРµС„Р°РєС‚РѕСЂРёРЅРіР°

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md) вЂ” production СЃР±РѕСЂРєР°
- [01_DATABASE.md](./01_DATABASE.md) вЂ” СЃС‚СЂСѓРєС‚СѓСЂР° Р‘Р”
- [10_API_INTEGRATION.md](./10_API_INTEGRATION.md) вЂ” API endpoints

---

## РџСЂРѕР±Р»РµРјР° Рё СЂРµС€РµРЅРёРµ

### РџСЂРѕР±Р»РµРјР°

**РСЃС…РѕРґРЅР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР°:**
```
KeySet-MVP/
в”њв”Ђв”Ђ keyset/                # РЎС‚Р°СЂС‹Р№ Python РїР°РєРµС‚ (legacy)
в”‚   в”њв”Ђв”Ђ core/             # Р‘Р°Р·Р°: db, models, config
в”‚   в”њв”Ђв”Ђ services/         # Р‘РёР·РЅРµСЃ-Р»РѕРіРёРєР°
в”‚   в”њв”Ђв”Ђ utils/            # РЈС‚РёР»РёС‚С‹
в”‚   в””в”Ђв”Ђ data/             # keyset.db, regions.json
в””в”Ђв”Ђ backend/              # FastAPI СЂРѕСѓС‚РµСЂС‹
    в””в”Ђв”Ђ routers/
```

**РџСЂРѕР±Р»РµРјС‹:**
1. **Р”РІРѕР№СЃС‚РІРµРЅРЅРѕСЃС‚СЊ СЃС‚СЂСѓРєС‚СѓСЂС‹** вЂ” РјРѕРґСѓР»Рё РІ `keyset/`, СЂРѕСѓС‚РµСЂС‹ РІ `backend/`
2. **РџСЂРѕР±Р»РµРјС‹ PyInstaller** вЂ” Р°РЅР°Р»РёР· 91690 С„Р°Р№Р»РѕРІ РёР· `keyset/` (РІРєР»СЋС‡Р°СЏ node_modules)
3. **РћС‚РЅРѕСЃРёС‚РµР»СЊРЅС‹Рµ РёРјРїРѕСЂС‚С‹** вЂ” `from ..core.db import` РІРјРµСЃС‚Рѕ `from core.db import`
4. **РЎР»РѕР¶РЅРѕСЃС‚СЊ РїРѕРґРґРµСЂР¶РєРё** вЂ” РґРІР° РёСЃС‚РѕС‡РЅРёРєР° РёСЃС‚РёРЅС‹ РґР»СЏ Р±РёР·РЅРµСЃ-Р»РѕРіРёРєРё

### Р РµС€РµРЅРёРµ

**РќРѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР°:**
```
KeySet-MVP/
в”њв”Ђв”Ђ core/                 # Р‘Р°Р·Р°: db, models, config (РїРµСЂРµРЅРµСЃРµРЅРѕ РёР· keyset/core/)
в”‚   в”њв”Ђв”Ђ db.py
в”‚   в”њв”Ђв”Ђ models.py
в”‚   в”њв”Ђв”Ђ app_paths.py
в”‚   в””в”Ђв”Ђ ...
в”њв”Ђв”Ђ services/             # Р‘РёР·РЅРµСЃ-Р»РѕРіРёРєР° (РїРµСЂРµРЅРµСЃРµРЅРѕ РёР· keyset/services/)
в”‚   в”њв”Ђв”Ђ accounts.py
в”‚   в”њв”Ђв”Ђ frequency.py
в”‚   в”њв”Ђв”Ђ proxy_manager.py
в”‚   в””в”Ђв”Ђ ...
в”њв”Ђв”Ђ utils/                # РЈС‚РёР»РёС‚С‹ (РїРµСЂРµРЅРµСЃРµРЅРѕ РёР· keyset/utils/)
в”‚   в”њв”Ђв”Ђ proxy.py
в”‚   в””в”Ђв”Ђ text_fix.py
в”њв”Ђв”Ђ backend/              # FastAPI СЂРѕСѓС‚РµСЂС‹ (Р±РµР· РёР·РјРµРЅРµРЅРёР№)
в”‚   в””в”Ђв”Ђ routers/
в””в”Ђв”Ђ keyset/               # Legacy (РІСЂРµРјРµРЅРЅРѕ РґР»СЏ РѕР±СЂР°С‚РЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё)
```

**РџСЂРµРёРјСѓС‰РµСЃС‚РІР°:**
- вњ… РђР±СЃРѕР»СЋС‚РЅС‹Рµ РёРјРїРѕСЂС‚С‹ (`from core.db import`)
- вњ… PyInstaller Р°РЅР°Р»РёР·РёСЂСѓРµС‚ С‚РѕР»СЊРєРѕ 413 РЅСѓР¶РЅС‹С… С„Р°Р№Р»РѕРІ РІРјРµСЃС‚Рѕ 91690
- вњ… Р•РґРёРЅР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° РјРѕРґСѓР»РµР№ РЅР° СѓСЂРѕРІРЅРµ РєРѕСЂРЅСЏ РїСЂРѕРµРєС‚Р°
- вњ… РЈРїСЂРѕС‰С‘РЅРЅР°СЏ СЃР±РѕСЂРєР° (60 СЃРµРє РІРјРµСЃС‚Рѕ Р·Р°РІРёСЃР°РЅРёСЏ)

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° РґРѕ Рё РїРѕСЃР»Рµ

### Р”Рѕ РєРѕРЅСЃРѕР»РёРґР°С†РёРё

```mermaid
graph TD
    A[backend/main.py] -->|from keyset.core.db| B[keyset/core/db.py]
    A -->|from keyset.core.app_paths| C[keyset/core/app_paths.py]

    D[backend/routers/accounts.py] -->|from keyset.services| E[keyset/services/accounts.py]
    E -->|from ..core.db| B
    E -->|from ..utils.proxy| F[keyset/utils/proxy.py]

    G[PyInstaller] -->|Р°РЅР°Р»РёР·РёСЂСѓРµС‚| H[keyset/ 91690 С„Р°Р№Р»РѕРІ]
```

### РџРѕСЃР»Рµ РєРѕРЅСЃРѕР»РёРґР°С†РёРё

```mermaid
graph TD
    A[backend/main.py] -->|from core.db| B[core/db.py]
    A -->|from core.app_paths| C[core/app_paths.py]

    D[backend/routers/accounts.py] -->|from services| E[services/accounts.py]
    E -->|from core.db| B
    E -->|from utils.proxy| F[utils/proxy.py]

    G[PyInstaller] -->|Р°РЅР°Р»РёР·РёСЂСѓРµС‚| H[core/, services/, utils/ - 413 С„Р°Р№Р»РѕРІ]
```

---

## РР·РјРµРЅРµРЅРёСЏ РёРјРїРѕСЂС‚РѕРІ

### backend/main.py

**Р‘С‹Р»Рѕ:**
```python
from keyset.core.db import ensure_schema
from keyset.core.app_paths import WWW_DIR, ensure_runtime, bootstrap_files, APP_ROOT
```

**РЎС‚Р°Р»Рѕ:**
```python
from core.db import ensure_schema
from core.app_paths import WWW_DIR, ensure_runtime, bootstrap_files, APP_ROOT
```

### backend/routers/accounts.py

**Р‘С‹Р»Рѕ:**
```python
from keyset.services import accounts as legacy_accounts
```

**РЎС‚Р°Р»Рѕ:**
```python
from services import accounts as legacy_accounts
```

### services/accounts.py

**Р‘С‹Р»Рѕ:**
```python
from ..core.db import SessionLocal
from ..core.models import Account
from ..utils.proxy import proxy_to_playwright
from ..utils.text_fix import fix_mojibake
```

**РЎС‚Р°Р»Рѕ:**
```python
from core.db import SessionLocal
from core.models import Account
from utils.proxy import proxy_to_playwright
from utils.text_fix import fix_mojibake
from services.proxy_manager import ProxyManager
from services.chrome_launcher import ChromeLauncher
```

### services/frequency.py

**Р‘С‹Р»Рѕ:**
```python
from ..core.db import SessionLocal, get_db_connection
from ..core.models import FrequencyResult
```

**РЎС‚Р°Р»Рѕ:**
```python
from core.db import SessionLocal, get_db_connection
from core.models import FrequencyResult
```

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### РћР±РЅРѕРІР»С‘РЅРЅС‹Р№ PyInstaller spec

**Р¤Р°Р№Р»:** `build/keyset.spec`

```python
# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

block_cipher = None

_spec_file = globals().get("__file__")
if _spec_file:
    PROJECT_ROOT = Path(_spec_file).resolve().parent.parent
else:
    PROJECT_ROOT = Path.cwd()

def collect_package(package_name):
    """Collect package files excluding __pycache__"""
    from pathlib import Path
    package_path = PROJECT_ROOT / package_name
    result = []
    if not package_path.exists():
        return result
    for item in package_path.rglob('*'):
        if item.is_file():
            # Skip __pycache__ and .pyc files
            if '__pycache__' in item.parts or item.suffix == '.pyc':
                continue
            rel_path = item.relative_to(PROJECT_ROOT)
            dest_dir = str(rel_path.parent)
            result.append((str(item), dest_dir))
    return result

analysis = Analysis(
    [str(PROJECT_ROOT / 'launcher.py')],
    pathex=[str(PROJECT_ROOT)],
    binaries=[],
    datas=[
        (str(PROJECT_ROOT / 'frontend' / 'dist'), 'frontend/dist'),
        (str(PROJECT_ROOT / 'backend'), 'backend'),
        *collect_package('core'),        # в†ђ РќРћР’РћР•
        *collect_package('services'),    # в†ђ РќРћР’РћР•
        *collect_package('utils'),       # в†ђ РќРћР’РћР•
        # keyset/ РёСЃРєР»СЋС‡РµРЅР° - РёСЃРїРѕР»СЊР·СѓРµРј РЅРѕРІСѓСЋ СЃС‚СЂСѓРєС‚СѓСЂСѓ
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'sqlalchemy',
        'playwright',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludedimports=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(analysis.pure, analysis.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    analysis.scripts,
    analysis.binaries,
    analysis.zipfiles,
    analysis.datas,
    [],
    name='KeySet',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
```

### РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РѕРїСЂРµРґРµР»РµРЅРёРµ РїСѓС‚Рё Рє Р‘Р”

**Р¤Р°Р№Р»:** `core/db.py`

```python
import sys
from pathlib import Path

def _db_path() -> Path:
    """РћРїСЂРµРґРµР»РёС‚СЊ РїСѓС‚СЊ Рє Р‘Р” СЃ РїСЂРёРѕСЂРёС‚РµС‚РѕРј РЅР° dist/keyset.db"""
    # 1) Р•СЃР»Рё Р·Р°РїСѓС‰РµРЅРѕ РёР· exe, Р±РµСЂРµРј Р‘Р” СЂСЏРґРѕРј СЃ exe
    if getattr(sys, "frozen", False):
        p = Path(sys.executable).resolve().parent / "keyset.db"
        if p.exists():
            return p

    # 2) Р’ dev-СЂРµР¶РёРјРµ: РїСЂРёРѕСЂРёС‚РµС‚ dist/keyset.db (270 KB СЃ РґР°РЅРЅС‹РјРё)
    dist_db = Path(__file__).resolve().parent.parent / "dist" / "keyset.db"
    if dist_db.exists():
        return dist_db

    # 3) Fallback: KeySet-MVP/keyset.db
    proj_db = Path(__file__).resolve().parent.parent / "keyset.db"
    return proj_db

DB_PATH = _db_path()
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"
```

**Р›РѕРіРёРєР°:**
1. Р’ production (EXE): `dist/KeySet.exe` СЂСЏРґРѕРј СЃ `keyset.db`
2. Р’ dev: РїСЂРёРѕСЂРёС‚РµС‚ `KeySet-MVP/dist/keyset.db` (Р·Р°РїРѕР»РЅРµРЅРЅР°СЏ Р‘Р” 270 KB)
3. Fallback: `KeySet-MVP/keyset.db` (РїСѓСЃС‚Р°СЏ Р‘Р”)

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "no such table: accounts"

**РџСЂРёС‡РёРЅР°:** РџСЂРёР»РѕР¶РµРЅРёРµ РёСЃРїРѕР»СЊР·СѓРµС‚ РїСѓСЃС‚СѓСЋ Р‘Р” РІРјРµСЃС‚Рѕ Р·Р°РїРѕР»РЅРµРЅРЅРѕР№.

**Р РµС€РµРЅРёРµ:**
```bash
# РЎРєРѕРїРёСЂРѕРІР°С‚СЊ Р·Р°РїРѕР»РЅРµРЅРЅСѓСЋ Р‘Р” РІ РЅСѓР¶РЅРѕРµ РјРµСЃС‚Рѕ
Copy-Item 'C:\AI\yandex\KeySet-MVP\keyset\data\keyset.db' 'C:\AI\yandex\KeySet-MVP\keyset.db' -Force

# РР»Рё РІ dist/ РґР»СЏ production:
Copy-Item 'C:\AI\yandex\KeySet-MVP\keyset\data\keyset.db' 'C:\AI\yandex\KeySet-MVP\dist\keyset.db' -Force
```

### вќЊ РћС€РёР±РєР°: PyInstaller Р·Р°РІРёСЃР°РµС‚ РЅР° "Performing binary vs. data reclassification"

**РџСЂРёС‡РёРЅР°:** PyInstaller Р°РЅР°Р»РёР·РёСЂСѓРµС‚ СЃС‚Р°СЂСѓСЋ РїР°РїРєСѓ `keyset/` СЃ 91690 С„Р°Р№Р»Р°РјРё (РІРєР»СЋС‡Р°СЏ node_modules).

**Р РµС€РµРЅРёРµ:**
1. РЈРґР°Р»РёС‚СЊ `*collect_package('keyset')` РёР· `keyset.spec`
2. Р”РѕР±Р°РІРёС‚СЊ С‚РѕР»СЊРєРѕ РЅСѓР¶РЅС‹Рµ РїР°РєРµС‚С‹:
```python
datas=[
    *collect_package('core'),
    *collect_package('services'),
    *collect_package('utils'),
]
```
3. РџРµСЂРµСЃРѕР±СЂР°С‚СЊ: `pyinstaller build/keyset.spec --clean`

### вќЊ РћС€РёР±РєР°: "ModuleNotFoundError: No module named 'keyset'"

**РџСЂРёС‡РёРЅР°:** РЎС‚Р°СЂС‹Рµ РёРјРїРѕСЂС‚С‹ `from keyset.core` РЅРµ РѕР±РЅРѕРІР»РµРЅС‹ РЅР° `from core`.

**Р РµС€РµРЅРёРµ:**
РќР°Р№С‚Рё Рё Р·Р°РјРµРЅРёС‚СЊ РІСЃРµ РёРјРїРѕСЂС‚С‹:
```bash
# РќР°Р№С‚Рё РІСЃРµ С„Р°Р№Р»С‹ СЃ РёРјРїРѕСЂС‚Р°РјРё keyset
grep -r "from keyset\." --include="*.py"

# Р—Р°РјРµРЅРёС‚СЊ РІ РєР°Р¶РґРѕРј С„Р°Р№Р»Рµ:
from keyset.core.db в†’ from core.db
from keyset.services в†’ from services
from keyset.utils в†’ from utils
```

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РџСЂРѕРІРµСЂРєР° РЅРѕРІРѕР№ СЃС‚СЂСѓРєС‚СѓСЂС‹

```bash
# РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РјРѕРґСѓР»Рё РµСЃС‚СЊ РЅР° СѓСЂРѕРІРЅРµ РєРѕСЂРЅСЏ:
ls KeySet-MVP/core/
ls KeySet-MVP/services/
ls KeySet-MVP/utils/

# РџСЂРѕРІРµСЂРєР° РёРјРїРѕСЂС‚РѕРІ:
grep -r "from core\." backend/ --include="*.py"
grep -r "from services\." backend/ --include="*.py"
```

### 2. РљРѕРїРёСЂРѕРІР°РЅРёРµ Р·Р°РїРѕР»РЅРµРЅРЅРѕР№ Р‘Р”

```bash
# Р”Р»СЏ dev:
cp keyset/data/keyset.db keyset.db

# Р”Р»СЏ production:
cp keyset/data/keyset.db dist/keyset.db
```

### 3. РўРµСЃС‚РёСЂРѕРІР°РЅРёРµ

```bash
# Р—Р°РїСѓСЃРє launcher
.venv/Scripts/python.exe launcher.py

# РџСЂРѕРІРµСЂРєР° API:
curl http://127.0.0.1:<port>/api/accounts
curl http://127.0.0.1:<port>/api/data/phrases?limit=3
```

### 4. РЎР±РѕСЂРєР°

```bash
# РћР±РЅРѕРІР»С‘РЅРЅР°СЏ СЃР±РѕСЂРєР° Р±РµР· keyset/
pyinstaller build/keyset.spec --clean

# Р РµР·СѓР»СЊС‚Р°С‚:
# dist/KeySet.exe (48.11 MB, 413 С„Р°Р№Р»РѕРІ)
```

---

## TL;DR

**Р”Рѕ:**
- РњРѕРґСѓР»Рё РІ `keyset/core/`, `keyset/services/`, `keyset/utils/`
- РћС‚РЅРѕСЃРёС‚РµР»СЊРЅС‹Рµ РёРјРїРѕСЂС‚С‹ `from ..core.db`
- PyInstaller Р°РЅР°Р»РёР·РёСЂСѓРµС‚ 91690 С„Р°Р№Р»РѕРІ Рё Р·Р°РІРёСЃР°РµС‚
- РЎР±РѕСЂРєР° РЅРµ Р·Р°РІРµСЂС€Р°РµС‚СЃСЏ

**РџРѕСЃР»Рµ:**
- РњРѕРґСѓР»Рё РІ `core/`, `services/`, `utils/` РЅР° СѓСЂРѕРІРЅРµ РєРѕСЂРЅСЏ
- РђР±СЃРѕР»СЋС‚РЅС‹Рµ РёРјРїРѕСЂС‚С‹ `from core.db`
- PyInstaller Р°РЅР°Р»РёР·РёСЂСѓРµС‚ 413 С„Р°Р№Р»Р°
- РЎР±РѕСЂРєР° Р·Р°РІРµСЂС€Р°РµС‚СЃСЏ Р·Р° ~60 СЃРµРєСѓРЅРґ, EXE 48.11 MB

**РџСЂРѕРІРµСЂРєР° СЂР°Р±РѕС‚РѕСЃРїРѕСЃРѕР±РЅРѕСЃС‚Рё:**
- вњ… Launcher СЃС‚Р°СЂС‚СѓРµС‚ Р±РµР· РѕС€РёР±РѕРє
- вњ… `/api/accounts` РІРѕР·РІСЂР°С‰Р°РµС‚ 5 Р°РєРєР°СѓРЅС‚РѕРІ РёР· Р‘Р”
- вњ… `/api/data/phrases` РІРѕР·РІСЂР°С‰Р°РµС‚ С„СЂР°Р·С‹ СЃ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚СЊСЋ
- вњ… UI Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏ РІ Edge --app mode

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [x] РњРѕРґСѓР»Рё СЃРєРѕРїРёСЂРѕРІР°РЅС‹ РёР· `keyset/` РІ `core/`, `services/`, `utils/`
- [x] РРјРїРѕСЂС‚С‹ РѕР±РЅРѕРІР»РµРЅС‹ СЃ `from keyset.` РЅР° `from core.`, `from services.`
- [x] PyInstaller spec РѕР±РЅРѕРІР»С‘РЅ: `collect_package('core')`, `collect_package('services')`
- [x] Р—Р°РїРѕР»РЅРµРЅРЅР°СЏ Р‘Р” СЃРєРѕРїРёСЂРѕРІР°РЅР° РІ `KeySet-MVP/keyset.db`
- [x] `core/db.py` РѕР±РЅРѕРІР»С‘РЅ СЃ Р°РІС‚РѕРѕРїСЂРµРґРµР»РµРЅРёРµРј РїСѓС‚Рё Рє Р‘Р”
- [x] Launcher Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ Р±РµР· РѕС€РёР±РѕРє РёРјРїРѕСЂС‚Р°
- [x] API endpoints РІРѕР·РІСЂР°С‰Р°СЋС‚ РґР°РЅРЅС‹Рµ РёР· Р‘Р”
- [x] РЎР±РѕСЂРєР° Р·Р°РІРµСЂС€Р°РµС‚СЃСЏ СѓСЃРїРµС€РЅРѕ (~60 СЃРµРє)
- [x] EXE Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ Рё СЂР°Р±РѕС‚Р°РµС‚ РєРѕСЂСЂРµРєС‚РЅРѕ
- [ ] Legacy РїР°РїРєР° `keyset/` СѓРґР°Р»РµРЅР° (РїРѕСЃР»Рµ С„РёРЅР°Р»СЊРЅРѕР№ РїСЂРѕРІРµСЂРєРё)

---

## РЎС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕРµРєС‚Р° РїРѕСЃР»Рµ РєРѕРЅСЃРѕР»РёРґР°С†РёРё

```
KeySet-MVP/
в”њв”Ђв”Ђ core/                       # Р‘Р°Р·Р°: db, models, config
в”‚   в”њв”Ђв”Ђ __init__.py
в”‚   в”њв”Ђв”Ђ app_paths.py
в”‚   в”њв”Ђв”Ђ db.py                  # РђРІС‚РѕРѕРїСЂРµРґРµР»РµРЅРёРµ РїСѓС‚Рё Рє Р‘Р”
в”‚   в”њв”Ђв”Ђ models.py              # SQLAlchemy РјРѕРґРµР»Рё
в”‚   в”њв”Ђв”Ђ icons.py
в”‚   в”њв”Ђв”Ђ playwright_config.py
в”‚   в”њв”Ђв”Ђ proxy_store.py
в”‚   в”њв”Ђв”Ђ regions.py
в”‚   в”њв”Ђв”Ђ settings.py
в”‚   в””в”Ђв”Ђ xmind_parser.py
в”‚
в”њв”Ђв”Ђ services/                   # Р‘РёР·РЅРµСЃ-Р»РѕРіРёРєР°
в”‚   в”њв”Ђв”Ђ __init__.py
в”‚   в”њв”Ђв”Ђ accounts.py            # РЈРїСЂР°РІР»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°РјРё
в”‚   в”њв”Ђв”Ђ frequency.py           # Р Р°Р±РѕС‚Р° СЃ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚СЊСЋ
в”‚   в”њв”Ђв”Ђ wordstat_bridge.py     # РРЅС‚РµРіСЂР°С†РёСЏ СЃ Wordstat
в”‚   в”њв”Ђв”Ђ proxy_manager.py       # РЈРїСЂР°РІР»РµРЅРёРµ РїСЂРѕРєСЃРё
в”‚   в””в”Ђв”Ђ chrome_launcher.py     # Р—Р°РїСѓСЃРє Р±СЂР°СѓР·РµСЂР°
в”‚
в”њв”Ђв”Ђ utils/                      # РЈС‚РёР»РёС‚С‹
в”‚   в”њв”Ђв”Ђ __init__.py
в”‚   в”њв”Ђв”Ђ proxy.py               # РџР°СЂСЃРёРЅРі РїСЂРѕРєСЃРё СЃС‚СЂРѕРє
в”‚   в””в”Ђв”Ђ text_fix.py            # РСЃРїСЂР°РІР»РµРЅРёРµ РєРѕРґРёСЂРѕРІРѕРє
в”‚
в”њв”Ђв”Ђ backend/                    # FastAPI СЂРѕСѓС‚РµСЂС‹
в”‚   в”њв”Ђв”Ђ main.py                # РРјРїРѕСЂС‚С‹: from core.db, from core.app_paths
в”‚   в””в”Ђв”Ђ routers/
в”‚       в”њв”Ђв”Ђ accounts.py        # РРјРїРѕСЂС‚С‹: from services.accounts
в”‚       в”њв”Ђв”Ђ data.py            # РРјРїРѕСЂС‚С‹: from services.frequency
в”‚       в””в”Ђв”Ђ wordstat.py        # РРјРїРѕСЂС‚С‹: from services.*
в”‚
в”њв”Ђв”Ђ frontend/                   # React UI
в”‚   в””в”Ђв”Ђ dist/                  # РЎРѕР±СЂР°РЅРЅС‹Рµ СЃС‚Р°С‚РёС‡РµСЃРєРёРµ С„Р°Р№Р»С‹
в”‚
в”њв”Ђв”Ђ build/
в”‚   в””в”Ђв”Ђ keyset.spec            # PyInstaller РєРѕРЅС„РёРі (РѕР±РЅРѕРІР»С‘РЅ)
в”‚
в”њв”Ђв”Ђ dist/                       # Production СЃР±РѕСЂРєР°
в”‚   в”њв”Ђв”Ђ KeySet.exe             # 48.11 MB, 413 С„Р°Р№Р»РѕРІ
в”‚   в””в”Ђв”Ђ keyset.db              # 270 KB Р·Р°РїРѕР»РЅРµРЅРЅР°СЏ Р‘Р”
в”‚
в”њв”Ђв”Ђ keyset/                     # Legacy (РІСЂРµРјРµРЅРЅРѕ)
в”‚   в””в”Ђв”Ђ data/
в”‚       в””в”Ђв”Ђ keyset.db          # 270 KB РёСЃС‚РѕС‡РЅРёРє РґР°РЅРЅС‹С…
в”‚
в”њв”Ђв”Ђ launcher.py                 # РўРѕС‡РєР° РІС…РѕРґР°
в””в”Ђв”Ђ keyset.db                   # 270 KB СЂР°Р±РѕС‡Р°СЏ Р‘Р” (dev)
```

---

## РњРёРіСЂР°С†РёСЏ РґР»СЏ Р±СѓРґСѓС‰РёС… РјРѕРґСѓР»РµР№

РџСЂРё РґРѕР±Р°РІР»РµРЅРёРё РЅРѕРІС‹С… РјРѕРґСѓР»РµР№:

1. **РЎРѕР·РґР°РІР°С‚СЊ РІ РїР»РѕСЃРєРѕР№ СЃС‚СЂСѓРєС‚СѓСЂРµ:**
```python
# РџСЂР°РІРёР»СЊРЅРѕ:
KeySet-MVP/services/new_service.py

# РќРµРїСЂР°РІРёР»СЊРЅРѕ:
KeySet-MVP/keyset/services/new_service.py
```

2. **РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р°Р±СЃРѕР»СЋС‚РЅС‹Рµ РёРјРїРѕСЂС‚С‹:**
```python
# РџСЂР°РІРёР»СЊРЅРѕ:
from core.db import SessionLocal
from services.accounts import list_accounts

# РќРµРїСЂР°РІРёР»СЊРЅРѕ:
from ..core.db import SessionLocal
from keyset.services.accounts import list_accounts
```

3. **Р”РѕР±Р°РІРёС‚СЊ РІ PyInstaller spec:**
```python
datas=[
    *collect_package('core'),
    *collect_package('services'),
    *collect_package('new_module'),  # в†ђ РќРѕРІС‹Р№ РјРѕРґСѓР»СЊ
]
```

---

**Р”Р°С‚Р° РєРѕРЅСЃРѕР»РёРґР°С†РёРё:** 2025-11-12

**РЎС‚Р°С‚СѓСЃ:** вњ… Р’С‹РїРѕР»РЅРµРЅРѕ Рё РїСЂРѕС‚РµСЃС‚РёСЂРѕРІР°РЅРѕ

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** РЈРґР°Р»РµРЅРёРµ legacy РїР°РїРєРё `keyset/` РїРѕСЃР»Рµ С„РёРЅР°Р»СЊРЅРѕР№ РїСЂРѕРІРµСЂРєРё production СЃР±РѕСЂРєРё

**РќР°Р·Р°Рґ:** [12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md) вЂ” Production СЃР±РѕСЂРєР°
