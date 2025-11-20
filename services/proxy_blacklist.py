"""
Blacklist нерабочих прокси для фильтрации при парсинге.
Хранит (ip:port) прокси, которые не работали ранее.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Set

logger = logging.getLogger(__name__)

BLACKLIST_PATH = Path(__file__).parent.parent / "config" / "proxy_blacklist.json"


class ProxyBlacklist:
    """Singleton для управления blacklist прокси."""

    _instance: ProxyBlacklist | None = None

    def __init__(self):
        self.blacklisted: Set[str] = set()
        self._load()

    @classmethod
    def instance(cls) -> ProxyBlacklist:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load(self) -> None:
        """Загрузить blacklist из файла."""
        if not BLACKLIST_PATH.exists():
            logger.info("Blacklist прокси не найден, создаём пустой")
            self.blacklisted = set()
            self._save()
            return

        try:
            with open(BLACKLIST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.blacklisted = set(data.get("blacklist", []))
            logger.info(f"Загружен blacklist: {len(self.blacklisted)} прокси")
        except Exception as e:
            logger.error(f"Ошибка загрузки blacklist: {e}")
            self.blacklisted = set()

    def _save(self) -> None:
        """Сохранить blacklist в файл."""
        try:
            BLACKLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(BLACKLIST_PATH, "w", encoding="utf-8") as f:
                json.dump({"blacklist": list(self.blacklisted)}, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Ошибка сохранения blacklist: {e}")

    def add(self, ip: str, port: int) -> None:
        """Добавить прокси в blacklist."""
        key = f"{ip}:{port}"
        if key not in self.blacklisted:
            self.blacklisted.add(key)
            self._save()
            logger.debug(f"Добавлен в blacklist: {key}")

    def is_blacklisted(self, ip: str, port: int) -> bool:
        """Проверить, находится ли прокси в blacklist."""
        key = f"{ip}:{port}"
        return key in self.blacklisted

    def remove(self, ip: str, port: int) -> None:
        """Убрать прокси из blacklist (если вдруг снова заработал)."""
        key = f"{ip}:{port}"
        if key in self.blacklisted:
            self.blacklisted.discard(key)
            self._save()
            logger.debug(f"Удалён из blacklist: {key}")

    def clear(self) -> None:
        """Очистить весь blacklist."""
        self.blacklisted.clear()
        self._save()
        logger.info("Blacklist очищен")

    def count(self) -> int:
        """Количество прокси в blacklist."""
        return len(self.blacklisted)
