# 12. Production Windows Build KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃР±РѕСЂРєРё production РІРµСЂСЃРёРё РґР»СЏ Windows: PyInstaller, standalone, launcher**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РђСЂС…РёС‚РµРєС‚СѓСЂР° production СЃР±РѕСЂРєРё](#Р°СЂС…РёС‚РµРєС‚СѓСЂР°-production-СЃР±РѕСЂРєРё)
- [Р”РёР°РіСЂР°РјРјР° РєРѕРјРїРѕРЅРµРЅС‚РѕРІ](#РґРёР°РіСЂР°РјРјР°-РєРѕРјРїРѕРЅРµРЅС‚РѕРІ)
- [РџСЂРѕС†РµСЃСЃ СЃР±РѕСЂРєРё](#РїСЂРѕС†РµСЃСЃ-СЃР±РѕСЂРєРё)
- [РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°](#СЃРЅРёРїРїРµС‚С‹-РєРѕРґР°)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїСЂРѕС†РµСЃСЃР° СЃР±РѕСЂРєРё standalone Windows РїСЂРёР»РѕР¶РµРЅРёСЏ KeySet-MVP: PyInstaller РґР»СЏ Python backend, Vite build РґР»СЏ frontend, launcher СЃРєСЂРёРїС‚, РёРЅСЃС‚Р°Р»Р»СЏС‚РѕСЂ.

## Р”Р»СЏ РєРѕРіРѕ

- DevOps РёРЅР¶РµРЅРµСЂС‹ РґР»СЏ CI/CD
- Release managers
- Developers РґР»СЏ Р»РѕРєР°Р»СЊРЅРѕР№ СЃР±РѕСЂРєРё
- Support РґР»СЏ troubleshooting СѓСЃС‚Р°РЅРѕРІРєРё

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md) вЂ” frontend СЃР±РѕСЂРєР°
- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) вЂ” Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ release
- [14_LOGGING_OBSERVABILITY.md](./14_LOGGING_OBSERVABILITY.md) вЂ” Р»РѕРіРё РІ production

---

## РђСЂС…РёС‚РµРєС‚СѓСЂР° production СЃР±РѕСЂРєРё

```mermaid
graph TD
    A[Source Code] --> B[Build Process]
    
    B --> C1[Frontend Build]
    B --> C2[Backend Build]
    
    C1 -->|Vite| D1[Static Assets]
    C2 -->|PyInstaller| D2[Executable EXE]
    
    D1 --> E[dist/ folder]
    D2 --> E
    
    E --> F[Launcher.exe]
    F --> G[Windows Installer]
    
    G --> H[C:/AI/yandex/]
    H --> I[Shortcut on Desktop]
```

---

## Р”РёР°РіСЂР°РјРјР° РєРѕРјРїРѕРЅРµРЅС‚РѕРІ

```mermaid
graph LR
    subgraph Production Bundle
        A[launcher.exe] --> B[backend.exe]
        A --> C[frontend/]
        
        B --> D[keyset/]
        B --> E[dependencies/]
        
        C --> F[index.html]
        C --> G[assets/]
        
        H[keyset.db] --> B
        I[regions.json] --> B
        J[proxies.json] --> B
    end
```

---

## РРЅСЃС‚СЂСѓРјРµРЅС‚С‹ Рё РІРµСЂСЃРёРё

- **Python** 3.11.8 (x64)
- **Node.js** в‰Ґ 18.18
- **pnpm** 9.x (РёР»Рё npm в‰Ґ 9)
- **PyInstaller** 6.10
- **Inno Setup** 6.3.3
- **Playwright** 1.47 (chromium СѓСЃС‚Р°РЅРѕРІР»РµРЅ С‡РµСЂРµР· `npx playwright install chromium --with-deps`)

---

## РџСЂРѕС†РµСЃСЃ СЃР±РѕСЂРєРё

### 1. Frontend build (Vite)

```bash
cd frontend
pnpm install
pnpm run build
# РЎРѕР·РґР°С‘С‚ frontend/dist/ СЃ manifest.json Рё assets
```

### 2. Backend + launcher (PyInstaller)

```bash
cd ..
pyinstaller build/keyset.spec
# РђСЂС‚РµС„Р°РєС‚С‹: dist/KeySetLauncher.exe, dist/keyset-backend.exe, РґРёСЃС‚СЂРёР±СѓС‚РёРІ frontend
```

### 3. Installer (Inno Setup)

```bash
iscc build/keyset_installer.iss
# Р’С‹С…РѕРґ: build/output/KeySetSetup.exe
```

### 4. Smoke-test РЅР° С‡РёСЃС‚РѕР№ Windows VM

1. **РЎСЂРµРґР°**: Windows 11 Pro, Р±РµР· СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕРіРѕ Python/Node.
2. РЎРєРѕРїРёСЂРѕРІР°С‚СЊ РїР°РїРєСѓ `dist/` Рё Р·Р°РїСѓСЃС‚РёС‚СЊ `KeySet.exe` вЂ” СѓР±РµРґРёС‚СЊСЃСЏ, С‡С‚Рѕ backend СЃС‚Р°СЂС‚СѓРµС‚ Рё Edge РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РІ app-СЂРµР¶РёРјРµ.
3. РџСЂРѕРІРµСЂРёС‚СЊ, С‡С‚Рѕ РѕРєРЅРѕ Edge РѕС‚РєСЂС‹РІР°РµС‚ UI Р±РµР· Р°РґСЂРµСЃРЅРѕР№ СЃС‚СЂРѕРєРё (РІРєР»Р°РґРєР° Accounts Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏ, РјРµРЅСЋ СЂР°Р±РѕС‚Р°РµС‚).
4. Р—Р°РїСѓСЃС‚РёС‚СЊ `KeySetSetup.exe`, СѓСЃС‚Р°РЅРѕРІРёС‚СЊ РІ `C:\AI\KeySet`.
5. РР· РјРµРЅСЋ В«РџСѓСЃРєВ» РѕС‚РєСЂС‹С‚СЊ KeySet вЂ” РїСЂРёР»РѕР¶РµРЅРёРµ РґРѕР»Р¶РЅРѕ СЃС‚Р°СЂС‚РѕРІР°С‚СЊ, СЏСЂР»С‹РєРё Рё uninstall РїСЂРёСЃСѓС‚СЃС‚РІСѓСЋС‚.
6. Р’С‹РїРѕР»РЅРёС‚СЊ smoke-СЃС†РµРЅР°СЂРёР№: РёРјРїРѕСЂС‚РёСЂРѕРІР°С‚СЊ CSV (100 СЃС‚СЂРѕРє), РѕС‚РїСЂР°РІРёС‚СЊ РїР°СЂСЃРёРЅРі (mock-РґР°РЅРЅС‹Рµ), РїСЂРѕРІРµСЂРёС‚СЊ Р»РѕРі `logs/app.log`.

### 5. РС‚РѕРіРѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР° dist/

```
dist/
в”њв”Ђв”Ђ KeySet.exe          # Р•РґРёРЅС‹Р№ РёСЃРїРѕР»РЅСЏРµРјС‹Р№ С„Р°Р№Р» (РІСЃРµ РІРєР»СЋС‡РµРЅРѕ)
в””в”Ђв”Ђ keyset.db          # Р‘Р°Р·Р° РґР°РЅРЅС‹С… (СЃРѕР·РґР°РµС‚СЃСЏ РїСЂРё РїРµСЂРІРѕРј Р·Р°РїСѓСЃРєРµ)
```

---

## РЎРЅРёРїРїРµС‚С‹ РєРѕРґР°

### PyInstaller spec С„Р°Р№Р» (РїСЂРёРјРµСЂ)

```python
# С„Р°Р№Р»: build/keyset.spec (СЃРѕР·РґР°Р№С‚Рµ СЌС‚РѕС‚ С„Р°Р№Р»)
# -*- mode: python -*-
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
frontend_dist = project_root / "frontend" / "dist"

def collect_frontend():
    if frontend_dist.exists():
        return [(str(frontend_dist), "frontend")]
    raise RuntimeError("frontend/dist РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚. Р—Р°РїСѓСЃС‚РёС‚Рµ pnpm run build")

a = Analysis(
    ['launcher.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        (str(project_root / 'backend'), 'backend'),
        *collect_package('core'),
        *collect_package('services'),
        *collect_package('utils'),
        *collect_frontend(),
    ],
    hiddenimports=['playwright._impl._backend', 'uvicorn', 'fastapi'],
    hookspath=[],
    win_private_assemblies=False,
    cipher=None,
)
pyz = PYZ(a.pure, cipher=None)
exe = EXE(
    pyz, a.scripts, a.binaries, a.zipfiles, a.datas,
    name='KeySetLauncher',
    debug=False,
    console=False,
    icon='assets/icon.ico' if (project_root / 'assets' / 'icon.ico').exists() else None,
)
```

### Inno Setup installer (РїСЂРёРјРµСЂ)

```ini
; С„Р°Р№Р»: build/keyset_installer.iss
[Setup]
AppName=KeySet
AppVersion=1.0.0
DefaultDirName={pf}\KeySet
DefaultGroupName=KeySet
OutputDir=build\output
OutputBaseFilename=KeySetSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64

[Files]
Source: "dist\KeySetLauncher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\keyset-backend.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\frontend\*"; DestDir: "{app}\frontend"; Flags: recursesubdirs createallsubdirs
Source: "dist\regions.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\KeySet"; Filename: "{app}\KeySetLauncher.exe"
Name: "{group}\РЈРґР°Р»РёС‚СЊ KeySet"; Filename: "{uninstallexe}"
```

### Launcher СЃРєСЂРёРїС‚

```python
# С„Р°Р№Р»: launcher.py:129-138
def run_backend() -> None:
    """Start FastAPI backend inside the current process."""
    config = Config(
        "backend.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=False,
        log_level="info",
    )
    Server(config).run()
```

### START.bat СЃРєСЂРёРїС‚

```bat
:: С„Р°Р№Р»: START.bat
@echo off
cd /d %~dp0
start KeySetLauncher.exe
timeout /t 2 >nul
start msedge.exe http://127.0.0.1:8765
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "PyInstaller missing module"

**РџСЂРёС‡РёРЅР°:** РќРµРїРѕР»РЅС‹Р№ СЃРїРёСЃРѕРє hidden imports.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р”РѕР±Р°РІСЊС‚Рµ РІ spec С„Р°Р№Р» `hiddenimports=['playwright._impl._backend', 'uvicorn', 'fastapi']`.
2. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ СѓСЃС‚Р°РЅРѕРІР»РµРЅ `pywin32` (РёРЅР°С‡Рµ launcher РЅРµ РїРѕР»СѓС‡РёС‚ Win32 API).
3. РџРѕРІС‚РѕСЂРЅРѕ СЃРѕР±РµСЂРёС‚Рµ: `pyinstaller build/keyset.spec --clean`.

### вќЊ РћС€РёР±РєР°: "Frontend static files not found"

**РџСЂРёС‡РёРЅР°:** Р’ dist РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РїР°РїРєР° frontend РёР»Рё РЅРµРІРµСЂРЅС‹Р№ РїСѓС‚СЊ РІ spec/installer.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РџРµСЂРµРґ СЃР±РѕСЂРєРѕР№ PyInstaller Р·Р°РїСѓСЃС‚РёС‚Рµ `pnpm run build` Рё РїСЂРѕРІРµСЂСЊС‚Рµ `frontend/dist/index.html`.
2. Р’ `keyset.spec` РёСЃРїРѕР»СЊР·СѓР№С‚Рµ С„СѓРЅРєС†РёСЋ `collect_frontend()` Рё СѓР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ Inno РєРѕРїРёСЂСѓРµС‚ `dist\frontend\*`.
3. Р”Р»СЏ РѕС‚Р»Р°РґРєРё Р·Р°РїСѓСЃС‚РёС‚Рµ `KeySetLauncher.exe --devtools` Рё СѓР±РµРґРёС‚РµСЃСЊ РІ РєРѕСЂСЂРµРєС‚РЅРѕСЃС‚Рё РїСѓС‚РµР№.

### вќЊ РћС€РёР±РєР°: "Database locked"

**РџСЂРёС‡РёРЅР°:** РќРµСЃРєРѕР»СЊРєРѕ СЌРєР·РµРјРїР»СЏСЂРѕРІ backend РёСЃРїРѕР»СЊР·СѓСЋС‚ РѕРґРёРЅ SQLite С„Р°Р№Р».

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р’ `keyset/core/db.py` РІРєР»СЋС‡РёС‚Рµ WAL СЂРµР¶РёРј (`PRAGMA journal_mode=WAL;` РїСЂРё РёРЅРёС†РёР°Р»РёР·Р°С†РёРё).
2. РћС‚РєСЂС‹РІР°Р№С‚Рµ РїСЂРёР»РѕР¶РµРЅРёРµ РІ РѕРґРЅРѕРј СЌРєР·РµРјРїР»СЏСЂРµ РёР»Рё РґРµР»РµРіРёСЂСѓР№С‚Рµ РїРѕРІС‚РѕСЂРЅС‹Р№ Р·Р°РїСѓСЃРє С‡РµСЂРµР· Windows Task Scheduler.
3. РџРµСЂРµРґ СѓРїР°РєРѕРІРєРѕР№ РѕС‡РёСЃС‚РёС‚Рµ `logs/` Рё СѓР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РїСЂРёР»РѕР¶РµРЅРёРµ РєРѕСЂСЂРµРєС‚РЅРѕ Р·Р°РІРµСЂС€Р°РµС‚ СЃРѕРµРґРёРЅРµРЅРёСЏ (СЃРј. `SessionLocal`).

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РЎР±РѕСЂРєР° Р»РѕРєР°Р»СЊРЅРѕ

```bash
# 1. Frontend
cd frontend
npm run build

# 2. Backend
pip install pyinstaller
pyinstaller keyset.spec

# 3. Package
python scripts/package.py
```

### 2. РўРµСЃС‚РёСЂРѕРІР°РЅРёРµ СЃР±РѕСЂРєРё

```bash
cd dist
./launcher.exe
```

### 3. РЎРѕР·РґР°РЅРёРµ РёРЅСЃС‚Р°Р»Р»СЏС‚РѕСЂР°

```bash
# РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Inno Setup РёР»Рё NSIS
iscc setup.iss
```

---

## TL;DR

- **Vite build** вЂ” РјРёРЅРёС„РёС†РёСЂРѕРІР°РЅРЅС‹Р№ frontend
- **PyInstaller** вЂ” standalone Python EXE
- **Launcher** вЂ” Р·Р°РїСѓСЃРєР°РµС‚ backend + РѕС‚РєСЂС‹РІР°РµС‚ frontend
- **START.bat** вЂ” Р°Р»СЊС‚РµСЂРЅР°С‚РёРІРЅС‹Р№ СЃРїРѕСЃРѕР± Р·Р°РїСѓСЃРєР°
- **Installer** вЂ” Inno Setup РґР»СЏ Windows

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] Frontend СЃРѕР±РёСЂР°РµС‚СЃСЏ Р±РµР· РѕС€РёР±РѕРє (npm run build)
- [ ] Backend СЃРѕР±РёСЂР°РµС‚СЃСЏ РІ EXE (PyInstaller)
- [ ] Р’СЃРµ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РІРєР»СЋС‡РµРЅС‹ РІ СЃР±РѕСЂРєСѓ
- [ ] Database С„Р°Р№Р» РєРѕРїРёСЂСѓРµС‚СЃСЏ РІ dist/
- [ ] regions.json Рё РґСЂСѓРіРёРµ JSON РІРєР»СЋС‡РµРЅС‹
- [ ] Launcher РєРѕСЂСЂРµРєС‚РЅРѕ Р·Р°РїСѓСЃРєР°РµС‚ backend
- [ ] Frontend РґРѕСЃС‚СѓРїРµРЅ РЅР° localhost:8000
- [ ] Icon РґРѕР±Р°РІР»РµРЅ РІ EXE
- [ ] Version info СѓРєР°Р·Р°РЅ РІ executable
- [ ] Installer СЃРѕР·РґР°С‘С‚ shortcuts
- [ ] Uninstaller СЂР°Р±РѕС‚Р°РµС‚ РєРѕСЂСЂРµРєС‚РЅРѕ

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) вЂ” Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ
