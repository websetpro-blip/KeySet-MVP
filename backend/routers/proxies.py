from __future__ import annotations

import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import Optional, List

import requests
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from services.accounts import (
    test_proxy as test_proxy_service,
    set_account_proxy,
    list_accounts,
)
from services.proxy_manager import ProxyManager, Proxy as ManagerProxy, _normalize_server
from services.proxy_parsers import parse_proxies_from_sources
from services.proxy_blacklist import ProxyBlacklist
from utils.proxy import proxy_to_playwright
from utils.text_fix import fix_mojibake

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proxies", tags=["proxies"])
legacy_router = APIRouter(prefix="/api/proxy", tags=["proxies"])
px6_router = APIRouter(prefix="/api/proxy/px6", tags=["proxy6"])


class ProxyTestRequest(BaseModel):
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    username: Optional[str] = None
    password: Optional[str] = None
    proxy_type: str = "http"


class ProxyTestResponse(BaseModel):
    status: str
    proxy: str
    response_time_ms: float | None = None
    ip: str | None = None
    error: str | None = None


class ProxyItem(BaseModel):
    id: str
    label: str
    type: str
    server: str
    username: Optional[str] = None
    password: Optional[str] = None
    geo: Optional[str] = None
    sticky: bool = True
    max_concurrent: int = 10
    enabled: bool = True
    notes: str = ""
    last_check: float | None = None
    last_ip: str | None = None
    provider: str | None = None
    external_id: str | None = None
    expires_at: float | None = None


class ProxyListResponse(BaseModel):
    status: str
    items: List[ProxyItem]


class ProxyAssignRequest(BaseModel):
    account_id: int
    proxy_id: Optional[str] = None
    strategy: str = "fixed"


class ProxyAssignResponse(BaseModel):
    status: str
    account_id: int
    proxy_id: Optional[str]
    strategy: str


class ProxyCreateRequest(BaseModel):
    label: str = Field(..., min_length=1)
    server: str = Field(..., min_length=1)
    type: str = Field("http", pattern="^(http|https|socks5)$")
    username: Optional[str] = None
    password: Optional[str] = None
    geo: Optional[str] = None
    sticky: bool = True
    max_concurrent: int = Field(10, ge=0)
    enabled: bool = True
    notes: str = ""


class ProxyUpdateRequest(BaseModel):
    label: Optional[str] = None
    server: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(http|https|socks5)$")
    username: Optional[str] = None
    password: Optional[str] = None
    geo: Optional[str] = None
    sticky: Optional[bool] = None
    max_concurrent: Optional[int] = Field(None, ge=0)
    enabled: Optional[bool] = None
    notes: Optional[str] = None


class ProxyParseRequest(BaseModel):
    sources: List[str] = Field(..., min_items=1)
    protocol: str = Field("http", pattern="^(http|https|socks5)$")
    country: Optional[str] = None
    count: int = Field(20, ge=1, le=500)


class ProxyParseResponse(BaseModel):
    success: bool
    found: int
    valid: int
    added: int
    items: List[ProxyItem]


class ProxyBulkRequest(BaseModel):
    ids: Optional[List[str]] = None


class ProxyTestAllResponse(BaseModel):
    success: bool
    tested: int
    ok: int
    failed: int


class Px6AccountRequest(BaseModel):
    api_key: str = Field(..., min_length=10)


class Px6AccountResponse(BaseModel):
    user_id: str
    balance: float
    currency: str


class Px6OptionsRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    version: int = Field(6, ge=3, le=6)


class Px6OptionsResponse(BaseModel):
    countries: List[str]


class Px6PriceRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    version: int = Field(6, ge=3, le=6)
    count: int = Field(..., ge=1, le=1000)
    period: int = Field(..., ge=1, le=365)


class Px6PriceResponse(BaseModel):
    price: float
    priceSingle: float
    currency: str


class Px6BuyRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    country: str = Field(..., min_length=2, max_length=2)
    version: int = Field(6, ge=3, le=6)
    type: str = Field("http", pattern="^(http|socks)$")
    count: int = Field(..., ge=1, le=1000)
    period: int = Field(..., ge=1, le=365)
    autoProlong: bool = False
    descr: str | None = Field(None, max_length=50)


