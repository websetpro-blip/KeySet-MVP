from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from keyset.core.regions import Region, load_regions
from keyset.services import accounts as accounts_service
from keyset.services import proxy_check, sessions as sessions_service, wordstat_ws
from keyset.services.browser_factory import for_account
from keyset.services.chrome_launcher import ChromeLauncher
from keyset.services.proxy_manager import ProxyManager
from keyset.workers.left_column_parser import LeftColumnParser

logger = logging.getLogger("keyset.webview.api")


def _dt_to_iso(value: Optional[datetime]) -> Optional[str]:
    if not value:
        return None
    try:
        return value.isoformat()
    except Exception:
        return str(value)


def _serialize_account(account: Any) -> Dict[str, Any]:
    return {
        "id": getattr(account, "id", None),
        "email": getattr(account, "name", None),
        "profilePath": getattr(account, "profile_path", None),
        "status": getattr(account, "status", None),
        "proxy": getattr(account, "proxy", None),
        "proxyId": getattr(account, "proxy_id", None),
        "proxyStrategy": getattr(account, "proxy_strategy", None),
        "notes": getattr(account, "notes", None),
        "lastUsedAt": _dt_to_iso(getattr(account, "last_used_at", None)),
        "createdAt": _dt_to_iso(getattr(account, "created_at", None)),
        "updatedAt": _dt_to_iso(getattr(account, "updated_at", None)),
    }


def _serialize_region(region: Region) -> Dict[str, Any]:
    return {"id": region.id, "name": region.name}


def _normalize_account_patch(patch: Dict[str, Any]) -> Dict[str, Any]:
    key_map = {
        "email": "name",
        "profilePath": "profile_path",
        "proxyId": "proxy_id",
        "proxyStrategy": "proxy_strategy",
        "lastUsedAt": "last_used_at",
        "createdAt": "created_at",
        "updatedAt": "updated_at",
    }
    normalized: Dict[str, Any] = {}
    for key, value in patch.items():
        target = key_map.get(key, key)
        normalized[target] = value
    return normalized


def _resolve_account(account_id: int):
    for item in accounts_service.list_accounts():
        if getattr(item, "id", None) == account_id:
            return item
    raise ValueError(f"Account {account_id} not found")


def _run_left_column(
    account_id: int,
    phrases: Iterable[str],
    *,
    region_id: int,
    min_shows: int,
    max_results: int,
    headless: bool,
) -> Dict[str, Any]:
    account = _resolve_account(account_id)
    phrase_list = [p.strip() for p in phrases if p and str(p).strip()]
    if not phrase_list:
        raise ValueError("phrases list is empty")

    profile_dir = ChromeLauncher._normalise_profile_path(
        account.profile_path, account.name
    )
    profile_dir.mkdir(parents=True, exist_ok=True)

    parser = LeftColumnParser(
        account_name=account.name,
        profile_path=Path(profile_dir),
        phrases=phrase_list,
        headless=headless,
        proxy_uri=getattr(account, "proxy", None),
        region_id=region_id,
        min_shows=min_shows,
        max_results=max_results,
    )

    result = asyncio.run(parser.run())
    return {
        "items": dict(result),
        "meta": getattr(result, "meta", {}),
    }


