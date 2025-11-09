# -*- coding: utf-8 -*-
"""
Парсер вглубь для левой колонки Wordstat (аналог пакетного сбора в Key Collector)
Адаптирован из collector/parser.py для работы с keyset
"""
from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout


# Константы
LAUNCH_ARGS = ["--no-sandbox", "--disable-dev-shm-usage"]
SEARCH_SELECTORS = (
    "textarea",
    "input[data-t='field:input-search']",
    "input[name='input']",
    "input[type='text']",
    "input[role='combobox']",
    "input"
)
API_SEARCH_PATH = "/wordstat/api/search"


def _clean_num(text: str) -> int:
    """Извлечь число из строки (удалить пробелы, запятые и т.д.)"""
    return int(''.join(filter(str.isdigit, text or ""))) if text else 0


def _find_table_data(payload: dict) -> Optional[dict]:
    """Найти таблицу с данными в ответе API"""
    if not payload:
        return None

    # Ищем в разных местах структуры
    for key in ("data", "result", "items", "phrases"):
        if key in payload and isinstance(payload[key], (list, dict)):
            return payload[key]

    return payload


def _collect_entries(table_data: Any) -> List[Tuple[str, int, str]]:
    """Извлечь фразы и показы из данных таблицы"""
    entries = []

    if isinstance(table_data, list):
        for item in table_data:
            if isinstance(item, dict):
                phrase = item.get("phrase", item.get("text", item.get("query", "")))
                shows_raw = item.get("shows", item.get("impressions", item.get("freq", 0)))
                shows = _clean_num(str(shows_raw)) if shows_raw else 0
                also = item.get("also", "")

                if phrase:
                    entries.append((phrase, shows, also))

    return entries


def _extract_rows_from_json(payload: dict, query: str, min_shows: int) -> List[Tuple[str, int]]:
    """Извлечь фразы из JSON-ответа API с фильтрацией"""
    table_data = _find_table_data(payload or {})
    entries = _collect_entries(table_data) if table_data else []

    seen: set[str] = set()
    rows: List[Tuple[str, int]] = []
    base = query.lower().strip()

    for phrase, shows, _also in entries:
        if shows < min_shows:
            continue
        key = phrase.lower().strip()
        if not key or key == base or key in seen:
            continue
        seen.add(key)
        rows.append((phrase, shows))

    return rows


async def _open_wordstat(context, lr: int | None):
    """Открыть страницу Wordstat"""
    page = await context.new_page()
    base_url = "https://wordstat.yandex.ru/"
    if lr:
        base_url = f"{base_url}?lr={lr}"
    try:
        await page.goto(base_url, wait_until="domcontentloaded", timeout=60000)
    except PlaywrightTimeout:
        print("[warn] initial load timed out")
    return page


async def _find_search_input(page):
    """Найти поле ввода поиска"""
    for selector in SEARCH_SELECTORS:
        locator = page.locator(selector)
        try:
            await locator.wait_for(state="visible", timeout=4000)
            return locator.first
        except PlaywrightTimeout:
            continue
    return None


async def collect_one(context, query: str, min_shows: int, lr: int | None, log_callback=None) -> Optional[List[Tuple[str, int]]]:
    """
    Собрать фразы из левой колонки Wordstat для одного запроса

    Args:
        context: Playwright browser context
        query: Поисковый запрос
        min_shows: Минимальный порог показов
        lr: Регион
        log_callback: Функция для логирования (опционально)

    Returns:
        Список кортежей (фраза, показы) или None если сессия потеряна
    """
    def log(msg: str):
        if log_callback:
            log_callback(msg)
        else:
            print(msg)

    page = await _open_wordstat(context, lr)
    try:
        if "passport.yandex" in (page.url or ""):
            log(f"[warn] Wordstat перенаправил на авторизацию для запроса '{query}'")
            return None

        inp = await _find_search_input(page)
        if not inp:
            log(f"[warn] Поле поиска не найдено для запроса '{query}'")
            return []

        try:
            await inp.click(timeout=2000)
        except PlaywrightTimeout:
            pass

        try:
            await inp.fill("")
        except Exception:
            pass

        await inp.fill(query)

        try:
            async with page.expect_response(lambda r: API_SEARCH_PATH in r.url and r.status == 200, timeout=20000) as resp_info:
                await page.keyboard.press("Enter")
            response = await resp_info.value
        except PlaywrightTimeout:
            if "passport.yandex" in (page.url or ""):
                log(f"[warn] Перенаправление на авторизацию после ввода '{query}'")
                return None
            log(f"[warn] Таймаут ответа Wordstat для запроса '{query}'")
            return []

        try:
            payload = await response.json()
        except Exception:
            try:
                payload = json.loads((await response.body()).decode("utf-8"))
            except Exception:
                payload = None

        if not payload:
            log(f"[warn] Пустой ответ для запроса '{query}'")
            return []

        rows = _extract_rows_from_json(payload, query, min_shows)
        log(f"✓ '{query}' → найдено фраз: {len(rows)}")

        return rows
    finally:
        await page.close()


