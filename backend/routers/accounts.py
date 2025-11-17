# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import socket
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from core.app_paths import PROFILES, ensure_runtime
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
    1. C:/AI/yandex/.profiles (историческое расположение рабочих профилей)
    2. runtime/profiles внутри текущей сборки (PROFILES)
    """
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
    )


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

    # 4. Запускаем Chrome через ChromeLauncherDirectParser (Playwright)
    try:
        ChromeLauncherDirectParser.launch(
            account_name=str(account.name),
            profile_path=str(account.profile_path or ""),
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
