from __future__ import annotations

import threading
import time

import uvicorn

try:
    import webview
except ImportError:  # pragma: no cover
    webview = None


BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8765


class WindowAPI:
    """API class to expose window controls to JavaScript."""

    def __init__(self):
        self.window = None

    def set_window(self, window):
        self.window = window

    def minimize(self):
        """Minimize the window."""
        if self.window:
            self.window.minimize()

    def maximize(self):
        """Maximize or restore the window."""
        if self.window:
            self.window.toggle_fullscreen()

    def close(self):
        """Close the window."""
        if self.window:
            self.window.destroy()


def start_backend() -> None:
    uvicorn.run(
        "backend.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=False,
        log_level="info",
    )


def main() -> None:
    thread = threading.Thread(target=start_backend, daemon=True)
    thread.start()
    time.sleep(1.5)

    if webview is None:
        print("PyWebView is not installed yet. Please run `pip install pywebview`." )
        print(f"Then open http://{BACKEND_HOST}:{BACKEND_PORT} in your browser.")
        thread.join()
        return

    api = WindowAPI()
    window = webview.create_window(
        "KeySet",
        f"http://{BACKEND_HOST}:{BACKEND_PORT}",
        frameless=True,
        easy_drag=False,
        js_api=api
    )
    api.set_window(window)
    webview.start()


if __name__ == "__main__":
    main()
