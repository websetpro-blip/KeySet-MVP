from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)

# Paths -----------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LEGACY_ROOT = PROJECT_ROOT / "keyset"
REGIONS_DATASET = LEGACY_ROOT / "data" / "regions_tree_full.json"

# Legacy services -------------------------------------------------------------
try:  # pragma: no cover - интеграция со старым софтом
    from keyset.services import accounts as legacy_accounts
    from keyset.services import frequency as frequency_service
except Exception as exc:  # pragma: no cover
    legacy_accounts = None
    logger.warning("Wordstat accounts service unavailable: %s", exc)

try:  # pragma: no cover
    from keyset.services import wordstat_bridge
except Exception as exc:  # pragma: no cover
    wordstat_bridge = None
    logger.warning("Wordstat parser bridge unavailable: %s", exc)


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


DEFAULT_REGION_TREE = [
    {
        "value": 225,
        "label": "Россия",
        "children": [
            {"value": 213, "label": "Москва"},
            {"value": 2, "label": "Санкт-Петербург"},
        ],
    }
]


def _iter_region_nodes(root: Dict[str, Any]) -> List[RegionPayload]:
    rows: list[RegionPayload] = []

    def walk(node: Dict[str, Any], trail: list[str], depth: int, parent_id: int | None) -> None:
        try:
            node_id = int(node["value"])
        except (KeyError, TypeError, ValueError):
            return
        label = str(node.get("label") or "").strip()
        if not label:
            return

        children = node.get("children") or []
        branch = trail + [label]
        rows.append(
            RegionPayload(
                id=node_id,
                name=label,
                path=" / ".join(branch),
                parentId=parent_id,
                depth=depth,
                hasChildren=bool(children),
            )
        )

        for child in children:
            walk(child, branch, depth + 1, node_id)

    walk(root, [], 0, None)
    return rows


@lru_cache(maxsize=1)
def _load_region_rows() -> tuple[RegionPayload, ...]:
    dataset = DEFAULT_REGION_TREE
    if REGIONS_DATASET.exists():
        try:
            dataset = json.loads(REGIONS_DATASET.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:  # pragma: no cover
            logger.warning("Failed to read regions dataset, using fallback: %s", exc)

    roots = dataset if isinstance(dataset, list) else [dataset]
    rows: list[RegionPayload] = []
    for entry in roots:
        rows.extend(_iter_region_nodes(entry))

    if not rows:
        rows.extend(_iter_region_nodes(DEFAULT_REGION_TREE[0]))

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

    if region_id is not None and results:
        try:
            frequency_service.upsert_results(results, region_id)
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to persist Wordstat results: %s", exc)

    return response


def _safe_int(value: Any) -> int | None:
    try:
        if value in ("", None):
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


__all__ = ["router"]