class Px6BuyResponse(BaseModel):
    proxies: List[ProxyItem]


class Px6SyncRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    state: str | None = Field("active")


class Px6SyncResponse(BaseModel):
    proxies: List[ProxyItem]


class Px6ProlongRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    proxyIds: List[str] = Field(..., min_items=1)
    period: int = Field(..., ge=1, le=365)


class Px6DeleteRequest(BaseModel):
    apiKey: str = Field(..., min_length=10)
    proxyIds: List[str] = Field(..., min_items=1)


class Px6SimpleResponse(BaseModel):
    status: str


class Px6DistributeRequest(BaseModel):
    accountIds: Optional[List[int]] = None
    allWithoutProxy: bool = False


class Px6DistributeResponse(BaseModel):
    status: str
    assigned: int


def _proxy_to_item(proxy: ManagerProxy) -> ProxyItem:
    return ProxyItem(
        id=proxy.id,
        label=fix_mojibake(proxy.label) or "",
        type=proxy.type,
        server=fix_mojibake(proxy.server) or proxy.server,
        username=proxy.username,
        password=proxy.password,
        geo=fix_mojibake(proxy.geo) if proxy.geo else None,
        sticky=proxy.sticky,
        max_concurrent=proxy.max_concurrent,
        enabled=proxy.enabled,
        notes=fix_mojibake(proxy.notes) or "",
        last_check=proxy.last_check,
        last_ip=proxy.last_ip,
        provider=proxy.provider,
        external_id=proxy.external_id,
        expires_at=proxy.expires_at,
    )


@px6_router.post("/account", response_model=Px6AccountResponse)
def px6_account_info(payload: Px6AccountRequest) -> Px6AccountResponse:
    """
    Проверка PX6 API key и получение баланса аккаунта.
    """
    api_key = payload.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    url = f"https://px6.link/api/{api_key}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover - зависит от сети/окружения
        logger.error("[PX6] Ошибка запроса account: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось связаться с PX6") from exc

    status = str(data.get("status", "")).lower()
    if status != "yes":
        error_msg = data.get("error") or "PX6 вернул ошибку"
        raise HTTPException(status_code=400, detail=error_msg)

    # Нормализуем баланс к float, PX6 может вернуть строку
    raw_balance = str(data.get("balance") or "0").replace(",", ".")
    try:
        balance = float(raw_balance)
    except ValueError:
        balance = 0.0

    currency = str(data.get("currency") or "RUB")
    user_id = str(data.get("user_id") or "")

    return Px6AccountResponse(user_id=user_id, balance=balance, currency=currency)


@px6_router.post("/options", response_model=Px6OptionsResponse)
def px6_options(payload: Px6OptionsRequest) -> Px6OptionsResponse:
    """
    Получить список стран PX6 для указанной версии (IPv4/Shared/IPv6).
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    url = f"https://px6.link/api/{api_key}/getcountry/?version={payload.version}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса getcountry: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось получить список стран PX6") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    countries = [str(code).lower() for code in data.get("list", [])]
    return Px6OptionsResponse(countries=countries)


@px6_router.post("/price", response_model=Px6PriceResponse)
def px6_price(payload: Px6PriceRequest) -> Px6PriceResponse:
    """
    Посчитать цену заказа PX6.
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    params = {
        "count": payload.count,
        "period": payload.period,
        "version": payload.version,
    }
    url = f"https://px6.link/api/{api_key}/getprice/"
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса getprice: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось получить цену PX6") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    raw_price = str(data.get("price") or "0").replace(",", ".")
    raw_single = str(data.get("price_single") or "0").replace(",", ".")
    try:
        price = float(raw_price)
    except ValueError:
        price = 0.0
    try:
        price_single = float(raw_single)
    except ValueError:
        price_single = 0.0

    currency = str(data.get("currency") or "RUB")
    return Px6PriceResponse(price=price, priceSingle=price_single, currency=currency)


