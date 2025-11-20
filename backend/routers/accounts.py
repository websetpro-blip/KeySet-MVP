# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from core.app_paths import PROFILES, ensure_runtime
from core.db import SessionLocal
from core.models import Account, ProfileSlot
from services import accounts as account_service
from services.accounts import autologin_account, get_cookies_status
from services.chrome_launcher_directparser import ChromeLauncherDirectParser
from services.chrome_launcher import ChromeLauncher
from utils.proxy import proxy_to_playwright

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class ApiAccount(BaseModel):
    id: int
    name: str
    profile_path: str
    proxy: str | None = None
    proxy_id: str | None = None
    proxy_strategy: str | None = None
    status: str
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_used_at: datetime | None = None
    cookies_status: str | None = None
    active_slot_id: int | None = None


class AccountCreate(BaseModel):
    name: str = Field(..., min_length=3)
    profile_path: str = Field(..., min_length=1)
    proxy: str | None = None
    notes: str | None = None
    proxy_id: str | None = None
    proxy_strategy: str = "fixed"
    captcha_key: str | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    profile_path: str | None = None
    proxy: str | None = None
    notes: str | None = None
    status: str | None = None
    proxy_id: str | None = None
    proxy_strategy: str | None = None
    last_used_at: datetime | None = None
    captcha_key: str | None = None


class LaunchOptions(BaseModel):
    cdp_port: int | None = None
    start_url: str | None = None
    proxy_override: str | None = None


class LaunchResponse(BaseModel):
    status: str
    account_id: int
    message: str
    cdp_port: int


class BulkLaunchRequest(BaseModel):
    ids: List[int] = Field(..., min_items=1)
    start_url: str | None = None
    base_port: int | None = None


class BulkLaunchResponse(BaseModel):
    results: List[LaunchResponse]


class UploadCookiesResponse(BaseModel):
    status: str
    path: str


class ProfilesRootResponse(BaseModel):
    status: str
    path: str


def _open_path(target: Path) -> None:
    """Открыть файл или папку в проводнике текущей ОС."""
    try:
        if os.name == "nt":  # Windows
            os.startfile(str(target))  # type: ignore[attr-defined]
        else:
            subprocess.Popen(["xdg-open", str(target)])
    except Exception as exc:  # pragma: no cover - зависит от ОС
        raise HTTPException(
            status_code=500,
            detail=f"Не удалось открыть путь {target}: {exc}",
        ) from exc


def _resolve_profiles_root() -> Path:
    """
    Определить корневую папку профилей для открытия из UI.

    Приоритет:
    1. runtime/.profiles внутри текущей сборки (PROFILES)
    2. C:/AI/yandex/.profiles (историческое расположение рабочих профилей)
    """
    if PROFILES.exists():
        return PROFILES
    legacy_root = ChromeLauncher.BASE_DIR / ".profiles"
    if legacy_root.exists():
        return legacy_root
    return PROFILES


def _serialize_account(account) -> ApiAccount:
    return ApiAccount(
        id=int(account.id),
        name=str(account.name),
        profile_path=str(account.profile_path or ""),
        proxy=str(account.proxy) if getattr(account, "proxy", None) else None,
        proxy_id=getattr(account, "proxy_id", None),
        proxy_strategy=getattr(account, "proxy_strategy", None),
        status=str(account.status or "ok"),
        notes=str(account.notes) if getattr(account, "notes", None) else None,
        created_at=getattr(account, "created_at", None),
        updated_at=getattr(account, "updated_at", None),
        last_used_at=getattr(account, "last_used_at", None),
        cookies_status=get_cookies_status(account),
        active_slot_id=getattr(account, "active_slot_id", None),
    )


def _serialize_slot(slot: ProfileSlot) -> dict:
    return {
        "id": int(slot.id),
        "name": slot.name,
        "profile_path": slot.profile_path,
        "cookies_file": slot.cookies_file,
        "profile_size": slot.profile_size,
        "cookies_count": slot.cookies_count,
        "last_updated": slot.last_updated.isoformat() if slot.last_updated else None,
        "is_active": bool(slot.is_active),
        "notes": slot.notes,
        "created_at": slot.created_at.isoformat() if slot.created_at else None,
        "updated_at": slot.updated_at.isoformat() if slot.updated_at else None,
    }


