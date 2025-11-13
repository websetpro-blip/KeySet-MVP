from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, Dict, Iterable, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from core.geo import load_region_rows
from services import accounts as legacy_accounts
from services import frequency as frequency_service
from services import wordstat_bridge
from services import wordstat_ws as turbo_wordstat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/wordstat", tags=["wordstat"])


# Pydantic models -------------------------------------------------------------
class AccountPayload(BaseModel):
    id: int
    name: str
    status: str
    profilePath: str
    proxy: str | None = None
    notes: str | None = None


class RegionPayload(BaseModel):
    id: int
    name: str
    path: str
    parentId: int | None
    depth: int
    hasChildren: bool


class WordstatModes(BaseModel):
    ws: bool = True
    qws: bool = False
    bws: bool = False

    @validator("ws", "qws", "bws", pre=True, always=True)
    def _boolify(cls, value: Any) -> bool:  # noqa: D401
        """Ensure truthy/falsy values become booleans."""
        return bool(value)

    def enabled(self) -> Dict[str, bool]:
        return {"ws": self.ws, "qws": self.qws, "bws": self.bws}


class CollectRequest(BaseModel):
    phrases: List[str]
    modes: WordstatModes = Field(default_factory=WordstatModes)
    regions: List[int] = Field(default_factory=lambda: [225])
    profile: str | None = None

    @validator("phrases")
    def _clean_phrases(cls, value: Iterable[str]) -> List[str]:  # noqa: D401
        """Удаляем пустые строки и пробелы."""
        cleaned = [phrase.strip() for phrase in value if phrase and phrase.strip()]
        if not cleaned:
            raise ValueError("Передайте хотя бы одну фразу для парсинга.")
        return cleaned

    @validator("regions")
    def _clean_regions(cls, value: Iterable[int]) -> List[int]:  # noqa: D401
        """Удаляем дубликаты и некорректные значения."""
        unique: list[int] = []
        seen: set[int] = set()
        for raw in value:
            try:
                region_id = int(raw)
            except (TypeError, ValueError):
                continue
            if region_id in seen:
                continue
            seen.add(region_id)
            unique.append(region_id)
        if not unique:
            unique = [225]
        return unique


class CollectResponseRow(BaseModel):
    phrase: str
    ws: int | None = None
    qws: int | None = None
    bws: int | None = None
    status: str = "pending"
    region: int | None = None


# Helpers ---------------------------------------------------------------------
def _ensure_accounts_service_available() -> None:
    if legacy_accounts is None:  # pragma: no cover - зависит от окружения
        raise HTTPException(
            status_code=500,
            detail="Сервис аккаунтов недоступен. Проверьте установку старого KeySet.",
        )


def _ensure_wordstat_available() -> None:
    if wordstat_bridge is None:  # pragma: no cover - зависит от окружения
        raise HTTPException(
            status_code=500,
            detail="Модуль TurboWordstatParser недоступен. Проверьте зависимости.",
        )


@lru_cache(maxsize=1)
def _load_region_rows() -> tuple[RegionPayload, ...]:
    try:
        payload = load_region_rows()
    except Exception as exc:  # pragma: no cover
        logger.warning("Failed to load geo dataset: %s", exc)
        payload = []

    rows: list[RegionPayload] = []
    for entry in payload:
        try:
            rows.append(
                RegionPayload(
                    id=int(entry.get('id')),
                    name=str(entry.get('name') or ''),
                    path=str(entry.get('path') or ''),
                    parentId=entry.get('parentId'),
                    depth=int(entry.get('depth') or 0),
                    hasChildren=bool(entry.get('hasChildren')),
                )
            )
        except (TypeError, ValueError):
            continue

    return tuple(rows)