@px6_router.post("/buy", response_model=Px6BuyResponse)
def px6_buy(payload: Px6BuyRequest) -> Px6BuyResponse:
    """
    Купить прокси PX6 и добавить их в пул ProxyManager.
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    params: dict[str, object] = {
        "count": payload.count,
        "period": payload.period,
        "country": payload.country.lower(),
        "version": payload.version,
        "type": payload.type,
        "auto_prolong": 1 if payload.autoProlong else 0,
    }
    if payload.descr:
        params["descr"] = payload.descr

    url = f"https://px6.link/api/{api_key}/buy/"
    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса buy: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось купить прокси PX6") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    manager = ProxyManager.instance()
    created: List[ProxyItem] = []

    items = data.get("list") or []
    if isinstance(items, dict):
        items = list(items.values())

    for item in items:
        try:
            ip = str(item.get("ip") or item.get("host"))
            port = int(item.get("port"))
            user = item.get("user") or None
            pwd = item.get("pass") or None
            ptype = str(item.get("type") or payload.type or "http").lower()
            if ptype == "socks":
                ptype = "socks5"
            country = str(item.get("country") or payload.country).upper()
            external_id = str(item.get("id"))
        except Exception:
            continue

        server = f"{ptype}://{ip}:{port}"
        label = f"PX6 {country} {ip}:{port}"
        raw_end = item.get("date_end")
        expires_at: float | None = None
        if raw_end:
            raw_str = str(raw_end)
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(raw_str, fmt)
                    expires_at = dt.timestamp()
                    break
                except ValueError:
                    continue

        proxy = ManagerProxy(
            id=str(uuid.uuid4()),
            label=label,
            type=ptype,
            server=server,
            username=user,
            password=pwd,
            geo=country,
            sticky=True,
            max_concurrent=10,
            enabled=True,
            notes="PX6",
            provider="px6",
            external_id=external_id,
            expires_at=expires_at,
        )
        manager.upsert(proxy)
        created.append(_proxy_to_item(proxy))

    return Px6BuyResponse(proxies=created)


@px6_router.post("/sync", response_model=Px6SyncResponse)
def px6_sync(payload: Px6SyncRequest) -> Px6SyncResponse:
    """
    Синхронизация списка PX6-прокси с локальным ProxyManager.
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    params: dict[str, object] = {}
    if payload.state:
        state = str(payload.state).lower()
        if state not in {"active", "expired", "expiring", "all"}:
            raise HTTPException(status_code=400, detail="Некорректное значение state PX6")
        params["state"] = state

    url = f"https://px6.link/api/{api_key}/getproxy/"
    try:
        response = requests.get(url, params=params or None, timeout=20)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса getproxy: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось получить список PX6-прокси") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    items = data.get("list") or {}
    manager = ProxyManager.instance()

    existing = manager.list(include_disabled=True)
    by_external: dict[str, ManagerProxy] = {}
    for proxy in existing:
        if proxy.provider == "px6" and proxy.external_id:
            by_external[str(proxy.external_id)] = proxy

    if isinstance(items, dict):
        iterable = items.items()
    else:
        iterable = [(str(entry.get("id")), entry) for entry in items]

    for raw_id, item in iterable:
        if not isinstance(item, dict):
            continue
        external_id = str(item.get("id") or raw_id)
        try:
            ip = str(item.get("ip") or item.get("host"))
            port = int(item.get("port"))
            user = item.get("user") or None
            pwd = item.get("pass") or None
            ptype = str(item.get("type") or "http").lower()
            if ptype == "socks":
                ptype = "socks5"
            country = str(item.get("country") or "").upper() or None
            active = bool(item.get("active", True))
            raw_end = item.get("date_end")
        except Exception:
            continue

        server = f"{ptype}://{ip}:{port}"
        label = f"PX6 {country or ''} {ip}:{port}".strip()

        expires_at: float | None = None
        if raw_end:
            raw_str = str(raw_end)
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    dt = datetime.strptime(raw_str, fmt)
                    expires_at = dt.timestamp()
                    break
                except ValueError:
                    continue

        existing_proxy = by_external.get(external_id)
        if existing_proxy is not None:
            existing_proxy.server = server
            existing_proxy.type = ptype
            existing_proxy.username = user
            existing_proxy.password = pwd
            existing_proxy.geo = country
            existing_proxy.enabled = active
            existing_proxy.provider = "px6"
            existing_proxy.external_id = external_id
            existing_proxy.expires_at = expires_at
            manager.upsert(existing_proxy)
        else:
            proxy = ManagerProxy(
                id=str(uuid.uuid4()),
                label=label,
                type=ptype,
                server=server,
                username=user,
                password=pwd,
                geo=country,
                sticky=True,
                max_concurrent=10,
                enabled=active,
                notes="PX6",
                provider="px6",
                external_id=external_id,
                expires_at=expires_at,
            )
            manager.upsert(proxy)

    # Возвращаем только PX6-прокси после синхронизации
    refreshed = [
        _proxy_to_item(proxy)
        for proxy in manager.list(include_disabled=True)
        if proxy.provider == "px6"
    ]
    return Px6SyncResponse(proxies=refreshed)


