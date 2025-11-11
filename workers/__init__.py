from __future__ import annotations

from pathlib import Path

LEGACY_DIR = Path(__file__).resolve().parent.parent / "keyset" / "workers"
if LEGACY_DIR.is_dir():
    __path__ = [str(LEGACY_DIR)]  # type: ignore[name-defined]
else:
    __path__ = []  # type: ignore[name-defined]
