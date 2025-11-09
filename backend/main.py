from __future__ import annotations


import logging
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import devtools
from .routers import accounts, data, wordstat

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
FRONTEND_ROOT = BASE_DIR.parent / "frontend"

app = FastAPI(title="KeySet LocalAgent", version="0.1.0")
logger = logging.getLogger("keyset.react")

app.include_router(devtools.router)
app.include_router(wordstat.router)
app.include_router(accounts.router)
app.include_router(data.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck() -> Dict[str, Any]:
    return {"status": "ok"}


@app.get("/api/analytics")
def analytics_summary() -> JSONResponse:
    data = {
        "topWastefulQueries": [
            {
                "id": 1,
                "query": "купить окна недорого москва",
                "impressions": 12500,
                "clicks": 950,
                "cost": 48500,
                "conversions": 0,
                "ctr": 7.6,
                "cpa": None,
            },
            {
                "id": 2,
                "query": "доставка цветов дешево",
                "impressions": 8600,
                "clicks": 540,
                "cost": 32700,
                "conversions": 0,
                "ctr": 6.2,
                "cpa": None,
            },
            {
                "id": 3,
                "query": "ремонт iphone срочно",
                "impressions": 5100,
                "clicks": 410,
                "cost": 28900,
                "conversions": 0,
                "ctr": 8.0,
                "cpa": None,
            },
        ],
        "topExpensiveConversions": [
            {
                "id": 11,
                "query": "ремонт стиральных машин спб",
                "impressions": 3400,
                "clicks": 260,
                "cost": 19800,
                "conversions": 3,
                "ctr": 7.6,
                "cpa": 6600,
            },
            {
                "id": 12,
                "query": "обучение графическому дизайну онлайн",
                "impressions": 4700,
                "clicks": 390,
                "cost": 25400,
                "conversions": 4,
                "ctr": 8.3,
                "cpa": 6350,
            },
            {
                "id": 13,
                "query": "натяжные потолки установка",
                "impressions": 7800,
                "clicks": 520,
                "cost": 31200,
                "conversions": 6,
                "ctr": 6.6,
                "cpa": 5200,
            },
        ],
    }
    return JSONResponse(content=data)


@app.post("/api/debug/react-error")
async def capture_react_error(payload: Dict[str, Any]) -> Dict[str, str]:
    logger.error("Client React error: %s", payload)
    log_path = BASE_DIR / "react_errors.log"
    try:
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(f"{payload}\n")
    except OSError:
        pass
    return {"status": "logged"}


if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST, html=True),
        name="frontend",
    )


@app.get("/comet-ide.html")
def comet_ide() -> FileResponse:
    file_path = FRONTEND_ROOT / "comet-ide.html"
    if not file_path.exists():
        raise FileNotFoundError("comet-ide.html not found. Please add it under frontend/.")
    return FileResponse(file_path)
