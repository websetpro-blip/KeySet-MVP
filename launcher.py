from __future__ import annotations

import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List

import requests
from uvicorn import Config, Server

# Configure PyWebView backend before importing webview
os.environ.setdefault("PYWEBVIEW_GUI", "cef")

try:
    import webview
except ImportError:  # pragma: no cover
    webview = None


BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8765
BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
HEALTH_PATH = "/api/health"
BACKEND_STARTUP_TIMEOUT = 20.0
HEALTH_POLL_INTERVAL = 0.25
DEFAULT_EXTERNAL_BASE_URL = os.environ.get("KEYSET_DEVTOOLS_BASE_URL") or os.environ.get(
    "KEYSET_PUBLIC_BASE_URL", BACKEND_URL
)
DEV_TOKEN = os.environ.get("KEYSET_DEV_TOKEN")
GUI_PREFERENCE_CHAIN: List[str] = []
SAFE_BOOTSTRAP_JS = (
    "try { if (window.native) { delete window.native; } } "
    "catch (err) { console.warn('[KeySet] window.native cleanup failed', err); }"
)


def _is_cef_supported() -> bool:
    """Return True if current Python version is supported by cefpython."""
    major, minor = sys.version_info[:2]
    # cefpython 66.1 поддерживает Python <= 3.12 (официально до 3.10, но 3.12 тестирован локально)
    return major == 3 and minor <= 12


def _prepare_gui_preference_chain() -> None:
    """Build ordered list of GUI backends to try (cef first, then fallbacks)."""
    preferred = (os.environ.get("PYWEBVIEW_GUI") or "cef").strip().lower()
    if preferred == "cef" and not _is_cef_supported():
        preferred = "edgechromium"
    fallbacks = ["edgechromium", "mshtml"]
    GUI_PREFERENCE_CHAIN.clear()
    GUI_PREFERENCE_CHAIN.append(preferred)
    for backend in fallbacks:
        if backend != preferred:
            GUI_PREFERENCE_CHAIN.append(backend)


_prepare_gui_preference_chain()


class DevToolsBridge:
    """Expose backend devtools endpoints to the JS context."""

    def __init__(self, base_url: str, dev_token: str | None) -> None:
        self.base_url = base_url.rstrip("/")
        self.dev_token = dev_token
        self._session = requests.Session()

    def _request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any] | str:
        params = kwargs.setdefault("params", {})
        if self.dev_token and "token" not in params:
            params["token"] = self.dev_token
        url = f"{self.base_url}{path}"

        try:
            response = self._session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
        except requests.RequestException as exc:
            return {"error": str(exc), "endpoint": path}

        try:
            return response.json()
        except ValueError:
            return response.text

    # -------- Public API methods exposed to JavaScript --------
    def read_file(self, path: str, encoding: str | None = None) -> Dict[str, Any] | str:
        params = {"path": path}
        if encoding:
            params["encoding"] = encoding
        return self._request("get", "/dev/read_file", params=params)

    def save_file(
        self,
        path: str,
        content: str,
        encoding: str = "utf-8",
        base64_content: bool = False,
    ) -> Dict[str, Any] | str:
        payload = {
            "path": path,
            "content": content,
            "encoding": encoding,
            "base64_content": base64_content,
        }
        return self._request("post", "/dev/save_file", json=payload)

    def save_file_get(
        self,
        path: str,
        content: str,
        encoding: str = "utf-8",
        base64_content: bool = False,
    ) -> Dict[str, Any] | str:
        params = {
            "path": path,
            "content": content,
            "encoding": encoding,
            "base64_content": str(base64_content).lower(),
        }
        return self._request("get", "/dev/save_file_get", params=params)

    def list_dir(self, path: str = ".") -> Dict[str, Any] | str:
        return self._request("get", "/dev/list", params={"path": path})

    def reload_modules(self, modules: Iterable[str]) -> Dict[str, Any] | str:
        payload = {"modules": list(modules)}
        return self._request("post", "/dev/reload", json=payload)


class WindowAPI(DevToolsBridge):
    """Expose window controls + devtools bridge to the frontend."""

    def __init__(self, base_url: str, dev_token: str | None) -> None:
        super().__init__(base_url, dev_token)
        self.window = None

    def set_window(self, window) -> None:
        self.window = window

    # Window controls -------------------------------------------------
    def minimize(self) -> None:
        if self.window:
            self.window.minimize()

    def maximize(self) -> None:
        if self.window:
            self.window.toggle_fullscreen()

    def close(self) -> None:
        if self.window:
            self.window.destroy()


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


def wait_for_backend(timeout: float = BACKEND_STARTUP_TIMEOUT) -> bool:
    """Poll /api/health until backend reports readiness."""
    deadline = time.monotonic() + timeout
    health_url = f"{BACKEND_URL}{HEALTH_PATH}"

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


def main() -> None:
    print("[launcher] Starting backend thread...")
    backend_thread = threading.Thread(target=run_backend, daemon=True, name="backend")
    backend_thread.start()

    if not wait_for_backend():
        raise RuntimeError(
            f"Backend did not answer at {BACKEND_URL}{HEALTH_PATH} "
            f"within {BACKEND_STARTUP_TIMEOUT} seconds."
        )

    if webview is None:
        print("[launcher] PyWebView is not installed. Run `pip install pywebview`.")
        print(f"[launcher] UI is still available at {BACKEND_URL} in your browser.")
        backend_thread.join()
        return

    external_base_url = DEFAULT_EXTERNAL_BASE_URL
    print(f"[launcher] Using devtools base URL: {external_base_url}")
    bridge = WindowAPI(external_base_url, DEV_TOKEN)

    def create_main_window():
        window = webview.create_window(
            "KeySet",
            BACKEND_URL,
            js_api=bridge,
            width=1400,
            height=900,
            js=SAFE_BOOTSTRAP_JS,
        )
        bridge.set_window(window)
        return window

    last_error: Exception | None = None
    for gui_backend in GUI_PREFERENCE_CHAIN:
        print(f"[launcher] Creating PyWebView window via '{gui_backend}' backend...")
        create_main_window()
        print("[launcher] Starting webview loop (close window to exit).")
        try:
            webview.start(gui=gui_backend, debug=False)
            last_error = None
            break
        except Exception as exc:  # pragma: no cover - depends on OS runtime
            last_error = exc
            print(
                f"[launcher] webview failed to start with '{gui_backend}' backend: {exc}"
            )
            try:
                webview.windows.clear()
            except Exception:  # pragma: no cover - cleanup best effort
                pass
            continue
    else:
        if last_error:
            raise last_error

    print("[launcher] webview loop finished.")


if __name__ == "__main__":
    main()
