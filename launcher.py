from __future__ import annotations

import os
from pathlib import Path
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from collections.abc import Sequence

from uvicorn import Config, Server

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Import portable paths module
try:
    from keyset.core.app_paths import APP_ROOT, RUNTIME
except ImportError:
    # Fallback if app_paths not yet in path
    APP_ROOT = Path(__file__).resolve().parent if not getattr(sys, "frozen", False) else Path(sys.executable).resolve().parent
    RUNTIME = APP_ROOT / "runtime"
    RUNTIME.mkdir(parents=True, exist_ok=True)

# === Настройка путей для PyInstaller ===
if getattr(sys, "frozen", False):
    bundle_dir = Path(getattr(sys, "_MEIPASS", Path.cwd()))
    sys.path.insert(0, str(bundle_dir))
    print(f"[DEBUG] Running from .exe, _MEIPASS: {bundle_dir}")
    print(f"[DEBUG] APP_ROOT: {APP_ROOT}")
    print(f"[DEBUG] sys.path: {sys.path[:3]}")
    backend_path = bundle_dir / "backend"
    if backend_path.exists():
        print(f"[DEBUG] OK backend folder found: {backend_path}")
    else:
        print(f"[DEBUG] FAIL backend folder NOT found!")
else:
    bundle_dir = Path(__file__).resolve().parent
    print("[DEBUG] Running from Python (dev mode)")

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8765  # Фиксированный порт для WebView
HEALTH_PATH = "/api/health"
BACKEND_STARTUP_TIMEOUT = 20.0
HEALTH_POLL_INTERVAL = 0.25


def pick_free_port() -> int:
    """Reserve a random ephemeral port for the backend."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((BACKEND_HOST, 0))
        return sock.getsockname()[1]


def run_backend(port: int) -> None:
    """Start FastAPI backend inside the current process."""
    try:
        import backend.main  # noqa: F401
        print("[DEBUG] OK backend.main imported successfully")
    except Exception as exc:
        print(f"[DEBUG] FAIL Failed to import backend.main: {exc}")
        import traceback

        traceback.print_exc()
        return

    config = Config(
        "backend.main:app",
        host=BACKEND_HOST,
        port=port,
        reload=False,
        log_level="info",
    )
    Server(config).run()


def wait_for_backend(base_url: str, timeout: float = BACKEND_STARTUP_TIMEOUT) -> bool:
    """Poll /api/health until backend reports readiness."""
    deadline = time.monotonic() + timeout
    health_url = f"{base_url}{HEALTH_PATH}"

    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=1) as response:
                if response.status == 200:
                    return True
        except (urllib.error.URLError, socket.timeout, TimeoutError):
            time.sleep(HEALTH_POLL_INTERVAL)
        else:
            time.sleep(HEALTH_POLL_INTERVAL)
    return False


def launch_browser(url: str) -> subprocess.Popen | None:
    """Start Edge/Chrome in app mode (standalone window)."""
    # Use portable runtime directory for Edge profile
    user_data = RUNTIME / "edge_profile"
    user_data.mkdir(parents=True, exist_ok=True)

    # Полные пути к браузерам на Windows
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]

    # Edge/Chrome в app-mode = окно без адресной строки
    candidates: list[tuple[str, str, str]] = []
    for edge_path in edge_paths:
        if Path(edge_path).exists():
            candidates.append((edge_path, f"--app={url}", f"--user-data-dir={user_data}"))
            break
    for chrome_path in chrome_paths:
        if Path(chrome_path).exists():
            candidates.append((chrome_path, f"--app={url}", f"--user-data-dir={user_data}"))
            break

    for cmd in candidates:
        try:
            print(f"[launcher] Opening app window via {Path(cmd[0]).name}...")
            proc = subprocess.Popen(list(cmd))
            # Подождем чуть чтобы убедиться что процесс не завершился сразу
            time.sleep(0.5)
            if proc.poll() is None:  # Процесс еще жив
                return proc
        except Exception as e:
            print(f"[launcher] Failed to start {Path(cmd[0]).name}: {e}")
            continue

    # Fallback на обычный браузер
    print("[launcher] App mode failed, opening default browser...")
    webbrowser.open(url)
    return None


def main() -> None:
    port = pick_free_port()
    backend_url = f"http://{BACKEND_HOST}:{port}"
    print(f"[launcher] Starting backend on {backend_url} ...")
    backend_thread = threading.Thread(target=run_backend, args=(port,), daemon=True, name="backend")
    backend_thread.start()

    if not wait_for_backend(backend_url):
        raise RuntimeError(
            f"Backend did not answer at {backend_url}{HEALTH_PATH} "
            f"within {BACKEND_STARTUP_TIMEOUT} seconds."
        )

    browser_proc = launch_browser(backend_url)
    if browser_proc is None:
        print("[launcher] Waiting for backend thread (Ctrl+C to exit).")
        try:
            backend_thread.join()
        except KeyboardInterrupt:
            pass
        return

    print("[launcher] Browser window started. Close it to exit KeySet.")
    try:
        browser_proc.wait()
    except KeyboardInterrupt:
        print("[launcher] Interrupt received, terminating browser...")
        browser_proc.terminate()
        browser_proc.wait(timeout=5)

    print("[launcher] Browser closed, shutting down.")
    sys.exit(0)


if __name__ == "__main__":
    main()
