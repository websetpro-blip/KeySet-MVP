from __future__ import annotations

import asyncio
import base64
import importlib
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ALLOWED = {PROJECT_ROOT}


def _load_additional_roots() -> set[Path]:
    raw_value = os.getenv("KEYSET_DEV_ADDITIONAL_ROOTS", "")
    extra_roots: set[Path] = set()
    for chunk in raw_value.split(os.pathsep):
        chunk = chunk.strip()
        if not chunk:
            continue
        extra_roots.add(Path(chunk).expanduser().resolve())
    return extra_roots


ALLOWED_ROOTS = DEFAULT_ALLOWED | _load_additional_roots()


def _normalize_path(path_str: str) -> Path:
    candidate = Path(path_str)
    if not candidate.is_absolute():
        candidate = (PROJECT_ROOT / candidate).resolve()
    else:
        candidate = candidate.resolve()

    for root in ALLOWED_ROOTS:
        root = root.resolve()
        if root == candidate or root in candidate.parents:
            return candidate

    allowed_hints = ", ".join(str(p) for p in ALLOWED_ROOTS)
    raise HTTPException(
        status_code=400,
        detail=f"Path {candidate} outside allowed roots ({allowed_hints})",
    )


def _relative_to_allowed(path: Path) -> str:
    for root in ALLOWED_ROOTS:
        root = root.resolve()
        if path == root:
            return "."
        if root in path.parents:
            return str(path.relative_to(root))
    return str(path)


class DevAccessGuard:
    """Runtime-toggleable guard for dev endpoints."""

    def __init__(self) -> None:
        flag = os.getenv("KEYSET_DEVTOOLS_ENABLED", "1").lower()
        self.enabled = flag not in {"0", "false", "no"}
        self.token = os.getenv("KEYSET_DEV_TOKEN")

    def require_http(self, request: Request) -> None:
        if not self.enabled:
            raise HTTPException(status_code=404, detail="Devtools disabled")
        if self.token:
            header = request.headers.get("X-Dev-Token")
            query_token = request.query_params.get("token")
            if header != self.token and query_token != self.token:
                raise HTTPException(status_code=401, detail="Invalid dev token")

    async def require_websocket(self, websocket: WebSocket) -> None:
        if not self.enabled:
            await websocket.close(code=1008)
            raise WebSocketDisconnect(code=1008)

        if not self.token:
            return

        header_token = websocket.headers.get("x-dev-token")
        query_token = websocket.query_params.get("token")
        if header_token == self.token or query_token == self.token:
            return

        await websocket.close(code=1008)
        raise WebSocketDisconnect(code=1008)


dev_access = DevAccessGuard()
router = APIRouter(prefix="/dev", tags=["devtools"])


def _ensure_token(token: str | None) -> None:
    if dev_access.token and token != dev_access.token:
        raise HTTPException(status_code=401, detail="Invalid dev token")


class FilePayload(BaseModel):
    path: str = Field(..., description="Path relative to project root or absolute")


class SaveFilePayload(FilePayload):
    content: str
    encoding: str | None = "utf-8"


class DirectoryListing(BaseModel):
    path: str
    is_file: bool
    size: int | None


class HotfixPayload(BaseModel):
    code: str = Field(..., description="Python snippet to exec")
    module: str | None = Field(
        default=None,
        description="Optional module name, exec will run inside its namespace",
    )
    reload: bool = Field(
        default=False,
        description="Reload the module after applying code (if module provided)",
    )


class ReloadPayload(BaseModel):
    modules: List[str] = Field(default_factory=list)


class DevLogBroadcaster(logging.Handler):
    """Broadcast logging records to async WebSocket subscribers."""

    def __init__(self) -> None:
        super().__init__(level=logging.INFO)
        self.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)s | %(name)s: %(message)s")
        )
        self._listeners: set[asyncio.Queue[str]] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def register(self) -> asyncio.Queue[str]:
        loop = asyncio.get_running_loop()
        if self._loop is None:
            self._loop = loop
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=250)
        self._listeners.add(queue)
        return queue

    def unregister(self, queue: asyncio.Queue[str]) -> None:
        self._listeners.discard(queue)

    def emit(self, record: logging.LogRecord) -> None:
        message = self.format(record)
        if not self._listeners or self._loop is None:
            return

        def _dispatch() -> None:
            for queue in list(self._listeners):
                if queue.full():
                    try:
                        queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                queue.put_nowait(message)

        try:
            self._loop.call_soon_threadsafe(_dispatch)
        except RuntimeError:
            # Event loop may be closed; drop the message silently.
            pass


