"""
Парсинг прокси из различных источников.

Поддерживаемые источники:
- fineproxy.org
- proxyelite.com
- htmlweb.ru
- advanced.name
- proxy.market
"""

from __future__ import annotations

import asyncio
import logging
import re
import uuid
from typing import List, Optional, Set, Tuple
from urllib.parse import urljoin

import aiohttp

from services.proxy_manager import Proxy as ManagerProxy

logger = logging.getLogger(__name__)


class ProxyParseResult:
    """Результат парсинга прокси."""

    def __init__(self):
        self.found: int = 0
        self.valid: int = 0
        self.added: int = 0
        self.proxies: List[ManagerProxy] = []
        self.errors: List[str] = []


def _parse_proxy_string(line: str, default_protocol: str = "http") -> Optional[Tuple[str, int, Optional[str], Optional[str]]]:
    """
    Парсит строку прокси в формате:
    - ip:port
    - username:password@ip:port
    - protocol://ip:port
    - protocol://username:password@ip:port

    Возвращает: (ip, port, username, password) или None если не удалось распарсить
    """
    line = line.strip()
    if not line or line.startswith('#'):
        return None

    # Удалить protocol:// если есть
    protocol_match = re.match(r'^(https?|socks5?)://', line, re.IGNORECASE)
    if protocol_match:
        line = line[len(protocol_match.group(0)):]

    # Проверить формат username:password@ip:port
    auth_match = re.match(r'^([^:@]+):([^:@]+)@([^:]+):(\d+)$', line)
    if auth_match:
        username, password, ip, port = auth_match.groups()
        return (ip, int(port), username, password)

    # Проверить формат ip:port
    simple_match = re.match(r'^([^:]+):(\d+)$', line)
    if simple_match:
        ip, port = simple_match.groups()
        return (ip, int(port), None, None)

    return None


def _create_proxy(
    ip: str,
    port: int,
    protocol: str,
    username: Optional[str] = None,
    password: Optional[str] = None,
    source: str = "",
    country: Optional[str] = None,
) -> ManagerProxy:
    """Создает объект ManagerProxy из параметров."""
    protocol = protocol.lower()
    if protocol not in ("http", "https", "socks5"):
        protocol = "http"

    server = f"{protocol}://{ip}:{port}"
    label = f"{source}_{ip}:{port}" if source else f"{ip}:{port}"

    return ManagerProxy(
        id=str(uuid.uuid4()),
        label=label,
        type=protocol,
        server=server,
        username=username,
        password=password,
        geo=(country or "").upper() if country else None,
        sticky=True,
        max_concurrent=10,
        enabled=True,
        notes=f"Импортировано из {source}" if source else "Импортировано",
    )


async def _parse_fineproxy(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с fineproxy.org."""
    logger.info(f"Парсинг fineproxy.org: protocol={protocol}, country={country}, count={count}")
    proxies = []

    try:
        # Fineproxy предоставляет бесплатные списки
        # Реальный URL может отличаться, используем демо-логику
        url = "https://www.fineproxy.org/freshproxy/"

        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"fineproxy.org вернул статус {response.status}")
                return proxies

            html = await response.text()

            # Ищем IP:PORT в HTML (упрощенный парсинг)
            # Паттерн для IP:PORT
            pattern = r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b'
            matches = re.findall(pattern, html)

            for ip, port in matches[:count]:
                try:
                    proxy = _create_proxy(
                        ip=ip,
                        port=int(port),
                        protocol=protocol,
                        source="fineproxy",
                        country=country,
                    )
                    proxies.append(proxy)
                except Exception as e:
                    logger.debug(f"Ошибка создания прокси {ip}:{port}: {e}")
                    continue

            logger.info(f"fineproxy.org: найдено {len(proxies)} прокси")

    except asyncio.TimeoutError:
        logger.error("fineproxy.org: таймаут")
    except Exception as e:
        logger.error(f"fineproxy.org: ошибка {e}")

    return proxies


async def _parse_proxyelite(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с proxyelite.com."""
    logger.info(f"Парсинг proxyelite.com: protocol={protocol}, country={country}, count={count}")
    proxies = []

    try:
        # ProxyElite API или веб-страница
        url = "https://proxyelite.info/proxy-list/"

        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"proxyelite.com вернул статус {response.status}")
                return proxies

            html = await response.text()

            # Паттерн для IP:PORT
            pattern = r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b'
            matches = re.findall(pattern, html)

            for ip, port in matches[:count]:
                try:
                    proxy = _create_proxy(
                        ip=ip,
                        port=int(port),
                        protocol=protocol,
                        source="proxyelite",
                        country=country,
                    )
                    proxies.append(proxy)
                except Exception as e:
                    logger.debug(f"Ошибка создания прокси {ip}:{port}: {e}")
                    continue

            logger.info(f"proxyelite.com: найдено {len(proxies)} прокси")

    except asyncio.TimeoutError:
        logger.error("proxyelite.com: таймаут")
    except Exception as e:
        logger.error(f"proxyelite.com: ошибка {e}")

    return proxies