def _serialize_account(account: Any) -> AccountPayload:
    profile_path = getattr(account, "profile_path", "") or ""
    proxy = getattr(account, "proxy", None)
    notes = getattr(account, "notes", None)
    return AccountPayload(
        id=int(getattr(account, "id", 0) or 0),
        name=str(getattr(account, "name", "")),
        status=str(getattr(account, "status", "unknown")),
        profilePath=str(profile_path),
        proxy=str(proxy) if proxy else None,
        notes=str(notes) if notes else None,
    )


# Endpoints -------------------------------------------------------------------
@router.get("/accounts", response_model=list[AccountPayload])
def get_accounts() -> list[AccountPayload]:
    """Р’РµСЂРЅСѓС‚СЊ СЃРїРёСЃРѕРє Р°РєРєР°СѓРЅС‚РѕРІ Wordstat РёР· СЃС‚Р°СЂРѕРіРѕ СЃРѕС„С‚Р°."""
    _ensure_accounts_service_available()
    try:
        accounts = legacy_accounts.list_accounts()  # type: ignore[union-attr]
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to load accounts from legacy service: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    payload = []
    for account in accounts:
        profile_path = getattr(account, "profile_path", "") or ""
        if not profile_path:
            continue
        payload.append(_serialize_account(account))

    return payload


@router.get("/regions", response_model=list[RegionPayload])
def get_regions() -> list[RegionPayload]:
    """Р’РµСЂРЅСѓС‚СЊ РїР»РѕСЃРєРёР№ СЃРїРёСЃРѕРє СЂРµРіРёРѕРЅРѕРІ РґР»СЏ React-UI."""
    return list(_load_region_rows())


@router.post("/collect", response_model=list[CollectResponseRow])
def collect_frequency(payload: CollectRequest) -> list[CollectResponseRow]:
    """Р—Р°РїСѓСЃС‚РёС‚СЊ TurboWordstatParser Рё РІРµСЂРЅСѓС‚СЊ С‡Р°СЃС‚РѕС‚С‹."""
    modes = payload.modes.enabled()
    if not any(modes.values()):
        raise HTTPException(status_code=422, detail="Р’С‹Р±РµСЂРёС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СЂРµР¶РёРј С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё.")
    results: list[dict] | None = None
    last_exc: Exception | None = None

    if turbo_wordstat_service is not None:  # type: ignore[truthy-builtin]
        try:
            results = turbo_wordstat_service.collect_frequency(  # type: ignore[attr-defined]
                payload.phrases,
                modes=modes,
                regions=payload.regions,
                profile=payload.profile,
            )
        except Exception as exc:  # pragma: no cover
            last_exc = exc
            logger.warning("Turbo Wordstat service failed, fallback to bridge: %s", exc)

    if results is None:
        _ensure_wordstat_available()
        try:
            results = wordstat_bridge.collect_frequency(  # type: ignore[union-attr]
                payload.phrases,
                modes=modes,
                regions=payload.regions,
                profile=payload.profile,
            )
        except RuntimeError as exc:  # pragma: no cover
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        except Exception as exc:  # pragma: no cover
            logger.exception("Wordstat parser crashed: %s", exc)
            raise HTTPException(status_code=500, detail="Wordstat parser error") from exc

    region_id = payload.regions[0] if payload.regions else None
    response: list[CollectResponseRow] = []
    for row in results or []:
        response.append(
            CollectResponseRow(
                phrase=str(row.get("phrase") or "").strip(),
                ws=_safe_int(row.get("ws")),
                qws=_safe_int(row.get("qws")),
                bws=_safe_int(row.get("bws")),
                status=str(row.get("status") or "OK"),
                region=region_id,
            )
        )

    if region_id is not None and results and frequency_service is not None:
        try:
            frequency_service.upsert_results(results, region_id)
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to persist Wordstat results: %s", exc)
            if last_exc:
                logger.warning("Turbo service previously failed with: %s", last_exc)
    elif region_id is not None and not frequency_service:
        logger.debug("Frequency service unavailable; skipping persistence.")

    return response


def _safe_int(value: Any) -> int | None:
    try:
        if value in ("", None):
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


__all__ = ["router"]

