# -*- coding: utf-8 -*-
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

try:  # pragma: no cover - зависит от установленного софта
    from services import accounts as legacy_accounts
except Exception as exc:  # pragma: no cover
    legacy_accounts = None
    logger.warning("Legacy accounts service unavailable: %s", exc)


router = APIRouter(prefix="/api/accounts", tags=["accounts"])


class AccountPayload(BaseModel):
    id: int
    email: str
    password: str
    secretAnswer: str
    profilePath: str
    status: str
    proxy: str
    proxyUsername: str
    proxyPassword: str
    proxyType: str
    fingerprint: str
    lastLaunch: str
    authStatus: str
    lastLogin: str
    profileSize: str


def _format_relative(value: datetime | None) -> str:
    if not value:
        return "—"
    if value.tzinfo:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    now = datetime.utcnow()
    delta = now - value
    if delta < timedelta(minutes=1):
        return "только что"
    if delta < timedelta(hours=1):
        minutes = max(1, delta.seconds // 60)
        return f"{minutes} мин назад"
    if delta < timedelta(days=1):
        hours = max(1, delta.seconds // 3600)
        return f"{hours} ч назад"
    if delta < timedelta(days=30):
        days = max(1, delta.days)
        return f"{days} дн назад"
    return value.strftime("%Y-%m-%d %H:%M")


def _format_absolute(value: datetime | None) -> str:
    if not value:
        return "—"
    if value.tzinfo:
        value = value.astimezone(timezone.utc)
    return value.strftime("%Y-%m-%d %H:%M")


def _map_status(raw_status: str | None) -> tuple[str, str]:
    """Вернуть (frontend_status, human_label)."""
    status = (raw_status or "ok").lower()
    if status in {"ok"}:
        return "active", "Авторизован"
    if status in {"cooldown"}:
        return "working", "В работе"
    if status in {"captcha"}:
        return "needs_login", "Требуется капча"
    if status in {"banned", "disabled"}:
        return "error", "Заблокирован"
    if status in {"error"}:
        return "error", "Ошибка"
    return "needs_login", "Неизвестно"


def _parse_proxy(proxy: str | None) -> tuple[str, str, str, str]:
    """
    Вернёт (display, username, password, type).

    Тип ограничиваем набором, подходящим под UI (http/https/socks5).
    """
    if not proxy:
        return "", "", "", "http"

    value = proxy.strip()
    candidate = value if "://" in value else f"http://{value}"
    parsed = urlparse(candidate)
    host = parsed.hostname or value
    if parsed.port:
        host = f"{host}:{parsed.port}"

    proxy_type = parsed.scheme.lower() if parsed.scheme else "http"
    if proxy_type not in {"http", "https", "socks5"}:
        proxy_type = "http"

    username = parsed.username or ""
    password = parsed.password or ""

    return host, username, password, proxy_type


def _serialize_account(record: object) -> AccountPayload:
    proxy, proxy_user, proxy_pass, proxy_type = _parse_proxy(getattr(record, "proxy", None))
    status, auth_label = _map_status(getattr(record, "status", None))
    last_used: datetime | None = getattr(record, "last_used_at", None)
    notes = getattr(record, "notes", "") or ""
    profile_path = getattr(record, "profile_path", "") or ""

    return AccountPayload(
        id=int(getattr(record, "id", 0) or 0),
        email=str(getattr(record, "name", "") or ""),
        password="",
        secretAnswer=str(notes),
        profilePath=profile_path,
        status=status,
        proxy=proxy,
        proxyUsername=proxy_user,
        proxyPassword=proxy_pass,
        proxyType=proxy_type,
        fingerprint="no_spoofing",
        lastLaunch=_format_relative(last_used),
        authStatus=auth_label,
        lastLogin=_format_absolute(last_used),
        profileSize="—",
    )


@router.get("", response_model=List[AccountPayload])
def list_accounts() -> List[AccountPayload]:
    """Вернуть аккаунты из старой БД без моков."""
    if legacy_accounts is None:  # pragma: no cover - зависит от окружения
        raise HTTPException(
            status_code=500,
            detail="Сервис аккаунтов недоступен. Убедитесь, что каталог keyset/ присутствует.",
        )
    try:
        rows = legacy_accounts.list_accounts()  # type: ignore[union-attr]
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to load accounts from legacy service: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    payload = [
        _serialize_account(record)
        for record in rows
        if getattr(record, "profile_path", None)
    ]
    return payload


__all__ = ["router"]