def _calc_dir_size(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                continue
    return total


def _resolve_slot_profile_path(account: Account, requested: str | None, slot_name: str) -> Path:
    if requested:
        candidate = Path(requested)
        if candidate.is_absolute():
            return candidate
        return (PROFILES / account.name / candidate).resolve()
    return (PROFILES / account.name / slot_name).resolve()


def _slot_cookies_path(slot: ProfileSlot) -> Path:
    if slot.cookies_file:
        return Path(slot.cookies_file)
    return Path(slot.profile_path) / "cookies" / "cookies.json"


def _safe_remove_profile_dir(path: Path) -> None:
    """Удалить директорию профиля только если она лежит внутри PROFILES."""
    try:
        path.relative_to(PROFILES)
    except Exception:
        return
    shutil.rmtree(path, ignore_errors=True)


def _split_proxy(proxy_value: str | None) -> tuple[str | None, str | None, str | None]:
    """
    Привести строку прокси к формату (server, username, password).

    Используем тот же парсер, что и мультипарсер Wordstat (utils.proxy.proxy_to_playwright),
    чтобы браузер, запущенный кнопкой «Запуск браузера», вел себя так же, как браузер
    внутри TurboParser.
    """
    cfg = proxy_to_playwright(proxy_value)
    if not cfg:
        return None, None, None
    server = cfg.get("server")
    username = cfg.get("username")
    password = cfg.get("password")
    if not server:
        return None, None, None
    return str(server), str(username) if username else None, str(password) if password else None


def _pick_port(preferred: Optional[int]) -> int:
    """Pick a free port for CDP."""
    if preferred and preferred > 1024:
        return preferred
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _get_account_or_404(session, account_id: int) -> Account:
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


def _ensure_single_active_slot(session, account_id: int, active_slot_id: int) -> None:
    session.query(ProfileSlot).filter(ProfileSlot.account_id == account_id).update({"is_active": False})
    session.query(ProfileSlot).filter(
        ProfileSlot.account_id == account_id, ProfileSlot.id == active_slot_id
    ).update({"is_active": True})


def _ensure_fallback_slot(session, account: Account) -> None:
    """Если активный слот отсутствует, выбрать любой существующий."""
    if account.active_slot_id:
        return
    fallback = (
        session.query(ProfileSlot)
        .filter(ProfileSlot.account_id == account.id)
        .order_by(ProfileSlot.id.asc())
        .first()
    )
    if fallback:
        fallback.is_active = True
        account.active_slot_id = fallback.id


def _launch_account(account_id: int, options: LaunchOptions) -> LaunchResponse:
    """
    Запустить браузер для аккаунта через ChromeLauncherDirectParser.

    Используем рабочую логику из keyset-desktop:
    - Playwright launch_persistent_context автоматически обрабатывает прокси-авторизацию
    - Нет попапов с логином/паролем
    - Браузер остаётся открытым в отдельном потоке
    """
    # 1. Получаем аккаунт из БД
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    # 2. Готовим стартовый URL
    start_url = options.start_url or "about:blank"

    # 3. Готовим прокси (тот же парсер, что и в парсере / TurboParser)
    proxy_value = options.proxy_override or getattr(account, "proxy", None)
    proxy_server: str | None = None
    proxy_username: str | None = None
    proxy_password: str | None = None
    if proxy_value:
        cfg = proxy_to_playwright(proxy_value)
        if cfg:
            proxy_server = cfg.get("server")
            proxy_username = cfg.get("username")
            proxy_password = cfg.get("password")

    profile_path_value = str(account.profile_path or "")
    with SessionLocal() as session:
        db_account = session.get(Account, account_id)
        if db_account and db_account.active_slot_id:
            slot = session.get(ProfileSlot, db_account.active_slot_id)
            if slot:
                profile_path_value = slot.profile_path


    # 4. Запускаем Chrome через ChromeLauncherDirectParser (Playwright)
    try:
        ChromeLauncherDirectParser.launch(
            account_name=str(account.name),
            profile_path=profile_path_value,
            proxy_server=proxy_server,
            proxy_username=proxy_username,
            proxy_password=proxy_password,
            start_url=start_url,
        )
        try:
            account_service.set_status(account_id, "ok")
        except Exception as exc:
            print(f"[accounts.launch] failed to update status: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to launch browser: {exc}") from exc

    return LaunchResponse(
        status="ok",
        account_id=account_id,
        message="Browser launched via Playwright",
        cdp_port=0,  # Playwright не использует CDP порт напрямую
    )


@router.get("", response_model=list[ApiAccount])
def list_accounts() -> list[ApiAccount]:
    """Return accounts from the legacy SQLite database."""
    accounts = account_service.list_accounts()
    return [_serialize_account(account) for account in accounts]


@router.post("", response_model=ApiAccount, status_code=201)
def create_account(payload: AccountCreate) -> ApiAccount:
    """Create a new account."""
    account = account_service.create_account(
        name=payload.name,
        profile_path=payload.profile_path,
        proxy=payload.proxy,
        notes=payload.notes,
        proxy_id=payload.proxy_id,
        proxy_strategy=payload.proxy_strategy,
    )
    if payload.captcha_key:
        account = account_service.update_account(account.id, captcha_key=payload.captcha_key)
    return _serialize_account(account)


@router.get("/{account_id}", response_model=ApiAccount)
def get_account(account_id: int) -> ApiAccount:
    """Return one account or 404."""
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _serialize_account(account)


@router.put("/{account_id}", response_model=ApiAccount)
def update_account(account_id: int, payload: AccountUpdate) -> ApiAccount:
    """Update an existing account."""
    data = payload.dict(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update.")
    try:
        account = account_service.update_account(account_id, **data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _serialize_account(account)


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int) -> Response:
    """Delete an account."""
    account_service.delete_account(account_id)
    return Response(status_code=204)


@router.post("/{account_id}/launch", response_model=LaunchResponse)
def launch_account(account_id: int, options: LaunchOptions | None = None) -> LaunchResponse:
    """Launch Chrome for a single account."""
    return _launch_account(account_id, options or LaunchOptions())


@router.post("/launch", response_model=BulkLaunchResponse)
def launch_many(payload: BulkLaunchRequest) -> BulkLaunchResponse:
    """Launch Chrome for multiple accounts sequentially."""
    results: list[LaunchResponse] = []
    base_port = payload.base_port
    for idx, account_id in enumerate(payload.ids):
        opts = LaunchOptions(
            cdp_port=(base_port + idx) if base_port else None,
            start_url=payload.start_url,
        )
        results.append(_launch_account(account_id, opts))
    return BulkLaunchResponse(results=results)


@router.post("/{account_id}/autologin", response_model=dict)
async def trigger_autologin(account_id: int) -> dict:
    """Perform Playwright-based autologin and save storage_state."""
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    result = await autologin_account(account)
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("message", "Autologin failed"))
    return result


@router.get("/{account_id}/slots", response_model=dict)
def get_slots(account_id: int) -> dict:
    """Вернуть список профилей-слотов и активный slot_id."""
    with SessionLocal() as session:
        account = _get_account_or_404(session, account_id)
        slots = (
            session.query(ProfileSlot)
            .filter(ProfileSlot.account_id == account.id)
            .order_by(ProfileSlot.id.asc())
            .all()
        )
        return {
            "slots": [_serialize_slot(slot) for slot in slots],
            "active_slot_id": account.active_slot_id,
        }


@router.post("/{account_id}/slots", response_model=dict)
def create_slot(account_id: int, payload: dict) -> dict:
    """Создать новый слот профиля."""
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    with SessionLocal() as session:
        account = _get_account_or_404(session, account_id)
        resolved_path = _resolve_slot_profile_path(account, payload.get("profile_path"), name)
        resolved_path.mkdir(parents=True, exist_ok=True)

        existing_count = (
            session.query(ProfileSlot).filter(ProfileSlot.account_id == account.id).count()
        )
        slot = ProfileSlot(
            account_id=account.id,
            name=name,
            profile_path=str(resolved_path),
            cookies_file=payload.get("cookies_file"),
            is_active=False,
        )
        session.add(slot)
        session.flush()

        if payload.get("is_active") or existing_count == 0:
            _ensure_single_active_slot(session, account.id, slot.id)
            account.active_slot_id = slot.id
        session.commit()
        session.refresh(slot)

        return {
            "ok": True,
            "slot": _serialize_slot(slot),
            "active_slot_id": account.active_slot_id,
        }


@router.post("/{account_id}/slots/{slot_id}/activate", response_model=dict)
def activate_slot(account_id: int, slot_id: int) -> dict:
    """Сделать слот активным для аккаунта."""
    with SessionLocal() as session:
        account = _get_account_or_404(session, account_id)
        slot = (
            session.query(ProfileSlot)
            .filter(ProfileSlot.account_id == account.id, ProfileSlot.id == slot_id)
            .first()
        )
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        _ensure_single_active_slot(session, account.id, slot.id)
        account.active_slot_id = slot.id
        session.commit()
        return {"ok": True, "active_slot_id": slot.id}


@router.get("/{account_id}/slots/{slot_id}/cookies/export")
def export_slot_cookies(account_id: int, slot_id: int) -> Response:
    """Экспортировать cookies выбранного слота."""
    with SessionLocal() as session:
        _get_account_or_404(session, account_id)
        slot = (
            session.query(ProfileSlot)
            .filter(ProfileSlot.account_id == account_id, ProfileSlot.id == slot_id)
            .first()
        )
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        cookies_path = _slot_cookies_path(slot)
        if not cookies_path.exists():
            raise HTTPException(status_code=404, detail="Cookies file not found")

        content = cookies_path.read_text(encoding="utf-8")
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{slot.name}_cookies.json"'},
        )


