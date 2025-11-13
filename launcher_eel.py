from __future__ import annotations

import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path
from threading import Thread

import requests
import uvicorn

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

BACKEND_HOST = os.environ.get("KEYSET_BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.environ.get("KEYSET_BACKEND_PORT", "8765"))
BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"
HEALTH_PATH = os.environ.get("KEYSET_HEALTH_PATH", "/api/health")
BACKEND_TIMEOUT = float(os.environ.get("KEYSET_BACKEND_TIMEOUT", "15"))

WINDOW_WIDTH = int(os.environ.get("KEYSET_WINDOW_WIDTH", "1280"))
WINDOW_HEIGHT = int(os.environ.get("KEYSET_WINDOW_HEIGHT", "800"))
PRIMARY_MODE = os.environ.get("KEYSET_BROWSER_MODE", "chrome")

sys.path.insert(0, str(BACKEND_DIR))
from backend.main import app  # type: ignore  # noqa: E402


def ensure_dist() -> None:
    if not FRONTEND_DIST.exists():
        raise FileNotFoundError(
            f"{FRONTEND_DIST} отсутствует. Выполни `npm run build` в папке frontend.",
        )


def start_backend() -> None:
    uvicorn.run(
        app,
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        log_level=os.environ.get("KEYSET_BACKEND_LOG_LEVEL", "info"),
    )


def wait_for_backend(timeout: float = BACKEND_TIMEOUT) -> bool:
    health_url = f"{BACKEND_URL}{HEALTH_PATH}"
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            response = requests.get(health_url, timeout=1)
            if response.status_code == 200:
                print(f"[launcher] Backend готов: {health_url}")
                return True
        except requests.RequestException:
            pass
        time.sleep(0.3)

    print(f"[launcher] Backend не ответил за {timeout} секунд ({health_url}).")
    return False


def open_window() -> None:
    # Відкриваємо браузер безпосередньо на backend URL, щоб React Router працював
    chrome_args = [
        f"--app={BACKEND_URL}",
        f"--window-size={WINDOW_WIDTH},{WINDOW_HEIGHT}",
        "--disable-features=TranslateUI",
        "--disable-infobars",
    ]

    try:
        print(f"[launcher] Відкриваю {PRIMARY_MODE} на {BACKEND_URL}...")
        if PRIMARY_MODE == "chrome":
            chrome_path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            if os.path.exists(chrome_path):
                subprocess.Popen([chrome_path] + chrome_args)
            else:
                webbrowser.open(BACKEND_URL)
        else:
            # Fallback - системний браузер
            webbrowser.open(BACKEND_URL)

        print("[launcher] Браузер відкрито. Натисни Ctrl+C для виходу.")
        # Блокуємо виконання, щоб backend продовжував працювати
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("[launcher] Зупинка по Ctrl+C.")


def main() -> None:
    ensure_dist()

    print("[launcher] Запуск backend...")
    Thread(target=start_backend, daemon=True).start()

    print("[launcher] Ждём health-check...")
    if not wait_for_backend():
        input("Нажми Enter для выхода...")
        sys.exit(1)

    print("[launcher] Backend стартовал, открываем UI.")
    try:
        open_window()
    except KeyboardInterrupt:
        print("[launcher] Остановка по Ctrl+C.")


if __name__ == "__main__":
    main()