async def deep_run_async(
    seeds: List[str],
    accounts: List[Dict[str, Any]],
    profiles_dir: Path,
    depth: int = 1,
    min_shows: int = 10,
    expand_min: int = 100,
    topk: int = 50,
    lr: int | None = None,
    log_callback=None,
    progress_callback=None
) -> List[Dict[str, Any]]:
    """
    Асинхронный парсинг вглубь для левой колонки Wordstat

    Args:
        seeds: Начальные фразы (маски)
        accounts: Список аккаунтов [{name, proxy}, ...]
        profiles_dir: Директория с профилями браузеров
        depth: Глубина парсинга (1 = только прямые запросы, 2 = +1 уровень вглубь и т.д.)
        min_shows: Минимальный порог показов для фразы
        expand_min: Минимальный порог для расширения на следующий уровень
        topk: Топ-K фраз для расширения на следующий уровень
        lr: ID региона Яндекса
        log_callback: Функция для логов log_callback(message: str)
        progress_callback: Функция для прогресса progress_callback(current: int, total: int)

    Returns:
        Список результатов: [
            {"base": str, "level": int, "parent": str, "phrase": str, "shows": int},
            ...
        ]
    """
    def log(msg: str):
        if log_callback:
            log_callback(msg)
        else:
            print(msg)

    results: List[Dict[str, Any]] = []
    t0 = time.time()

    async with async_playwright() as p:
        contexts: List[Dict[str, Any]] = []

        log(f"🚀 Открытие браузеров: {len(accounts)} аккаунтов")

        # Открываем браузеры для всех аккаунтов
        for acc in accounts:
            user_dir = profiles_dir / acc["name"]
            user_dir.mkdir(parents=True, exist_ok=True)

            launch_options = {
                "user_data_dir": str(user_dir),
                "headless": False,  # Показываем браузеры
                "args": LAUNCH_ARGS.copy(),
            }

            # Добавляем прокси если есть
            proxy_uri = acc.get("proxy")
            if proxy_uri:
                launch_options["proxy"] = {"server": proxy_uri}
                log(f"  • {acc['name']} → прокси: {proxy_uri}")
            else:
                log(f"  • {acc['name']} → без прокси")

            try:
                ctx = await p.chromium.launch_persistent_context(**launch_options)

                # Проверяем авторизацию
                page = await _open_wordstat(ctx, lr)
                needs_login = "passport.yandex" in (page.url or "")
                await page.close()

                if needs_login:
                    log(f"❌ [{acc['name']}] требуется авторизация, пропускаем")
                    await ctx.close()
                    continue

                contexts.append({"name": acc["name"], "ctx": ctx, "inactive": False})
                log(f"✓ [{acc['name']}] браузер готов")
            except Exception as e:
                log(f"❌ [{acc['name']}] ошибка запуска: {e}")
                continue

        if not contexts:
            log("❌ Нет авторизованных аккаунтов для парсинга")
            return results

        log(f"\n📊 Начало парсинга: {len(seeds)} масок, глубина={depth}, порог={min_shows}")

        try:
            idx = 0
            total_queries = len(seeds)
            current_query = 0

            for base in seeds:
                current_query += 1
                if progress_callback:
                    progress_callback(current_query, total_queries)

                # Фильтруем активные контексты
                contexts = [slot for slot in contexts if not slot.get("inactive")]
                if not contexts:
                    log("❌ Нет доступных аккаунтов для парсинга")
                    break

                # Выбираем контекст по кругу
                slot = contexts[idx % len(contexts)]
                idx += 1
                ctx = slot["ctx"]
                name = slot["name"]

                log(f"\n🔍 [{name}] Обработка маски: '{base}' (глубина {depth})")

                level = 1
                frontier = [base]

                while level <= depth and frontier and not slot.get("inactive"):
                    log(f"  📂 Уровень {level}: фраз для проверки {len(frontier)}")
                    next_fr = []

                    for q in frontier:
                        items = await collect_one(ctx, q, min_shows, lr, log_callback)

                        if items is None:
                            log(f"❌ [{name}] Сессия потеряна при запросе '{q}', аккаунт отключен")
                            slot["inactive"] = True
                            try:
                                await slot["ctx"].close()
                            except Exception:
                                pass
                            slot["ctx_closed"] = True
                            break

                        # Сохраняем результаты
                        for ph, sh in items:
                            results.append({
                                "base": base,
                                "level": level,
                                "parent": q,
                                "phrase": ph,
                                "shows": sh
                            })

                        # Выбираем сильные фразы для следующего уровня
                        strong = [ph for ph, sh in items if sh >= expand_min][:topk]
                        next_fr.extend(strong)

                        if strong:
                            log(f"    ↳ '{q}' → {len(items)} фраз ({len(strong)} для расширения)")

                    if slot.get("inactive"):
                        break

                    frontier = next_fr
                    level += 1

        finally:
            log("\n🔒 Закрытие браузеров...")
            for slot in contexts:
                if slot.get("ctx_closed"):
                    continue
                try:
                    await slot["ctx"].close()
                except Exception:
                    pass

    duration = round(time.time() - t0, 1)
    log(f"\n✅ Парсинг завершен: {len(results)} фраз за {duration} сек")

    return results