@router.post("/{account_id}/slots/{slot_id}/cookies/import", response_model=dict)
async def import_slot_cookies(account_id: int, slot_id: int, file: UploadFile) -> dict:
    """Импортировать cookies в слот."""
    data = await file.read()
    try:
        cookies = json.loads(data.decode("utf-8"))
        if not isinstance(cookies, list):
            raise ValueError("cookies must be list")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid cookies JSON. Ожидается массив cookies.")

    with SessionLocal() as session:
        slot = (
            session.query(ProfileSlot)
            .filter(ProfileSlot.account_id == account_id, ProfileSlot.id == slot_id)
            .first()
        )
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        cookies_path = _slot_cookies_path(slot)
        cookies_path.parent.mkdir(parents=True, exist_ok=True)
        cookies_path.write_text(json.dumps(cookies, ensure_ascii=False, indent=2), encoding="utf-8")

        slot.cookies_file = str(cookies_path)
        slot.cookies_count = len(cookies)
        slot.last_updated = datetime.utcnow()
        slot.profile_size = _calc_dir_size(Path(slot.profile_path))
        session.commit()

        return {"ok": True, "cookies_count": slot.cookies_count, "cookies_file": slot.cookies_file}


@router.delete("/{account_id}/slots/{slot_id}", response_model=dict)
def delete_slot(account_id: int, slot_id: int) -> dict:
    """Удалить слот (с профилем и cookies)."""
    with SessionLocal() as session:
        account = _get_account_or_404(session, account_id)
        slot = (
            session.query(ProfileSlot)
            .filter(ProfileSlot.account_id == account.id, ProfileSlot.id == slot_id)
            .first()
        )
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        slot_path = Path(slot.profile_path)
        was_active = bool(slot.is_active)
        session.delete(slot)
        session.flush()
        if was_active:
            account.active_slot_id = None
            _ensure_fallback_slot(session, account)
        session.commit()

    _safe_remove_profile_dir(slot_path)
    return {"ok": True}


