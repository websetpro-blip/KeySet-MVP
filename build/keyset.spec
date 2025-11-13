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
        (str(PROJECT_ROOT / 'core' / 'data'), 'core/data'),
        *collect_package('core'),
        *collect_package('services'),
        *collect_package('utils'),
        # keyset/ исключена - используем новую структуру
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
