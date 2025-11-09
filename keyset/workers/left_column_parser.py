# -*- coding: utf-8 -*-
"""
Парсер левой колонки Wordstat (подсказки) с логикой 10 вкладок
Собирает вложенные фразы через DOM (кликает "Показать ещё")
"""
from __future__ import annotations

import asyncio
import logging
import pathlib
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from playwright.async_api import async_playwright, Page, BrowserContext, TimeoutError

# Константы
TABS_COUNT = 10  # Количество вкладок по умолчанию
WORDSTAT_LOAD_TIMEOUT_MS = 60000
SHOW_MORE_WAIT_MS = 2000  # Ожидание после клика "Показать ещё"
MAX_SHOW_MORE_CLICKS = 50  # Максимум кликов на "Показать ещё"


class LeftColumnResult(dict):
    """Результат парсинга с метаданными"""
    def __init__(self, data: Dict[str, List[Dict[str, Any]]]):
        super().__init__(data)
        self.meta: Dict[str, Any] = {}


class LeftColumnParser:
    """Парсер левой колонки Wordstat с поддержкой 10 вкладок (через DOM)"""

    def __init__(
        self,
        account_name: str,
        profile_path: pathlib.Path,
        phrases: List[str],
        headless: bool = False,
        proxy_uri: Optional[str] = None,
        region_id: int = 225,
        min_shows: int = 10,
        max_results: int = 200,
        logger: Optional[logging.Logger] = None
    ):
        self.account_name = account_name
        self.profile_path = profile_path
        self.phrases = phrases
        self.headless = headless
        self.proxy_uri = proxy_uri
        self.region_id = region_id
        self.min_shows = min_shows
        self.max_results = max_results
        self.logger = logger or logging.getLogger(__name__)

        # Результаты: {parent_phrase: [{"phrase": str, "shows": int}, ...]}
        self.results: Dict[str, List[Dict[str, Any]]] = {}

    def _parse_shows(self, text: str) -> int:
        """Извлечь число показов из текста"""
        # Убираем пробелы и извлекаем цифры
        cleaned = re.sub(r'\s', '', text)
        match = re.search(r'\d+', cleaned)
        return int(match.group()) if match else 0

    async def _collect_left_column(self, page: Page, parent_phrase: str) -> List[Dict[str, Any]]:
        """Собрать фразы из левой колонки через DOM"""
        results = []

        try:
            # Ждем загрузки таблицы
            await page.wait_for_selector('.wordstat__search-result-content table', timeout=10000)
            self.logger.info(f"  Таблица загружена для '{parent_phrase}'")

            # Кликаем "Показать ещё" пока есть
            clicks_count = 0
            while clicks_count < MAX_SHOW_MORE_CLICKS:
                try:
                    # Ищем кнопку "Показать ещё"
                    show_more_btn = await page.query_selector('.wordstat__show-more-button')

                    if not show_more_btn:
                        break

                    # Проверяем что кнопка не disabled
                    is_disabled = await show_more_btn.get_attribute('aria-disabled')
                    if is_disabled == 'true':
                        break

                    # Кликаем
                    await show_more_btn.click()
                    clicks_count += 1
                    self.logger.info(f"  Клик #{clicks_count} на 'Показать ещё' для '{parent_phrase}'")

                    # Ждем подгрузки новых результатов
                    await asyncio.sleep(SHOW_MORE_WAIT_MS / 1000)

                except Exception as e:
                    self.logger.debug(f"  Кнопка 'Показать ещё' больше недоступна: {e}")
                    break

            if clicks_count > 0:
                self.logger.info(f"  Всего кликов 'Показать ещё': {clicks_count}")

            # Собираем все строки из таблицы
            rows = await page.query_selector_all('tbody > tr')
            self.logger.info(f"  Найдено строк в таблице: {len(rows)}")

            for row in rows:
                try:
                    # Извлекаем фразу (первая ячейка, ссылка)
                    phrase_link = await row.query_selector('td:first-child a')
                    if not phrase_link:
                        continue

                    phrase_text = await phrase_link.inner_text()
                    phrase_text = phrase_text.strip()

                    # Извлекаем показы (вторая ячейка)
                    shows_cell = await row.query_selector('td:nth-child(2)')
                    if not shows_cell:
                        continue

                    shows_text = await shows_cell.inner_text()
                    shows = self._parse_shows(shows_text)

                    # Фильтруем по порогу
                    if shows < self.min_shows:
                        continue

                    # Добавляем
                    results.append({
                        "phrase": phrase_text,
                        "shows": shows,
                        "parent": parent_phrase
                    })

                except Exception as e:
                    self.logger.debug(f"  Ошибка парсинга строки: {e}")
                    continue

            # Сортируем по показам (убывание) и обрезаем
            results.sort(key=lambda x: x["shows"], reverse=True)
            results = results[:self.max_results]

            self.logger.info(f"  Собрано фраз для '{parent_phrase}': {len(results)}")

        except Exception as e:
            self.logger.error(f"  Ошибка сбора левой колонки для '{parent_phrase}': {e}")

        return results

    async def run(self) -> LeftColumnResult:
        """Запустить парсинг левой колонки"""
        self.logger.info("=" * 70)
        self.logger.info(f"LEFT COLUMN PARSER: {self.account_name}")
        self.logger.info(f"Профиль: {self.profile_path}")
        self.logger.info(f"Регион: {self.region_id}")
        self.logger.info(f"Порог показов: {self.min_shows}")
        self.logger.info("=" * 70)

        total_phrases = len(self.phrases)
        self.logger.info(f"Загружено фраз: {total_phrases}")

        if total_phrases == 0:
            return LeftColumnResult({})

        # Определяем количество вкладок
        tabs_count = min(TABS_COUNT, total_phrases)
        if total_phrases == 1:
            tabs_count = 1

        self.logger.info(f"Будет использовано вкладок: {tabs_count}")

        async with async_playwright() as p:
            # Прокси
            proxy_config = None
            if self.proxy_uri:
                proxy_config = {"server": self.proxy_uri}
                self.logger.info(f"Прокси: {self.proxy_uri}")

            # Запуск браузера
            try:
                context: BrowserContext = await p.chromium.launch_persistent_context(
                    user_data_dir=str(self.profile_path),
                    headless=self.headless,
                    channel="chrome",
                    proxy=proxy_config,
                    args=[
                        "--start-maximized",
                        "--disable-blink-features=AutomationControlled",
                        "--no-first-run",
                        "--no-default-browser-check",
                    ],
                    viewport=None,
                    locale="ru-RU",
                )
            except Exception as e:
                self.logger.error(f"Ошибка запуска браузера: {e}")
                return LeftColumnResult({})

            # Открываем вкладки
            pages: List[Page] = []
            self.logger.info(f"Создание {tabs_count} вкладок...")

            # Первая вкладка
            page = context.pages[0] if context.pages else await context.new_page()
            pages.append(page)

            # Дополнительные вкладки
            if tabs_count > 1:
                for i in range(tabs_count - 1):
                    page_new = await context.new_page()
                    pages.append(page_new)

            self.logger.info(f"✓ Создано {len(pages)} вкладок")

            # Загружаем Wordstat во всех вкладках
            self.logger.info("Загрузка Wordstat...")

            async def load_wordstat(page: Page, index: int):
                url = f"https://wordstat.yandex.ru/?region={self.region_id}"
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=WORDSTAT_LOAD_TIMEOUT_MS)
                    self.logger.info(f"  ✓ Вкладка {index + 1}: Wordstat загружен")
                except Exception as e:
                    self.logger.error(f"  ✗ Вкладка {index + 1}: ошибка загрузки - {e}")

            await asyncio.gather(*[load_wordstat(page, i) for i, page in enumerate(pages)])

            # Распределяем фразы по вкладкам
            tab_phrases_list: List[List[str]] = [[] for _ in range(tabs_count)]
            for idx, phrase in enumerate(self.phrases):
                tab_phrases_list[idx % tabs_count].append(phrase)

            # Парсинг
            self.logger.info(f"Запуск парсинга {total_phrases} фраз...")
            start_time = time.time()

            async def parse_tab(page: Page, tab_phrases: List[str], tab_index: int):
                for phrase in tab_phrases:
                    phrase = phrase.strip()
                    if not phrase:
                        continue

                    self.logger.info(f"[TAB {tab_index + 1}] Парсинг '{phrase}'...")

                    # Переходим на URL с фразой
                    url = f"https://wordstat.yandex.ru/?words={quote(phrase)}&region={self.region_id}"

                    try:
                        await page.goto(url, wait_until="domcontentloaded", timeout=WORDSTAT_LOAD_TIMEOUT_MS)

                        # Вводим фразу в поле (если нужно)
                        try:
                            input_field = await page.wait_for_selector(
                                "input[name='text'], input[placeholder]",
                                timeout=2000
                            )
                            await input_field.fill(phrase)
                            await input_field.press("Enter")
                            await asyncio.sleep(1)
                        except Exception:
                            pass  # Wordstat уже обработал words в URL

                        # Собираем левую колонку
                        left_column = await self._collect_left_column(page, phrase)
                        self.results[phrase] = left_column

                        self.logger.info(f"[TAB {tab_index + 1}] '{phrase}' → найдено {len(left_column)} фраз")

                    except Exception as e:
                        self.logger.error(f"[TAB {tab_index + 1}] ❌ '{phrase}' ошибка: {e}")
                        self.results[phrase] = []

                    # Пауза между запросами
                    await asyncio.sleep(0.5)

            # Запускаем парсинг на всех вкладках параллельно
            parse_tasks = [
                parse_tab(page, phrases, i)
                for i, (page, phrases) in enumerate(zip(pages, tab_phrases_list))
            ]
            await asyncio.gather(*parse_tasks)

            # Закрываем браузер
            await context.close()

            # Статистика
            elapsed = time.time() - start_time
            total_found = sum(len(results) for results in self.results.values())

            self.logger.info("=" * 70)
            self.logger.info(f"ПАРСИНГ ЗАВЕРШЕН ({self.account_name})")
            self.logger.info(f"Обработано фраз: {len(self.results)}/{total_phrases}")
            self.logger.info(f"Найдено вложенных: {total_found}")
            self.logger.info(f"Время: {elapsed:.2f} сек")
            self.logger.info("=" * 70)

            result = LeftColumnResult(self.results)
            result.meta = {
                "total_phrases": total_phrases,
                "total_found": total_found,
                "elapsed": elapsed
            }
            return result