class Api:
    def __init__(self) -> None:
        ProxyManager.instance()

    def call(self, action: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        payload = payload or {}
        try:
            if action == "accounts.list":
                accounts = accounts_service.list_accounts()
                return {"ok": True, "items": [_serialize_account(acc) for acc in accounts]}

            if action == "accounts.add":
                account = accounts_service.create_account(
                    name=payload.get("email") or payload.get("name"),
                    profile_path=payload.get("profilePath") or payload.get("profile_path", ""),
                    proxy=payload.get("proxy"),
                    notes=payload.get("notes"),
                    proxy_id=payload.get("proxyId"),
                    proxy_strategy=payload.get("proxyStrategy", "fixed"),
                )
                return {"ok": True, "account": _serialize_account(account)}

            if action == "accounts.update":
                account_id = payload.get("id") or payload.get("accountId")
                if not account_id:
                    raise ValueError("account id is required")
                patch = _normalize_account_patch(payload.get("patch") or payload)
                account = accounts_service.update_account(account_id, **patch)
                return {"ok": True, "account": _serialize_account(account)}

            if action == "accounts.delete":
                account_id = payload.get("id") or payload.get("accountId")
                if not account_id:
                    raise ValueError("account id is required")
                accounts_service.delete_account(account_id)
                return {"ok": True}

            if action == "proxy.test":
                proxy_url = payload.get("proxy") or payload.get("proxyUrl")
                timeout = payload.get("timeout", 10)
                result = asyncio.run(proxy_check.test_proxy(proxy_url, timeout=timeout))
                ok_state = result.pop("ok", False)
                return {"ok": ok_state, **result}

            if action == "proxy.assign":
                account_id = payload.get("accountId")
                if not account_id:
                    raise ValueError("accountId is required")
                proxy_uri = payload.get("proxy")
                account = accounts_service.update_account(account_id, proxy=proxy_uri)
                return {"ok": True, "account": _serialize_account(account)}

            if action == "proxy.parse":
                return {"ok": False, "error": "proxy.parse not implemented"}

            if action == "regions.list":
                regions = load_regions()
                return {"ok": True, "items": [_serialize_region(region) for region in regions]}

            if action == "sessions.list":
                sessions = sessions_service.list_sessions()
                items = [
                    {
                        "accountId": row.get("account_id"),
                        "accountName": row.get("account_name"),
                        "profilePath": row.get("profile_path"),
                        "sessionExists": row.get("session_exists"),
                        "status": row.get("status"),
                        "lastUsedAt": _dt_to_iso(row.get("last_used")),
                        "proxy": row.get("proxy"),
                    }
                    for row in sessions
                ]
                return {"ok": True, "items": items}

            if action == "sessions.close":
                account_id = payload.get("accountId") or payload.get("id")
                if not account_id:
                    raise ValueError("accountId is required")
                sessions_service.delete_session(account_id)
                return {"ok": True}

            if action == "accounts.launch":
                account_id = payload.get("accountId")
                if not account_id:
                    raise ValueError("accountId is required")
                region_id = payload.get("regionId")
                headless = bool(payload.get("headless", False))
                handle = for_account(
                    account_id,
                    headless=headless,
                    geo=str(region_id) if region_id is not None else None,
                    target_url=payload.get("targetUrl"),
                )
                port = handle.metadata.get("cdp_port") or handle.metadata.get("port")
                proxy_uri = handle.metadata.get("proxy_uri")
                return {"ok": True, "port": port, "proxy": proxy_uri}

            if action == "ws.run":
                phrases = payload.get("phrases") or []
                if not isinstance(phrases, Iterable):
                    raise ValueError("phrases must be iterable")
                modes = payload.get("modes") or {"ws": True, "qws": False, "bws": False}
                regions = payload.get("regions") or []
                account_name = payload.get("account") or payload.get("accountName")
                results = wordstat_ws.collect_frequency(
                    list(phrases),
                    modes=modes,
                    regions=regions or [payload.get("regionId", 225)],
                    profile=account_name,
                )
                return {"ok": True, "items": results}

            if action == "ws.left":
                phrases = payload.get("phrases") or []
                account_id = payload.get("accountId") or payload.get("id")
                if not account_id:
                    raise ValueError("accountId is required")
                region_id = int(payload.get("regionId", 225))
                min_shows = int(payload.get("minShows", 0))
                max_results = int(payload.get("maxResults", 200))
                headless = bool(payload.get("headless", False))
                data = _run_left_column(
                    account_id,
                    phrases,
                    region_id=region_id,
                    min_shows=min_shows,
                    max_results=max_results,
                    headless=headless,
                )
                return {"ok": True, **data}

            raise ValueError(f"Unknown action: {action}")

        except Exception as exc:
            logger.exception("API call failed for action %s", action)
            return {"ok": False, "error": str(exc)}