log_broadcaster = DevLogBroadcaster()
root_logger = logging.getLogger()
if not any(isinstance(handler, DevLogBroadcaster) for handler in root_logger.handlers):
    root_logger.addHandler(log_broadcaster)


def _sorted_dir_entries(path: Path) -> Iterable[Path]:
    def _sort_key(p: Path) -> tuple[int, str]:
        return (0 if p.is_dir() else 1, p.name.lower())

    return sorted(path.iterdir(), key=_sort_key)


@router.get("/info", dependencies=[Depends(dev_access.require_http)])
def dev_info() -> dict[str, object]:
    return {
        "projectRoot": str(PROJECT_ROOT),
        "allowedRoots": [str(p) for p in ALLOWED_ROOTS],
        "tokenProtected": bool(dev_access.token),
        "python": sys.version,
    }


def _collect_directory_entries(resolved: Path) -> list[DirectoryListing]:
    if resolved.is_file():
        stat = resolved.stat()
        return [
            DirectoryListing(
                path=_relative_to_allowed(resolved),
                is_file=True,
                size=stat.st_size,
            )
        ]

    if not resolved.is_dir():
        raise HTTPException(status_code=404, detail=f"{resolved} not found")

    entries: list[DirectoryListing] = []
    for child in _sorted_dir_entries(resolved):
        size = child.stat().st_size if child.is_file() else None
        entries.append(
            DirectoryListing(
                path=_relative_to_allowed(child),
                is_file=child.is_file(),
                size=size,
            )
        )
    return entries


@router.get("/list", response_model=list[DirectoryListing])
def list_directory(
    path: str = ".",
    _: None = Depends(dev_access.require_http),
) -> list[DirectoryListing]:
    resolved = _normalize_path(path)
    return _collect_directory_entries(resolved)


@router.post("/list", response_model=list[DirectoryListing])
def list_directory_post(
    payload: FilePayload,
    _: None = Depends(dev_access.require_http),
) -> list[DirectoryListing]:
    """
    POST-friendly variant of /dev/list that avoids long query strings.
    Useful when proxies/WAFs block encoded paths in the URL.
    """
    resolved = _normalize_path(payload.path or ".")
    return _collect_directory_entries(resolved)


@router.get("/read_file", dependencies=[Depends(dev_access.require_http)])
def read_file(path: str, encoding: str = "utf-8") -> dict[str, str]:
    resolved = _normalize_path(path)
    if not resolved.exists():
        raise HTTPException(status_code=404, detail=f"{resolved} not found")
    if resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path points to directory")

    content = resolved.read_text(encoding=encoding)
    return {"path": str(resolved), "content": content}


@router.post("/save_file", dependencies=[Depends(dev_access.require_http)])
async def save_file(
    request: Request,
    path: str | None = Form(default=None),
    content: str | None = Form(default=None),
    encoding: str = Form(default="utf-8"),
    base64_content: bool = Form(default=False),
) -> dict[str, str]:
    """
    Save file contents.

    Supports either JSON payload (original behaviour) or form-data, so that simple HTML forms
    or bookmarklets can write files without needing fetch+JSON privileges.
    """
    if path is None or content is None:
        try:
            payload = await request.json()
        except Exception as exc:  # pragma: no cover - defensive branch
            raise HTTPException(status_code=400, detail=f"Invalid payload: {exc}") from exc
        path = payload.get("path")
        content = payload.get("content")
        encoding = payload.get("encoding", encoding)
        base64_content = payload.get("base64_content", base64_content)

    if not path or content is None:
        raise HTTPException(status_code=400, detail="Both 'path' and 'content' are required")

    text = _decode_content(content, encoding, base64_content)
    saved_path = _write_file(path, text, encoding)
    return {"status": "saved", "path": saved_path}


@router.get("/save_file_get", dependencies=[Depends(dev_access.require_http)])
def save_file_get(
    path: str,
    content: str,
    encoding: str = "utf-8",
    base64_content: bool = False,
) -> dict[str, str]:
    """
    GET-based fallback for environments that cannot issue POST requests with custom headers.

    `content` can be passed as plain text or base64 when `base64_content=true`.
    """
    text = _decode_content(content, encoding, base64_content)
    saved_path = _write_file(path, text, encoding)
    return {"status": "saved", "path": saved_path}


def _decode_content(content: str, encoding: str, base64_content: bool) -> str:
    """Decode incoming content respecting base64 flag and encoding."""
    flag = base64_content
    if isinstance(flag, str):
        flag = flag.lower() in {"1", "true", "yes", "on"}

    if flag:
        try:
            return base64.b64decode(content).decode(encoding)
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(status_code=400, detail=f"Base64 decode failed: {exc}") from exc
    return content


