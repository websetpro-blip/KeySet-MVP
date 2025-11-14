# -*- coding: utf-8 -*-
"""
Regions API router - возвращает дерево регионов Яндекса (4144 региона).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from core.geo import load_region_tree

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/regions", tags=["regions"])

def load_regions() -> list[dict[str, Any]]:
    """Load regions tree shared with the legacy UI."""
    try:
        regions = load_region_tree()
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to load regions tree: %s", exc)
        raise
    if not regions:
        raise FileNotFoundError("regions_tree_full.json not found")
    return regions


@router.get("", response_class=JSONResponse)
def get_regions() -> JSONResponse:
    """
    Вернуть полное дерево регионов Яндекса (4144 региона).

    Структура:
    ```json
    [
        {
            "value": "225",
            "label": "Россия",
            "children": [
                {
                    "value": "3",
                    "label": "Центр",
                    "children": [...]
                }
            ]
        }
    ]
    ```
    """
    try:
        regions = load_regions()
        return JSONResponse(content=regions)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="Регионы не найдены. Убедитесь, что шаблон regions_tree_full.json скопирован в runtime/geo."
        ) from exc
    except Exception as exc:
        logger.exception(f"Failed to get regions: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


__all__ = ["router"]
