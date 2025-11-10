"""
KeySet LocalAgent - FastAPI backend
Provides REST API for accounts, tasks, parsing, and data management
"""
from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import database functions
from db import (
    Account,
    Proxy,
    Task,
    create_account,
    create_proxy,
    create_task,
    delete_account,
    get_account,
    get_accounts,
    get_db,
    get_proxies,
    get_proxy,
    get_task,
    get_tasks,
    init_db,
    update_account,
    update_task,
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

# Initialize database on startup
init_db()

app = FastAPI(title="KeySet LocalAgent", version="0.2.0")

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:8765"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic schemas for request/response
class AccountCreate(BaseModel):
    name: str
    profile_path: Optional[str] = None
    proxy: Optional[str] = None
    cookies: Optional[str] = None
    notes: Optional[str] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    profile_path: Optional[str] = None
    proxy: Optional[str] = None
    cookies: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    profile_path: Optional[str]
    proxy: Optional[str]
    status: str
    created_at: datetime
    last_used_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    account_id: Optional[int] = None
    seed_file: str
    region: int = 225
    kind: str = "frequency"


class TaskResponse(BaseModel):
    id: int
    account_id: Optional[int]
    seed_file: str
    region: int
    kind: str
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True


class ProxyCreate(BaseModel):
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    proxy_type: str = "http"


class ProxyResponse(BaseModel):
    id: int
    host: str
    port: int
    username: Optional[str]
    proxy_type: str
    status: str
    country: Optional[str]
    speed_ms: Optional[int]

    class Config:
        from_attributes = True


# Health check
@app.get("/api/health")
def healthcheck() -> Dict[str, Any]:
    return {"status": "ok", "version": "0.2.0"}


# =============================================================================
# ACCOUNTS ENDPOINTS
# =============================================================================


@app.get("/api/accounts", response_model=List[AccountResponse])
def list_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all accounts"""
    accounts = get_accounts(db, skip=skip, limit=limit)
    return accounts


@app.post("/api/accounts", response_model=AccountResponse, status_code=201)
def create_new_account(account: AccountCreate, db: Session = Depends(get_db)):
    """Create new account"""
    try:
        new_account = create_account(
            db,
            name=account.name,
            profile_path=account.profile_path,
            proxy=account.proxy,
            cookies=account.cookies,
            notes=account.notes,
        )
        return new_account
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/accounts/{account_id}", response_model=AccountResponse)
def get_account_by_id(account_id: int, db: Session = Depends(get_db)):
    """Get account by ID"""
    account = get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@app.post("/api/accounts/update")
def update_account_legacy(account: AccountUpdate, db: Session = Depends(get_db)):
    """Update account (legacy endpoint for compatibility with original script.js)"""
    # Assuming account has id in the payload
    account_id = getattr(account, "id", None)
    if not account_id:
        raise HTTPException(status_code=400, detail="Account ID required")

    updated_account = update_account(
        db,
        account_id,
        **{k: v for k, v in account.dict().items() if v is not None and k != "id"},
    )
    if not updated_account:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"success": True, "message": "Account updated", "data": updated_account}


@app.post("/api/browser/launch")
def launch_browser_legacy(payload: dict, db: Session = Depends(get_db)):
    """Launch browser (legacy endpoint for compatibility with original script.js)"""
    account_id = payload.get("id")
    if not account_id:
        raise HTTPException(status_code=400, detail="Account ID required")

    account = get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # TODO: Integrate with playwright/browser launcher
    return {
        "success": True,
        "message": f"Browser launched for {account.name}",
        "account_id": account_id,
    }


@app.post("/api/proxy/test")
def test_proxy_legacy(payload: dict):
    """Test proxy (legacy endpoint for compatibility with original script.js)"""
    host = payload.get("host")
    port = payload.get("port")

    if not host or not port:
        raise HTTPException(status_code=400, detail="Host and port required")

    # TODO: Implement real proxy testing
    return {
        "success": True,
        "message": "Proxy test successful",
        "proxy": f"{host}:{port}",
        "response_time_ms": 150,
    }


@app.post("/api/accounts/{account_id}", response_model=AccountResponse)
def update_existing_account(
    account_id: int, account: AccountUpdate, db: Session = Depends(get_db)
):
    """Update account"""
    updated_account = update_account(
        db,
        account_id,
        **{k: v for k, v in account.dict().items() if v is not None},
    )
    if not updated_account:
        raise HTTPException(status_code=404, detail="Account not found")
    return updated_account


@app.delete("/api/accounts/{account_id}", status_code=204)
def delete_existing_account(account_id: int, db: Session = Depends(get_db)):
    """Delete account"""
    success = delete_account(db, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return None


@app.post("/api/accounts/{account_id}/launch")
def launch_account(account_id: int, db: Session = Depends(get_db)):
    """Launch browser for account"""
    account = get_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # TODO: Integrate with playwright/browser launcher
    # For now, return mock response
    return {
        "status": "launched",
        "account_id": account_id,
        "message": f"Browser launched for {account.name}",
    }


# =============================================================================
# PARSING ENDPOINTS
# =============================================================================

# In-memory storage for task status (replace with Redis/DB in production)
parsing_tasks = {}


@app.post("/api/parsing/start")
async def start_parsing(
    task: TaskCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Start parsing task"""
    # Create task in database
    new_task = create_task(
        db,
        account_id=task.account_id,
        seed_file=task.seed_file,
        region=task.region,
        kind=task.kind,
    )

    job_id = str(uuid.uuid4())
    parsing_tasks[job_id] = {
        "task_id": new_task.id,
        "status": "queued",
        "progress": 0,
        "message": "Task queued",
    }

    # Add background task (mock for now)
    background_tasks.add_task(run_parsing_task, job_id, new_task.id, db)

    return {"job_id": job_id, "task_id": new_task.id, "status": "started"}


async def run_parsing_task(job_id: str, task_id: int, db: Session):
    """Mock parsing task (replace with real parser)"""
    import time

    # Update task status
    update_task(db, task_id, status="running", started_at=datetime.utcnow())
    parsing_tasks[job_id]["status"] = "running"

    # Simulate parsing work
    time.sleep(2)

    # Update task as completed
    update_task(
        db,
        task_id,
        status="completed",
        finished_at=datetime.utcnow(),
        output_path="/tmp/results.txt",
    )
    parsing_tasks[job_id]["status"] = "completed"
    parsing_tasks[job_id]["progress"] = 100


@app.get("/api/parsing/status/{job_id}")
def get_parsing_status(job_id: str):
    """Get parsing task status"""
    if job_id not in parsing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return parsing_tasks[job_id]


@app.get("/api/parsing/result/{job_id}")
def get_parsing_result(job_id: str, db: Session = Depends(get_db)):
    """Get parsing results"""
    if job_id not in parsing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task_info = parsing_tasks[job_id]
    task_id = task_info["task_id"]
    task = get_task(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found in database")

    # TODO: Load actual results from output_path
    return {
        "job_id": job_id,
        "task_id": task_id,
        "status": task.status,
        "results": [
            {"phrase": "example phrase", "freq_total": 1000, "freq_exact": 500}
        ],
    }


# =============================================================================
# PROXY ENDPOINTS
# =============================================================================


@app.get("/api/proxies", response_model=List[ProxyResponse])
def list_proxies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all proxies"""
    proxies = get_proxies(db, skip=skip, limit=limit)
    return proxies


@app.post("/api/proxies", response_model=ProxyResponse, status_code=201)
def create_new_proxy(proxy: ProxyCreate, db: Session = Depends(get_db)):
    """Create new proxy"""
    try:
        new_proxy = create_proxy(
            db,
            host=proxy.host,
            port=proxy.port,
            username=proxy.username,
            password=proxy.password,
            proxy_type=proxy.proxy_type,
        )
        return new_proxy
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/proxies/test")
def test_proxy(proxy: ProxyCreate):
    """Test proxy connection"""
    # TODO: Implement real proxy testing
    return {
        "status": "success",
        "proxy": f"{proxy.host}:{proxy.port}",
        "response_time_ms": 150,
    }


@app.post("/api/proxies/parse")
def parse_proxies(proxies_text: str):
    """Parse proxy list from text"""
    # TODO: Implement proxy parsing logic
    lines = proxies_text.strip().split("\n")
    parsed = []
    for line in lines:
        if ":" in line:
            parts = line.split(":")
            parsed.append({"host": parts[0], "port": int(parts[1])})
    return {"count": len(parsed), "proxies": parsed}


# =============================================================================
# DATA ENDPOINTS (for Data module)
# =============================================================================


@app.get("/api/data/groups")
def get_data_groups():
    """Get phrase groups"""
    # TODO: Load from database or file
    return [
        {"id": 1, "name": "Group 1", "phrases_count": 10},
        {"id": 2, "name": "Group 2", "phrases_count": 15},
    ]


@app.post("/api/data/phrases")
def save_phrases(phrases: List[Dict[str, Any]]):
    """Save phrases to database"""
    # TODO: Implement save logic
    return {"status": "ok", "saved": len(phrases)}


@app.get("/api/data/export")
def export_data(format: str = "xlsx"):
    """Export data"""
    # TODO: Implement export logic
    return {"status": "ok", "format": format, "url": "/downloads/export.xlsx"}


# =============================================================================
# TASKS ENDPOINTS
# =============================================================================


@app.get("/api/tasks", response_model=List[TaskResponse])
def list_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all tasks"""
    tasks = get_tasks(db, skip=skip, limit=limit)
    return tasks


# =============================================================================
# FRONTEND STATIC FILES (MUST BE LAST)
# =============================================================================

if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST, html=True),
        name="frontend",
    )