@px6_router.post("/prolong", response_model=Px6SimpleResponse)
def px6_prolong(payload: Px6ProlongRequest) -> Px6SimpleResponse:
    """
    Продлить выбранные PX6-прокси на указанный срок.
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    manager = ProxyManager.instance()
    proxies: list[ManagerProxy] = []
    for proxy_id in payload.proxyIds:
        proxy = manager.get(proxy_id)
        if proxy and proxy.provider == "px6" and proxy.external_id:
            proxies.append(proxy)

    if not proxies:
        raise HTTPException(status_code=400, detail="Не найдены PX6-прокси для продления")

    external_ids = sorted({str(p.external_id) for p in proxies if p.external_id})
    params = {
        "ids": ",".join(external_ids),
        "period": payload.period,
    }

    url = f"https://px6.link/api/{api_key}/prolong/"
    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса prolong: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось продлить PX6-прокси") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    items = data.get("list") or {}
    if isinstance(items, dict):
        iterable = items.items()
    else:
        iterable = [(str(entry.get("id")), entry) for entry in items]

    by_external = {str(p.external_id): p for p in proxies if p.external_id}

    for raw_id, item in iterable:
        if not isinstance(item, dict):
            continue
        external_id = str(item.get("id") or raw_id)
        proxy = by_external.get(external_id)
        if proxy is None:
            continue
        raw_end = item.get("date_end")
        if not raw_end:
            continue
        raw_str = str(raw_end)
        expires_at: float | None = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(raw_str, fmt)
                expires_at = dt.timestamp()
                break
            except ValueError:
                continue
        if expires_at:
            proxy.expires_at = expires_at
            manager.upsert(proxy)

    return Px6SimpleResponse(status="success")


@px6_router.post("/delete", response_model=Px6SimpleResponse)
def px6_delete(payload: Px6DeleteRequest) -> Px6SimpleResponse:
    """
    Удалить выбранные PX6-прокси в кабинете PX6 и локальном пуле.
    """
    api_key = payload.apiKey.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API key PX6 не указан")

    manager = ProxyManager.instance()
    proxies: list[ManagerProxy] = []
    for proxy_id in payload.proxyIds:
        proxy = manager.get(proxy_id)
        if proxy and proxy.provider == "px6" and proxy.external_id:
            proxies.append(proxy)

    if not proxies:
        raise HTTPException(status_code=400, detail="Не найдены PX6-прокси для удаления")

    external_ids = sorted({str(p.external_id) for p in proxies if p.external_id})
    params = {
        "ids": ",".join(external_ids),
    }

    url = f"https://px6.link/api/{api_key}/delete/"
    try:
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:  # pragma: no cover
        logger.error("[PX6] Ошибка запроса delete: %s", exc)
        raise HTTPException(status_code=502, detail="Не удалось удалить PX6-прокси") from exc

    if str(data.get("status", "")).lower() != "yes":
        raise HTTPException(status_code=400, detail=data.get("error") or "PX6 вернул ошибку")

    for proxy in proxies:
        manager.delete(proxy.id)

    return Px6SimpleResponse(status="success")


@router.post("/px6/distribute", response_model=Px6DistributeResponse)
def distribute_px6_proxies(payload: Px6DistributeRequest) -> Px6DistributeResponse:
    """
    Распределить PX6-прокси по аккаунтам.

    Если переданы accountIds, берём только эти аккаунты (без уже назначенного proxy_id).
    Иначе, если allWithoutProxy=True или ничего не передано, берём все аккаунты без proxy_id.
    """
    accounts = list_accounts()

    # Целевые аккаунты: без proxy_id
    target_ids: set[int]
    if payload.accountIds:
        target_ids = {int(x) for x in payload.accountIds}
        target_accounts = [acc for acc in accounts if acc.id in target_ids and not getattr(acc, "proxy_id", None)]
    else:
        target_accounts = [acc for acc in accounts if not getattr(acc, "proxy_id", None)]

    if not target_accounts:
        return Px6DistributeResponse(status="success", assigned=0)

    manager = ProxyManager.instance()
    all_proxies = manager.list(include_disabled=True)

    used_proxy_ids: set[str] = {
        str(acc.proxy_id)
        for acc in accounts
        if getattr(acc, "proxy_id", None)
    }

    available_px6: list[ManagerProxy] = [
        proxy
        for proxy in all_proxies
        if proxy.provider == "px6" and proxy.enabled and proxy.id not in used_proxy_ids
    ]

    assigned = 0
    for account, proxy in zip(target_accounts, available_px6):
        try:
            set_account_proxy(account.id, proxy.id, "fixed")
            assigned += 1
        except Exception as exc:  # pragma: no cover - защитное логирование
            logger.warning(
                "[PX6] Не удалось назначить прокси %s аккаунту %s: %s",
                proxy.id,
                account.id,
                exc,
            )

    return Px6DistributeResponse(status="success", assigned=assigned)


@router.post("/test", response_model=ProxyTestResponse)
async def test_proxy(payload: ProxyTestRequest) -> ProxyTestResponse:
    """
    Тест подключения к прокси.

    Собирает строку вида protocol://[username:password@]host:port
    и передаёт её в services.accounts.test_proxy, чтобы
    проверить доступность прокси с машины пользователя.
    """
    auth = ""
    if payload.username or payload.password:
        user = payload.username or ""
        pwd = payload.password or ""
        auth = f"{user}:{pwd}@"

    proxy_uri = f"{payload.proxy_type}://{auth}{payload.host}:{payload.port}"

    started = time.perf_counter()
    result = await test_proxy_service(proxy_uri)
    elapsed_ms = (time.perf_counter() - started) * 1000.0

    if result.get("ok"):
        return ProxyTestResponse(
            status="ok",
            proxy=proxy_uri,
            response_time_ms=elapsed_ms,
            ip=result.get("ip"),
        )

    return ProxyTestResponse(
        status="error",
        proxy=proxy_uri,
        response_time_ms=elapsed_ms,
        error=result.get("error") or "Не удалось протестировать прокси",
    )


@router.get("", response_model=ProxyListResponse)
def list_proxies() -> ProxyListResponse:
    manager = ProxyManager.instance()
    items = manager.list(include_disabled=True)

    logger.info(f"[list_proxies] Всего прокси в ProxyManager: {len(items)}")

    # Не показываем в пуле менеджера "основные" прокси,
    # которые вручную прописаны у аккаунтов ЕСЛИ они НЕ из пула (т.е. без proxy_id)
    try:
        account_proxy_servers: set[str] = set()
        for acc in list_accounts():
            # Пропускаем аккаунты у которых указан proxy_id - они используют пул
            if getattr(acc, "proxy_id", None):
                continue

            raw = (getattr(acc, "proxy", None) or "").strip()
            if not raw:
                continue
            parsed = proxy_to_playwright(raw)
            if not parsed or not parsed.get("server"):
                continue
            account_proxy_servers.add(parsed["server"])

        logger.info(f"[list_proxies] Прокси вручную у аккаунтов (без proxy_id): {len(account_proxy_servers)}")

        if account_proxy_servers:
            items = [p for p in items if p.server not in account_proxy_servers]

        logger.info(f"[list_proxies] После фильтрации: {len(items)} прокси")
    except Exception as exc:  # pragma: no cover - защитное логирование
        logger.warning("[ПРОКСИ] Не удалось отфильтровать аккаунт-прокси: %s", exc)

    return ProxyListResponse(
        status="success",
        items=[_proxy_to_item(p) for p in items],
    )


@router.post("", response_model=ProxyItem, status_code=201)
def create_proxy(payload: ProxyCreateRequest) -> ProxyItem:
    manager = ProxyManager.instance()
    proxy = ManagerProxy(
        id=str(uuid.uuid4()),
        label=payload.label.strip() or payload.server,
        type=payload.type or "http",
        server=payload.server,
        username=payload.username or None,
        password=payload.password or None,
        geo=payload.geo or None,
        sticky=payload.sticky,
        max_concurrent=payload.max_concurrent,
        enabled=payload.enabled,
        notes=payload.notes or "",
    )
    manager.upsert(proxy)
    return _proxy_to_item(proxy)


@router.put("/{proxy_id}", response_model=ProxyItem)
def update_proxy(proxy_id: str, payload: ProxyUpdateRequest) -> ProxyItem:
    manager = ProxyManager.instance()
    proxy = manager.get(proxy_id)
    if proxy is None:
        raise HTTPException(status_code=404, detail="Прокси не найден")

    data = payload.dict(exclude_unset=True)
    if not data:
        return _proxy_to_item(proxy)

    server_dirty = False
    if "label" in data and data["label"]:
        proxy.label = data["label"]
    if "server" in data and data["server"]:
        proxy.server = data["server"]
        server_dirty = True
    if "type" in data and data["type"]:
        proxy.type = data["type"]
        server_dirty = True
    if "username" in data:
        proxy.username = data["username"] or None
    if "password" in data:
        proxy.password = data["password"] or None
    if "geo" in data:
        proxy.geo = data["geo"] or None
    if "sticky" in data:
        proxy.sticky = data["sticky"]
    if "max_concurrent" in data:
        proxy.max_concurrent = int(data["max_concurrent"] or 0)
    if "enabled" in data:
        proxy.enabled = data["enabled"]
    if "notes" in data:
        proxy.notes = data["notes"] or ""

    if server_dirty:
        proxy.server = _normalize_server(proxy.type, proxy.server)

    manager.upsert(proxy)
    return _proxy_to_item(proxy)


@router.delete("/{proxy_id}", status_code=204, response_class=Response)
def delete_proxy(proxy_id: str) -> Response:
    manager = ProxyManager.instance()
    proxy = manager.get(proxy_id)
    if proxy is None:
        raise HTTPException(status_code=404, detail="Прокси не найден")
    manager.delete(proxy_id)
    return Response(status_code=204)


@router.post("/assign", response_model=ProxyAssignResponse)
def assign_proxy(payload: ProxyAssignRequest) -> ProxyAssignResponse:
    manager = ProxyManager.instance()
    if payload.proxy_id:
        proxy = manager.get(payload.proxy_id)
        if proxy is None:
            raise HTTPException(status_code=404, detail="Прокси не найден")
    account = set_account_proxy(payload.account_id, payload.proxy_id, payload.strategy or "fixed")
    return ProxyAssignResponse(
        status="success",
        account_id=account.id,
        proxy_id=account.proxy_id,
        strategy=account.proxy_strategy,
    )


@router.post("/parse", response_model=ProxyParseResponse)
async def parse_proxies(payload: ProxyParseRequest) -> ProxyParseResponse:
    """
    Парсит прокси из указанных источников и сохраняет их в ProxyManager.

    Поддерживаемые источники:
    - fineproxy / fineproxy.org
    - proxyelite / proxyelite.com
    - htmlweb / htmlweb.ru
    - advanced.name / advanced
    - proxy.market / proxymarket
    """
    sources_str = ", ".join(payload.sources)
    logger.info(
        f"[ПРОКСИ] Начат парсинг прокси: источники=[{sources_str}], "
        f"протокол={payload.protocol}, страна={payload.country or 'любая'}, "
        f"количество={payload.count}"
    )

    manager = ProxyManager.instance()

    # Получить существующие прокси для проверки дубликатов
    existing = manager.list(include_disabled=True)
    existing_keys = {
        (p.server, p.username, p.password)
        for p in existing
    }

    # Парсить прокси из источников
    result = await parse_proxies_from_sources(
        sources=payload.sources,
        protocol=payload.protocol.lower(),
        country=payload.country,
        count=payload.count,
    )

    # Сохранить только новые прокси (избегаем дубликатов с существующими)
    added = 0
    duplicates = 0
    for proxy in result.proxies:
        key = (proxy.server, proxy.username, proxy.password)
        if key not in existing_keys:
            manager.upsert(proxy)
            existing_keys.add(key)
            added += 1
        else:
            duplicates += 1

    logger.info(
        f"[ПРОКСИ] Парсинг завершен: найдено={result.found}, "
        f"валидных={result.valid}, добавлено={added}, дубликатов={duplicates}"
    )

    if result.errors:
        logger.warning(f"[ПРОКСИ] Ошибки при парсинге: {', '.join(result.errors[:3])}")

    return ProxyParseResponse(
        success=result.added > 0 or len(result.errors) == 0,
        found=result.found,
        valid=result.valid,
        added=added,
        items=[_proxy_to_item(proxy) for proxy in result.proxies],
    )


@router.post("/test-all", response_model=ProxyTestAllResponse)
async def test_all_proxies(payload: ProxyBulkRequest | None = None) -> ProxyTestAllResponse:
    manager = ProxyManager.instance()
    proxies = manager.list(include_disabled=True)
    ids = set(payload.ids) if payload and payload.ids else None
    if ids:
        proxies = [proxy for proxy in proxies if proxy.id in ids]

    total = len(proxies)
    ok = 0

    blacklist = ProxyBlacklist.instance()

    # Параллельное тестирование (до 50 одновременно)
    async def test_one(proxy: ManagerProxy):
        try:
            uri = proxy.uri(include_credentials=True)
            result = await test_proxy_service(uri)
            return (proxy, result)
        except Exception:
            return (proxy, None)

    semaphore = asyncio.Semaphore(50)
    
    async def test_with_limit(p):
        async with semaphore:
            return await test_one(p)

    tasks = [asyncio.create_task(test_with_limit(proxy)) for proxy in proxies]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            continue

        proxy, test_result = result
        
        if test_result and test_result.get("ok"):
            ok += 1
            proxy.last_ip = test_result.get("ip")
            proxy.last_check = time.time()
            proxy.enabled = True
            manager.upsert(proxy)
        else:
            # Добавляем в blacklist и удаляем
            try:
                server_parts = proxy.server.split("://")[1].split(":")
                ip = server_parts[0]
                port = int(server_parts[1]) if len(server_parts) > 1 else 80
                blacklist.add(ip, port)
            except Exception:
                pass
            
            proxy.last_check = time.time()
            manager.delete(proxy.id)

    return ProxyTestAllResponse(
        success=True,
        tested=total,
        ok=ok,
        failed=max(0, total - ok),
    )


@router.post("/clear", response_model=dict)
def clear_proxies(payload: ProxyBulkRequest | None = None) -> dict:
    manager = ProxyManager.instance()
    proxies = manager.list(include_disabled=True)
    ids = set(payload.ids) if payload and payload.ids else None
    removed = 0
    for proxy in proxies:
        if ids is None or proxy.id in ids:
            manager.delete(proxy.id)
            removed += 1
    return {"status": "success", "removed": removed}


def _register_legacy_routes() -> None:
    legacy_router.add_api_route(
        "",
        list_proxies,
        methods=["GET"],
        response_model=ProxyListResponse,
    )
    legacy_router.add_api_route(
        "",
        create_proxy,
        methods=["POST"],
        response_model=ProxyItem,
    )
    legacy_router.add_api_route(
        "/{proxy_id}",
        update_proxy,
        methods=["PUT"],
        response_model=ProxyItem,
    )
    legacy_router.add_api_route(
        "/{proxy_id}",
        delete_proxy,
        methods=["DELETE"],
        status_code=204,
    )
    legacy_router.add_api_route(
        "/assign",
        assign_proxy,
        methods=["POST"],
        response_model=ProxyAssignResponse,
    )
    legacy_router.add_api_route(
        "/parse",
        parse_proxies,
        methods=["POST"],
        response_model=ProxyParseResponse,
    )
    legacy_router.add_api_route(
        "/test",
        test_proxy,
        methods=["POST"],
        response_model=ProxyTestResponse,
    )
    legacy_router.add_api_route(
        "/test-all",
        test_all_proxies,
        methods=["POST"],
        response_model=ProxyTestAllResponse,
    )
    legacy_router.add_api_route(
        "/clear",
        clear_proxies,
        methods=["POST"],
        response_model=dict,
    )


_register_legacy_routes()
