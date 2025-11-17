from __future__ import annotations

import os
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

import uvicorn

from core.app_paths import APP_ROOT, RUNTIME, bootstrap_files, ensure_runtime

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = int(os.environ.get("KEYSET_PORT", "8765"))
EDGE_PROFILE = RUNTIME / "edge_profile"
FRONTEND_DIR = APP_ROOT / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"
FRONTEND_SUFFIXES = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".json",
    ".html",
    ".md",
    ".svg",
}
EDGE_CANDIDATES = [
    Path(os.environ.get("PROGRAMFILES", "")) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
    Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Microsoft" / "Edge" / "Application" / "msedge.exe",
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
]


def _pick_browser() -> Path | None:
    for candidate in EDGE_CANDIDATES:
        if candidate and candidate.exists():
            return candidate
    path = shutil.which("msedge")
    return Path(path) if path else None


def _wait_for_backend(host: str, port: int, timeout: float = 30.0) -> bool:
    url = f"http://{host}:{port}/api/health"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except (urllib.error.URLError, ConnectionError):
            time.sleep(0.3)
    return False


def _run_backend() -> None:
    config = uvicorn.Config(
        "backend.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)
    server.run()


def _needs_frontend_rebuild() -> bool:
    if not FRONTEND_INDEX.exists():
        return True
    try:
        dist_mtime = FRONTEND_INDEX.stat().st_mtime
    except OSError:
        return True

    latest_src = dist_mtime
    try:
        for path in FRONTEND_DIR.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix in FRONTEND_SUFFIXES:
                latest_src = max(latest_src, path.stat().st_mtime)
    except OSError:
        return True

    return latest_src > dist_mtime


def _ensure_frontend_build() -> None:
    if not FRONTEND_DIR.exists():
        return
    if not _needs_frontend_rebuild():
        return

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    print("[launcher] Пересобираю frontend (npm run build)…")
    try:
        result = subprocess.run(
            [npm_cmd, "run", "build"],
            cwd=str(FRONTEND_DIR),
            check=True,
        )
        if result.returncode == 0:
            print("[launcher] Сборка frontend завершена")
    except Exception as exc:  # pragma: no cover — зависит от окружения
        print(f"[launcher] Не удалось собрать frontend автоматически: {exc}")


def _launch_edge(url: str) -> subprocess.Popen | None:
    EDGE_PROFILE.mkdir(parents=True, exist_ok=True)
    edge = _pick_browser()
    if not edge:
        print("Microsoft Edge не найден. Откройте браузер вручную:", url)
        return None
    args = [
        str(edge),
        f"--app={url}",
        f"--user-data-dir={EDGE_PROFILE}",
        "--no-first-run",
        "--disable-extensions",
    ]
    return subprocess.Popen(args)


def main() -> None:
    _ensure_frontend_build()
    ensure_runtime()
    bootstrap_files()

    backend_thread: threading.Thread | None = None

    # Если backend уже крутится (например, запущен из другой консоли),
    # не запускаем второй экземпляр, а просто открываем окно.
    if _wait_for_backend(BACKEND_HOST, BACKEND_PORT, timeout=1.0):
        print(f"Backend уже запущен на {BACKEND_HOST}:{BACKEND_PORT}, использую его.")
    else:
        backend_thread = threading.Thread(target=_run_backend, daemon=True, name="backend")
        backend_thread.start()

        if not _wait_for_backend(BACKEND_HOST, BACKEND_PORT):
            print("Backend не поднялся за отведённое время.")
            return

    # Добавляем версию в query, чтобы сбросить кэш index.html в edge_profile
    base_url = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
    version_hint: int
    try:
        index_html = APP_ROOT / "frontend" / "dist" / "index.html"
        if index_html.exists():
            version_hint = int(index_html.stat().st_mtime)
        else:
            version_hint = int(time.time())
    except OSError:
        version_hint = int(time.time())

    url = f"{base_url}/?v={version_hint}"
    edge_proc = _launch_edge(url)
    try:
        if edge_proc:
            edge_proc.wait()
        else:
            print("Ожидаю завершения backend. Нажмите Ctrl+C для выхода.")
            while backend_thread and backend_thread.is_alive():
                time.sleep(0.5)
    except KeyboardInterrupt:
        print("Завершение по Ctrl+C")


if __name__ == "__main__":
    main()
