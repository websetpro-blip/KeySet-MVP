# -*- coding: utf-8 -*-
"""
Роутер для Wordstat API - частотность, глубина, прогноз.
"""
from __future__ import annotations

import logging
from typing import Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/wordstat", tags=["wordstat"])


class FrequencyModes(BaseModel):
    """Режимы частотности"""
    ws: bool = True   # Обычная
    qws: bool = False  # Кавычки
    bws: bool = False  # Восклицательный знак

    def enabled(self) -> dict[str, bool]:
        return {"ws": self.ws, "qws": self.qws, "bws": self.bws}


class CollectRequest(BaseModel):
    """Запрос на сбор частотности"""
    phrases: List[str] = Field(..., description="Список фраз для парсинга")
    modes: FrequencyModes = Field(default_factory=FrequencyModes)
    regions: List[int] = Field(default=[225], description="Регионы (225=Россия)")
    profile: str | None = Field(None, description="Имя профиля/аккаунта (None = все)")


class CollectResponseRow(BaseModel):
    """Одна строка результата частотности"""
    phrase: str
    ws: int | str | None = None
    qws: int | str | None = None
    bws: int | str | None = None
    status: str = "OK"


@router.post("/collect", response_model=List[CollectResponseRow])
def collect_frequency(payload: CollectRequest) -> List[CollectResponseRow]:
    """
    Запустить парсинг частотности Wordstat.

    Использует TurboWordstatParser через services.wordstat_bridge.
    """
    logger.info(f"[WS] /api/wordstat/collect: {len(payload.phrases)} фраз, регионы={payload.regions}, профиль={payload.profile}")

    modes = payload.modes.enabled()
    if not any(modes.values()):
        raise HTTPException(status_code=422, detail="Выберите хотя бы один режим частотности")

    try:
        # Импортируем bridge здесь чтобы избежать circular imports
        from services import wordstat_bridge

        logger.info(f"[WS] Вызов wordstat_bridge.collect_frequency...")
        results = wordstat_bridge.collect_frequency(
            payload.phrases,
            modes=modes,
            regions=payload.regions,
            profile=payload.profile,
        )
        logger.info(f"[WS] Получено {len(results)} результатов")
        return results
    except Exception as exc:
        logger.error(f"[WS] Ошибка парсинга: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка парсинга: {str(exc)}")


@router.get("/regions")
def get_regions():
    """Получить список регионов для Wordstat"""
    # TODO: загрузить из regions_tree_full.json
    return [
        {"id": 225, "name": "Россия"},
        {"id": 159, "name": "Казахстан"},
        {"id": 149, "name": "Беларусь"},
    ]


@router.get("/health")
def health_check():
    """Проверка работоспособности Wordstat API"""
    return {"status": "ok", "service": "wordstat"}
