"""
Парсинг прокси из бесплатных источников.

Новые рабочие источники (2025):
- ProxyScrape API (обновление каждые 5 мин)
- Proxifly GitHub (обновление каждые 5 мин, JSON с геолокацией)
- Proxy-List.Download API (обновление каждые 30 мин)
"""

from __future__ import annotations

import asyncio
import logging
import re
import uuid
from typing import List, Optional, Set, Tuple

import aiohttp

from services.proxy_manager import Proxy as ManagerProxy
from services.proxy_blacklist import ProxyBlacklist

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
        notes=f"Импортировано из {source}",
    )


async def _parse_proxyscrape(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит бесплатные прокси с ProxyScrape API (обновление каждые 5 мин)."""
    proxies = []
    try:
        url = "https://api.proxyscrape.com/v2/"
        params = {
            "request": "displayproxies",
            "protocol": protocol if protocol in ("http", "socks4", "socks5") else "http",
            "country": (country or "ru").lower(),
            "timeout": "10000",
            "ssl": "all",
            "anonymity": "all"
        }
        
        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"ProxyScrape: HTTP {response.status}")
                return proxies
            
            text = await response.text()
            lines = text.strip().split('\n')
            
            blacklist = ProxyBlacklist.instance()
            
            for line in lines:
                if len(proxies) >= count:
                    break
                    
                parsed = _parse_proxy_string(line, protocol)
                if parsed:
                    ip, port, username, password = parsed
                    
                    # Пропустить прокси из blacklist
                    if blacklist.is_blacklisted(ip, port):
                        continue
                    
                    proxies.append(_create_proxy(ip, port, protocol, username, password, "proxyscrape", country))
            
            logger.info(f"ProxyScrape: получено {len(proxies)} прокси")
    except Exception as e:
        logger.error(f"ProxyScrape ошибка: {e}")
    
    return proxies


async def _parse_proxifly(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с Proxifly GitHub (обновление каждые 5 мин, JSON с деталями)."""
    proxies = []
    try:
        protocol_name = protocol if protocol in ("http", "socks4", "socks5") else "http"
        url = f"https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/{protocol_name}/data.json"
        
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"Proxifly: HTTP {response.status}")
                return proxies
            
            data = await response.json()
            blacklist = ProxyBlacklist.instance()
            
            for item in data:
                if len(proxies) >= count:
                    break
                    
                proxy_str = item.get("proxy", "")
                proxy_country = item.get("country", "").upper()
                anonymity = item.get("anonymity", "")
                
                # Фильтр по стране
                if country and proxy_country.lower() != country.lower():
                    continue
                
                # Фильтр по анонимности (не берём transparent)
                if anonymity == "transparent":
                    continue
                
                parsed = _parse_proxy_string(proxy_str, protocol)
                if parsed:
                    ip, port, username, password = parsed
                    
                    # Пропустить прокси из blacklist
                    if blacklist.is_blacklisted(ip, port):
                        continue
                    
                    proxies.append(_create_proxy(ip, port, protocol, username, password, "proxifly", proxy_country))
            
            logger.info(f"Proxifly: получено {len(proxies)} прокси")
    except Exception as e:
        logger.error(f"Proxifly ошибка: {e}")
    
    return proxies


async def _parse_proxy_list_download(
    session: aiohttp.ClientSession,
    protocol: str,
    country: Optional[str],
    count: int,
) -> List[ManagerProxy]:
    """Парсит прокси с proxy-list.download API (обновление каждые 30 мин)."""
    proxies = []
    try:
        # API использует type вместо protocol
        type_map = {"http": "http", "https": "https", "socks4": "socks4", "socks5": "socks5"}
        proxy_type = type_map.get(protocol, "http")
        
        url = f"https://www.proxy-list.download/api/v1/get?type={proxy_type}"
        if country:
            url += f"&country={country.upper()}"
        
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                logger.warning(f"Proxy-list.download: HTTP {response.status}")
                return proxies
            
            text = await response.text()
            lines = text.strip().split('\n')
            blacklist = ProxyBlacklist.instance()
            
            for line in lines:
                if len(proxies) >= count:
                    break
                    
                parsed = _parse_proxy_string(line, protocol)
                if parsed:
                    ip, port, username, password = parsed
                    
                    # Пропустить прокси из blacklist
                    if blacklist.is_blacklisted(ip, port):
                        continue
                    
                    proxies.append(_create_proxy(ip, port, protocol, username, password, "proxylist", country))
            
            logger.info(f"Proxy-list.download: получено {len(proxies)} прокси")
    except Exception as e:
        logger.error(f"Proxy-list.download ошибка: {e}")
    
    return proxies


# Маппинг источников на функции парсинга
PARSERS = {
    # Новые бесплатные источники (рабочие)
    "fineproxy": _parse_proxyscrape,
    "fineproxy.org": _parse_proxyscrape,
    "proxyelite": _parse_proxifly,
    "proxyelite.com": _parse_proxifly,
    "proxylist": _parse_proxy_list_download,
    "proxy-list": _parse_proxy_list_download,
    
    # Прямые названия новых источников
    "proxyscrape": _parse_proxyscrape,
    "proxifly": _parse_proxifly,
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
        sources: Список источников (proxyscrape, proxifly, proxylist, или старые fineproxy/proxyelite)
        protocol: Протокол прокси (http, https, socks5)
        country: Фильтр по стране (опционально, например: RU, KZ, US)
        count: Общее количество прокси для парсинга

    Returns:
        ProxyParseResult с найденными прокси
    """
    result = ProxyParseResult()

    if not sources:
        result.errors.append("Не указаны источники для парсинга")
        return result

    # Каждый источник даёт count прокси (не делим между источниками)
    per_source = count

    # Создать HTTP сессию с увеличенным лимитом для параллелизма
    timeout = aiohttp.ClientTimeout(total=30)
    connector = aiohttp.TCPConnector(limit=50, limit_per_host=20)

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