def _write_file(path: str, content: str, encoding: str) -> str:
    resolved = _normalize_path(path)
    if not resolved.parent.exists():
        resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(content, encoding=encoding)
    return str(resolved)


@router.post("/save_file_post")
async def save_file_post(
    request: Request,
    token: str = Query(...),
) -> dict[str, str]:
    """
    POST endpoint dedicated to large files.

    Accepts JSON body with path/content/encoding/base64_content fields.
    """
    if dev_access.token and token != dev_access.token:
        raise HTTPException(status_code=401, detail="Invalid dev token")

    try:
        data = await request.json()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}") from exc

    path = data.get("path")
    content = data.get("content")
    encoding = data.get("encoding", "utf-8")
    base64_content = data.get("base64_content", False)

    if not path or content is None:
        raise HTTPException(status_code=400, detail="Missing path or content")

    text = _decode_content(content, encoding, base64_content)
    saved_path = _write_file(path, text, encoding)
    return {"status": "saved", "path": saved_path}


@router.get("/save_file_get_simple")
def save_file_get_simple(
    path: str = Query(...),
    content: str = Query(...),
    token: str = Query(...),
    encoding: str = Query("utf-8"),
) -> dict[str, object]:
    """Simple GET-based save that expects already-URL-encoded content."""
    _ensure_token(token)
    saved_path = _write_file(path, content, encoding)
    return {"status": "saved", "path": saved_path, "size": len(content)}


def _task_fix_region_columns() -> dict[str, Any]:
    db_path = _normalize_path("backend/db.py")
    content = db_path.read_text(encoding="utf-8")

    replacements = [
        (
            "region = Column(Integer, default=225, index=True)",
            "region = Column(Integer, nullable=True, index=True)",
        ),
        (
            "region = Column(Integer, default=225)",
            "region = Column(Integer, nullable=True)",
        ),
    ]

    modified = content
    changes = 0
    for old, new in replacements:
        if old in modified:
            modified = modified.replace(old, new)
            changes += 1

    db_path.write_text(modified, encoding="utf-8")
    return {"file": str(db_path), "changes": changes}


TASK_REGISTRY: Dict[str, Callable[[], Dict[str, Any]]] = {
    "fix_region": _task_fix_region_columns,
}


@router.get("/fix_region_db")
def fix_region_db(token: str = Query(...)) -> dict[str, Any]:
    _ensure_token(token)
    result = _task_fix_region_columns()
    result["status"] = "fixed"
    result["message"] = "Region columns are now nullable"
    return result


@router.post("/execute")
async def execute_task(request: Request, token: str = Query(...)) -> dict[str, Any]:
    _ensure_token(token)
    try:
        payload = await request.json()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}") from exc

    task_name = payload.get("task")
    if not task_name:
        raise HTTPException(status_code=400, detail="Missing 'task' field")

    task = TASK_REGISTRY.get(task_name)
    if task is None:
        raise HTTPException(status_code=400, detail=f"Unknown task: {task_name}")

    try:
        result = task()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Task failed: {exc}") from exc

    return {"status": "success", "task": task_name, "result": result}


@router.post("/hotfix", dependencies=[Depends(dev_access.require_http)])
def apply_hotfix(payload: HotfixPayload) -> dict[str, object]:
    namespace: dict[str, object] | None = None
    module_ref = None

    if payload.module:
        try:
            module_ref = importlib.import_module(payload.module)
        except ModuleNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        namespace = module_ref.__dict__

    try:
        exec(payload.code, namespace if namespace is not None else globals(), namespace)
    except Exception as exc:  # pragma: no cover - debug helper with dynamic code
        raise HTTPException(status_code=400, detail=f"Hotfix failed: {exc}") from exc

    reloaded = None
    if payload.reload and module_ref is not None:
        reloaded = importlib.reload(module_ref).__name__

    return {"status": "applied", "module": payload.module, "reloaded": reloaded}


@router.post("/reload", dependencies=[Depends(dev_access.require_http)])
def reload_modules(payload: ReloadPayload) -> dict[str, list[str]]:
    reloaded: list[str] = []
    for name in payload.modules:
        try:
            if name in sys.modules:
                module = importlib.reload(sys.modules[name])
            else:
                module = importlib.import_module(name)
            reloaded.append(module.__name__)
        except Exception as exc:  # pragma: no cover - debug helper
            raise HTTPException(status_code=400, detail=f"Reload failed for {name}: {exc}") from exc
    return {"modules": reloaded}