@router.post("/{account_id}/slots/convert-legacy", response_model=dict)
def convert_legacy_profile(account_id: int) -> dict:
    """Конвертировать legacy profile_path аккаунта в слот Default."""
    with SessionLocal() as session:
        account = _get_account_or_404(session, account_id)
        existing = (
            session.query(ProfileSlot).filter(ProfileSlot.account_id == account.id).count()
        )
        if existing:
            return {"ok": True, "message": "Slots already exist"}

        base_path = account.profile_path or ""
        resolved_path = _resolve_slot_profile_path(account, base_path, "default")
        resolved_path.mkdir(parents=True, exist_ok=True)

        slot = ProfileSlot(
            account_id=account.id,
            name="Default",
            profile_path=str(resolved_path),
            is_active=True,
        )
        session.add(slot)
        session.flush()
        account.active_slot_id = slot.id
        session.commit()
        session.refresh(slot)
        return {"ok": True, "slot": _serialize_slot(slot), "active_slot_id": slot.id}


@router.post("/{account_id}/cookies", response_model=UploadCookiesResponse)
async def upload_cookies(account_id: int, file: UploadFile = File(...)) -> UploadCookiesResponse:
    """Upload cookies/storage_state file and store it inside the profile directory."""
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    profile_path = ChromeLauncherDirectParser._resolve_profile(account.profile_path or "")
    profile_path.mkdir(parents=True, exist_ok=True)

    filename = (file.filename or "").lower()
    if filename.endswith(".json"):
        target = profile_path / "storage_state.json"
    else:
        target = profile_path / "cookies.json"

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Файл с куками пустой.")
    target.write_bytes(data)
    return UploadCookiesResponse(status="ok", path=str(target))


