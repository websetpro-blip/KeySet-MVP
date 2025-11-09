from __future__ import annotations

import os
import sys
from pathlib import Path

import webview

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


def app_path(*parts: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", BASE_DIR))
    return base.joinpath(*parts)


def _bootstrap_sys_path() -> None:
    project_candidates = [
        BASE_DIR.parent.parent,
        app_path("keyset"),
    ]
    for candidate in project_candidates:
        if not candidate or not Path(candidate).exists():
            continue
        path_str = str(candidate)
        if path_str not in sys.path:
            sys.path.insert(0, path_str)


_bootstrap_sys_path()
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(app_path("playwright-browsers")))

from keyset.core.db import ensure_schema  # noqa: E402
from .api import Api  # noqa: E402  pylint: disable=ungrouped-imports


def create_window() -> webview.Window:
    index_path = STATIC_DIR / "host" / "index.html"
    if not index_path.exists():
        raise FileNotFoundError(f"Host index.html not found: {index_path}")

    return webview.create_window(
        title="KeySet Desktop",
        url=index_path.as_uri(),
        js_api=Api(),
        width=1360,
        height=860,
        background_color="#0d1117",
        text_select=False,
    )


def main() -> None:
    ensure_schema()
    create_window()
    webview.start(debug=False)


if __name__ == "__main__":
    main()
