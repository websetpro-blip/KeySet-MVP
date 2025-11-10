"""
Упрощенный launcher без PyWebView - открывает в браузере
"""
import threading
import time
import webbrowser
from uvicorn import Config, Server

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8765
BACKEND_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}"

def run_backend():
    config = Config(
        "backend.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=False,
        log_level="info",
    )
    Server(config).run()

def main():
    print("[launcher] Starting backend thread...")
    backend_thread = threading.Thread(target=run_backend, daemon=True, name="backend")
    backend_thread.start()

    print("[launcher] Waiting 2 seconds for backend startup...")
    time.sleep(2)

    print(f"[launcher] Opening browser at {BACKEND_URL}")
    webbrowser.open(BACKEND_URL)

    print("[launcher] Backend running. Press Ctrl+C to stop.")
    try:
        backend_thread.join()
    except KeyboardInterrupt:
        print("\n[launcher] Shutting down...")

if __name__ == "__main__":
    main()