@router.get("/editor")
async def dev_editor(request: Request) -> HTMLResponse:
    dev_access.require_http(request)

    html = f"""
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>KeySet Dev Editor</title>
        <style>
          body {{
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #111;
            color: #eee;
          }}
          header {{
            padding: 0.5rem 1rem;
            background: #1f1f1f;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
          }}
          input, button {{
            font-size: 0.9rem;
            padding: 0.35rem 0.65rem;
          }}
          #editor {{
            width: 100vw;
            height: calc(100vh - 58px);
          }}
          label {{
            display: flex;
            flex-direction: column;
            font-size: 0.75rem;
            color: #ccc;
          }}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
      </head>
      <body>
        <header>
          <label>
            File path
            <input id="file-path" value="backend/main.py" spellcheck="false" />
          </label>
          <label>
            Dev token (optional)
            <input id="dev-token" value="" placeholder="X-Dev-Token" />
          </label>
          <button onclick="loadFile()">Load</button>
          <button onclick="saveFile()">Save (Ctrl+S)</button>
          <button onclick="reloadBackend()">Reload modules</button>
          <span id="status"></span>
        </header>
        <div id="editor"></div>
        <script>
          const statusEl = document.getElementById('status');
          const pathInput = document.getElementById('file-path');
          const tokenInput = document.getElementById('dev-token');
          const storageKey = 'keyset-dev-token';
          tokenInput.value = localStorage.getItem(storageKey) || '';
          tokenInput.addEventListener('change', () => {{
            localStorage.setItem(storageKey, tokenInput.value.trim());
          }});

          let editor;
          require.config({{ paths: {{ vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }} }});
          require(['vs/editor/editor.main'], () => {{
            editor = monaco.editor.create(document.getElementById('editor'), {{
              value: '# выбери файл и нажми Load',
              language: 'python',
              theme: 'vs-dark',
              automaticLayout: true,
            }});

            window.addEventListener('keydown', (event) => {{
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {{
                event.preventDefault();
                saveFile();
              }}
            }});
          }});

          function authHeaders() {{
            const token = tokenInput.value.trim();
            if (!token) return {{}};
            return {{ 'X-Dev-Token': token }};
          }}

          async function loadFile() {{
            const path = pathInput.value.trim();
            if (!path) {{
              alert('Укажи путь до файла');
              return;
            }}
            statusEl.textContent = 'Loading...';
            try {{
              const res = await fetch(`/dev/read_file?path=${{encodeURIComponent(path)}}`, {{
                headers: authHeaders()
              }});
              if (!res.ok) throw new Error(await res.text());
              const payload = await res.json();
              editor.setValue(payload.content);
              statusEl.textContent = `Loaded ${{
                payload.path
              }}`;
            }} catch (err) {{
              console.error(err);
              statusEl.textContent = 'Load failed';
              alert(err);
            }}
          }}

          async function saveFile() {{
            const path = pathInput.value.trim();
            statusEl.textContent = 'Saving...';
            try {{
              const res = await fetch('/dev/save_file', {{
                method: 'POST',
                headers: {{
                  'Content-Type': 'application/json',
                  ...authHeaders(),
                }},
                body: JSON.stringify({{ path, content: editor.getValue() }})
              }});
              if (!res.ok) throw new Error(await res.text());
              statusEl.textContent = 'Saved';
            }} catch (err) {{
              console.error(err);
              statusEl.textContent = 'Save failed';
              alert(err);
            }}
          }}

          async function reloadBackend() {{
            const modules = prompt('Modules to reload (comma separated)', 'backend.main');
            if (!modules) return;
            statusEl.textContent = 'Reloading...';
            try {{
              const res = await fetch('/dev/reload', {{
                method: 'POST',
                headers: {{
                  'Content-Type': 'application/json',
                  ...authHeaders(),
                }},
                body: JSON.stringify({{ modules: modules.split(',').map((m) => m.trim()).filter(Boolean) }})
              }});
              if (!res.ok) throw new Error(await res.text());
              const payload = await res.json();
              statusEl.textContent = `Reloaded: ${payload.modules.join(', ')}`;
            }} catch (err) {{
              console.error(err);
              statusEl.textContent = 'Reload failed';
              alert(err);
            }}
          }}
        </script>
      </body>
    </html>
    """

    return HTMLResponse(content=html)


@router.websocket("/logs")
async def live_logs(websocket: WebSocket) -> None:
    await dev_access.require_websocket(websocket)
    await websocket.accept()
    queue = log_broadcaster.register()
    try:
        await websocket.send_text("connected")
        while True:
            message = await queue.get()
            await websocket.send_text(message)
    except WebSocketDisconnect:
        pass
    finally:
        log_broadcaster.unregister(queue)