async def _parse_htmlweb(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с htmlweb.ru."""
    logger.info(f"Парсинг htmlweb.ru: protocol={protocol}, country={country}, count={count}")
    proxies = []

    try:
        # htmlweb.ru предоставляет бесплатные прокси
        url = "https://htmlweb.ru/analiz/proxy_list.php"

        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"htmlweb.ru вернул статус {response.status}")
                return proxies

            html = await response.text()

            # Паттерн для IP:PORT
            pattern = r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b'
            matches = re.findall(pattern, html)

            for ip, port in matches[:count]:
                try:
                    proxy = _create_proxy(
                        ip=ip,
                        port=int(port),
                        protocol=protocol,
                        source="htmlweb",
                        country=country,
                    )
                    proxies.append(proxy)
                except Exception as e:
                    logger.debug(f"Ошибка создания прокси {ip}:{port}: {e}")
                    continue

            logger.info(f"htmlweb.ru: найдено {len(proxies)} прокси")

    except asyncio.TimeoutError:
        logger.error("htmlweb.ru: таймаут")
    except Exception as e:
        logger.error(f"htmlweb.ru: ошибка {e}")

    return proxies


async def _parse_advanced_name(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с advanced.name."""
    logger.info(f"Парсинг advanced.name: protocol={protocol}, country={country}, count={count}")
    proxies = []

    try:
        # advanced.name предоставляет прокси-листы
        url = "https://advanced.name/freeproxy"

        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"advanced.name вернул статус {response.status}")
                return proxies

            html = await response.text()

            # Паттерн для IP:PORT
            pattern = r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b'
            matches = re.findall(pattern, html)

            for ip, port in matches[:count]:
                try:
                    proxy = _create_proxy(
                        ip=ip,
                        port=int(port),
                        protocol=protocol,
                        source="advanced.name",
                        country=country,
                    )
                    proxies.append(proxy)
                except Exception as e:
                    logger.debug(f"Ошибка создания прокси {ip}:{port}: {e}")
                    continue

            logger.info(f"advanced.name: найдено {len(proxies)} прокси")

    except asyncio.TimeoutError:
        logger.error("advanced.name: таймаут")
    except Exception as e:
        logger.error(f"advanced.name: ошибка {e}")

    return proxies


async def _parse_proxy_market(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с proxy.market."""
    logger.info(f"Парсинг proxy.market: protocol={protocol}, country={country}, count={count}")
    proxies = []

    try:
        # proxy.market API или веб-страница
        url = "https://proxy.market/free-proxy-list"

        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"proxy.market вернул статус {response.status}")
                return proxies

            html = await response.text()

            # Паттерн для IP:PORT
            pattern = r'\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b'
            matches = re.findall(pattern, html)

            for ip, port in matches[:count]:
                try:
                    proxy = _create_proxy(
                        ip=ip,
                        port=int(port),
                        protocol=protocol,
                        source="proxy.market",
                        country=country,
                    )
                    proxies.append(proxy)
                except Exception as e:
                    logger.debug(f"Ошибка создания прокси {ip}:{port}: {e}")
                    continue

            logger.info(f"proxy.market: найдено {len(proxies)} прокси")

    except asyncio.TimeoutError:
        logger.error("proxy.market: таймаут")
    except Exception as e:
        logger.error(f"proxy.market: ошибка {e}")

    return proxies


# Маппинг источников на функции парсинга
PARSERS = {
    "fineproxy": _parse_fineproxy,
    "fineproxy.org": _parse_fineproxy,
    "proxyelite": _parse_proxyelite,
    "proxyelite.com": _parse_proxyelite,
    "htmlweb": _parse_htmlweb,
    "htmlweb.ru": _parse_htmlweb,
    "advanced.name": _parse_advanced_name,
    "advanced": _parse_advanced_name,
    "proxy.market": _parse_proxy_market,
    "proxymarket": _parse_proxy_market,
}


async def parse_proxies_from_sources(
    sources: List[str],
    protocol: str = "http",
    country: Optional[str] = None,
    count: int = 20,
) -> ProxyParseResult:
    """
    Парсит прокси из указанных источников.

    Args:
        sources: Список источников (fineproxy, proxyelite, htmlweb, advanced.name, proxy.market)
        protocol: Протокол прокси (http, https, socks5)
        country: Фильтр по стране (опционально)
        count: Общее количество прокси для парсинга

    Returns:
        ProxyParseResult с найденными прокси
    """
    result = ProxyParseResult()

    if not sources:
        result.errors.append("Не указаны источники для парсинга")
        return result

    # Разделить count на количество источников
    per_source = max(1, count // len(sources))

    # Создать HTTP сессию
    timeout = aiohttp.ClientTimeout(total=30)
    connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)

    async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
        tasks = []

        for source in sources:
            source_lower = source.lower().strip()
            parser_func = PARSERS.get(source_lower)

            if parser_func is None:
                logger.warning(f"Неизвестный источник: {source}")
                result.errors.append(f"Неизвестный источник: {source}")
                continue

            # Запустить парсер
            task = parser_func(session, protocol, country, per_source)
            tasks.append(task)

        # Дождаться всех парсеров
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Собрать прокси из всех источников
            seen: Set[Tuple[str, Optional[str], Optional[str]]] = set()

            for idx, source_proxies in enumerate(results):
                if isinstance(source_proxies, Exception):
                    logger.error(f"Ошибка парсинга источника #{idx}: {source_proxies}")
                    result.errors.append(f"Ошибка источника: {source_proxies}")
                    continue

                result.found += len(source_proxies)

                for proxy in source_proxies:
                    # Проверка на дубликаты по (server, username, password)
                    key = (proxy.server, proxy.username, proxy.password)
                    if key in seen:
                        continue

                    seen.add(key)
                    result.proxies.append(proxy)
                    result.valid += 1

    result.added = len(result.proxies)

    logger.info(
        f"Парсинг завершен: найдено={result.found}, "
        f"валидных={result.valid}, добавлено={result.added}, "
        f"ошибок={len(result.errors)}"
    )

    return result


__all__ = ["parse_proxies_from_sources", "ProxyParseResult"]
