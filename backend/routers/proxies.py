from __future__ import annotations

import logging
import time
import uuid
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from services.accounts import test_proxy as test_proxy_service, set_account_proxy
from services.proxy_manager import ProxyManager, Proxy as ManagerProxy, _normalize_server
from services.proxy_parsers import parse_proxies_from_sources
from utils.text_fix import fix_mojibake

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proxies", tags=["proxies"])
legacy_router = APIRouter(prefix="/api/proxy", tags=["proxies"])


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
    )


@router.post("/test", response_model=ProxyTestResponse)
async def test_proxy(payload: ProxyTestRequest) -> ProxyTestResponse:
    """
    РўРµСЃС‚ РїРѕРґРєР»СЋС‡РµРЅРёСЏ Рє РїСЂРѕРєСЃРё.

    РЎРѕР±РёСЂР°РµС‚ СЃС‚СЂРѕРєСѓ РІРёРґР° protocol://[username:password@]host:port
    Рё РїРµСЂРµРґР°С‘С‚ РµС‘ РІ services.accounts.test_proxy, С‡С‚РѕР±С‹
    РїСЂРѕРІРµСЂРёС‚СЊ РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РїСЂРѕРєСЃРё СЃ РјР°С€РёРЅС‹ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
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

    for proxy in proxies:
        try:
            uri = proxy.uri(include_credentials=True)
            result = await test_proxy_service(uri)
            if result.get("ok"):
                ok += 1
                proxy.last_ip = result.get("ip")
                proxy.last_check = time.time()
                proxy.enabled = True
            else:
                proxy.enabled = False
            manager.upsert(proxy)
        except Exception:
            proxy.enabled = False
            proxy.last_check = time.time()
            manager.upsert(proxy)

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


