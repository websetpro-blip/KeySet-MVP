from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

app = FastAPI(title="KeySet LocalAgent", version="0.1.0")

if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST, html=True),
        name="frontend",
    )


@app.get("/api/health")
def healthcheck() -> Dict[str, Any]:
    return {"status": "ok"}


@app.get("/api/accounts")
def list_accounts() -> JSONResponse:
    data = [
        {"id": 1, "login": "demo1@yandex.ru", "status": "active"},
        {"id": 2, "login": "demo2@yandex.ru", "status": "needs_login"},
    ]
    return JSONResponse(content=data)
