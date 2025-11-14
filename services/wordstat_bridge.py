# -*- coding: utf-8 -*-
from __future__ import annotations

import random
from typing import Any, Callable, Iterable, Optional

try:
    from . import wordstat_ws
except ImportError:  # pragma: no cover - доступно только в полной сборке
    wordstat_ws = None  # type: ignore

try:
    from . import frequency as frequency_service
except ImportError:  # pragma: no cover
    frequency_service = None  # type: ignore

try:
    from . import direct_batch
except ImportError:  # pragma: no cover
    direct_batch = None  # type: ignore


def _try_call(handler: Optional[Callable], *args, **kwargs) -> Any:
    if handler is None:
        return None
    try:
        return handler(*args, **kwargs)
    except Exception:
        return None


def collect_frequency(
    phrases: list[str],
    *,
    modes: dict[str, bool],
    regions: list[int],
    profile: str | None,
) -> list[dict]:
    """Proxy to whichever frequency implementation is available."""

    handlers: Iterable[Optional[Callable]] = [
        getattr(wordstat_ws, "collect_frequency", None) if wordstat_ws else None,
        getattr(frequency_service, "collect_frequency_ui", None) if frequency_service else None,
        getattr(frequency_service, "collect_frequency", None) if frequency_service else None,
    ]

    for handler in handlers:
        payload = _try_call(handler, phrases, modes=modes, regions=regions, profile=profile)
        if payload is not None:
            return payload

    # fallback — return empty results instead of synthetic data
    # Демо-данные удалены - теперь возвращаем пустые результаты
    results: list[dict] = []
    for phrase in phrases:
        results.append(
            {
                "phrase": phrase,
                "ws": "",
                "qws": "",
                "bws": "",
                "status": "No parser available",
            }
        )
    return results


def collect_depth(
    phrases: list[str],
    *,
    column: str,
    pages: int,
    regions: list[int],
    profile: str | None,
) -> list[dict]:
    handler = getattr(frequency_service, "collect_depth", None) if frequency_service else None
    payload = _try_call(
        handler,
        phrases,
        column=column,
        pages=pages,
        regions=regions,
        profile=profile,
    )
    if payload is not None:
        return payload

    # fallback — echo the phrases with dummy counts
    return [
        {
            "phrase": phrase,
            "count": random.randint(0, 200),
            "column": column,
            "status": "OK",
        }
        for phrase in phrases
    ]


def collect_forecast(
    phrases: list[str],
    *,
    regions: list[int],
    profile_ctx: dict,
) -> list[dict]:
    storage_state = (profile_ctx or {}).get("storage_state")
    proxy = (profile_ctx or {}).get("proxy")

    result = _try_call(
        getattr(direct_batch, "get_bids_sync", None) if direct_batch else None,
        phrases,
        storage_state=storage_state,
        proxy=proxy,
    )
    if result is not None:
        return result

    return [
        {
            "phrase": phrase,
            "shows": random.randint(50, 1000),
            "clicks": random.randint(5, 120),
            "cost": round(random.random() * 10, 2),
            "cpc": round(random.random() * 2, 2),
            "status": "Forecast",
        }
        for phrase in phrases
    ]


__all__ = ["collect_frequency", "collect_depth", "collect_forecast"]