@router.delete("/{account_id}/cookies", response_model=UploadCookiesResponse)
def delete_cookies(account_id: int) -> UploadCookiesResponse:
    """Удалить существующие storage_state/cookies файлы из профиля аккаунта."""
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    profile_path = ChromeLauncherDirectParser._resolve_profile(account.profile_path or "")
    profile_path.mkdir(parents=True, exist_ok=True)

    removed: Path | None = None
    for filename in ("storage_state.json", "cookies.json"):
        candidate = profile_path / filename
        if candidate.exists():
            candidate.unlink()
            removed = candidate

    if not removed:
        raise HTTPException(status_code=404, detail="Файлы cookies не найдены для удаления.")

    return UploadCookiesResponse(status="ok", path=str(profile_path))


@router.get("/profiles-root/open", response_model=ProfilesRootResponse)
@router.post("/profiles-root/open", response_model=ProfilesRootResponse)
def open_profiles_root() -> ProfilesRootResponse:
    """Открыть в проводнике папку с профилями браузера."""
    ensure_runtime()
    profiles_dir = _resolve_profiles_root()
    profiles_dir.mkdir(parents=True, exist_ok=True)

    _open_path(profiles_dir)

    return ProfilesRootResponse(status="ok", path=str(profiles_dir))


@router.post("/{account_id}/profile/open", response_model=ProfilesRootResponse)
def open_account_profile(account_id: int) -> ProfilesRootResponse:
    """Открыть конкретную папку профиля аккаунта."""
    ensure_runtime()
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    profile_path = ChromeLauncherDirectParser._resolve_profile(account.profile_path or "")
    profile_path.mkdir(parents=True, exist_ok=True)
    _open_path(profile_path)
    return ProfilesRootResponse(status="ok", path=str(profile_path))


@router.post("/{account_id}/profile/ensure", response_model=ProfilesRootResponse)
def ensure_account_profile(account_id: int) -> ProfilesRootResponse:
    """Создать (если нужно) папку профиля аккаунта без её открытия."""
    ensure_runtime()
    try:
        account = account_service.get_account(account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    profile_path = ChromeLauncherDirectParser._resolve_profile(account.profile_path or "")
    profile_path.mkdir(parents=True, exist_ok=True)
    return ProfilesRootResponse(status="ok", path=str(profile_path))


__all__ = ["router"]
