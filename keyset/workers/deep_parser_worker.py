# -*- coding: utf-8 -*-
"""
Qt Worker для запуска deep парсинга в отдельном потоке
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import List, Dict, Any

from PySide6.QtCore import QThread, Signal


class DeepParserWorker(QThread):
    """Воркер для парсинга вглубь (левая колонка Wordstat)"""

    # Сигналы
    log_signal = Signal(str)  # Лог сообщения
    progress_signal = Signal(int, int)  # current, total
    finished_signal = Signal(list)  # Результаты
    error_signal = Signal(str)  # Ошибка

    def __init__(
        self,
        seeds: List[str],
        accounts: List[Dict[str, Any]],
        profiles_dir: Path,
        depth: int = 1,
        min_shows: int = 10,
        expand_min: int = 100,
        topk: int = 50,
        region_id: int = 225,
        parent=None
    ):
        super().__init__(parent)
        self.seeds = seeds
        self.accounts = accounts
        self.profiles_dir = profiles_dir
        self.depth = depth
        self.min_shows = min_shows
        self.expand_min = expand_min
        self.topk = topk
        self.region_id = region_id

    def run(self):
        """Запуск парсинга в отдельном потоке"""
        try:
            from ..workers.deep_parser import deep_run_async

            # Создаем новый event loop для этого потока
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            # Коллбеки для логов и прогресса
            def log_callback(msg: str):
                self.log_signal.emit(msg)

            def progress_callback(current: int, total: int):
                self.progress_signal.emit(current, total)

            # Запускаем парсинг
            results = loop.run_until_complete(
                deep_run_async(
                    seeds=self.seeds,
                    accounts=self.accounts,
                    profiles_dir=self.profiles_dir,
                    depth=self.depth,
                    min_shows=self.min_shows,
                    expand_min=self.expand_min,
                    topk=self.topk,
                    lr=self.region_id,
                    log_callback=log_callback,
                    progress_callback=progress_callback
                )
            )

            # Отправляем результаты
            self.finished_signal.emit(results)

        except Exception as e:
            self.error_signal.emit(f"Ошибка парсинга: {str(e)}")
        finally:
            try:
                loop.close()
            except:
                pass
