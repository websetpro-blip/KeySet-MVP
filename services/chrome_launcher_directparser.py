# -*- coding: utf-8 -*-
"""
Запуск отдельного пользовательского Chrome через Playwright.

Вместо запуска системного chrome.exe c параметрами командной строки
используем launch_persistent_context, который корректно прокидывает прокси
и не требует дополнительных расширений или CDP-хаков.
"""
from __future__ import annotations

import asyncio
import json
import logging
import random
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Any, List
from urllib.parse import urlparse

try:  # Optional dependency
    from aiohttp_socks import ProxyConnector  # type: ignore
except Exception:  # pragma: no cover - dependency may be absent
    ProxyConnector = None

try:
    import aiohttp
    from aiohttp import BasicAuth
except Exception:  # pragma: no cover - dependency may be absent
    aiohttp = None  # type: ignore

from playwright.async_api import async_playwright

from core.app_paths import PROFILES
from services import accounts as account_service

LOGGER = logging.getLogger(__name__)


@dataclass
class _RunningContext:
    thread: threading.Thread
    stop_event: threading.Event
    started_event: threading.Event
    error: Optional[str]
    proxy_config: Optional[Dict[str, str]]


class ChromeLauncherDirectParser:
    """
    Управляет пользовательскими экземплярами Chrome, поднятыми через Playwright.

    Один аккаунт ↔ один persistent context. Контекст живёт в отдельном потоке
    до тех пор, пока не будет вызван close().
    """

    CHROME_CHANNEL = "chrome"

    # Встроенный stealth-скрипт для базового антидетекта
    STEALTH_SCRIPT = """
    () => {
        // 1. Убираем webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        // 2. Маскируем chrome.runtime (bot detection)
        if (window.chrome && window.chrome.runtime) {
            try {
                delete window.chrome.runtime;
            } catch (e) {
                // ignore
            }
        }

        // 3. Фиксим permissions API
        try {
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications'
                    ? Promise.resolve({ state: Notification.permission })
                    : originalQuery(parameters)
            );
        } catch (e) {
            // ignore
        }

        // 4. Добавляем реалистичные plugins
        try {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        } catch (e) {
            // ignore
        }

        // 5. Лёгкий Canvas noise
        try {
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function () {
                try {
                    const context = this.getContext('2d');
                    const imageData = context.getImageData(0, 0, this.width, this.height);
                    const noise = Math.random() * 0.001;
                    for (let i = 0; i < imageData.data.length; i += 4) {
                        imageData.data[i] = imageData.data[i] + noise;
                    }
                    context.putImageData(imageData, 0, 0);
                } catch (e) {
                    // ignore
                }
                return originalToDataURL.apply(this, arguments);
            };
        } catch (e) {
            // ignore
        }
    }
    """

    _running: Dict[str, _RunningContext] = {}
    _lock = threading.RLock()

    # ------------------------------------------------------------------ public
    @classmethod
    def launch(
        cls,
        account_name: str,
        profile_path: str,
        *,
        proxy_server: Optional[str] = None,
        proxy_username: Optional[str] = None,
        proxy_password: Optional[str] = None,
        start_url: str = "about:blank",
    ) -> threading.Thread:
        """
        Запустить Chrome в отдельном окне.

        Возвращает поток, в котором исполняется Playwright (для совместимости).
        """
        profile = cls._resolve_profile(profile_path)
        proxy = cls._build_proxy_config(account_name, proxy_server, proxy_username, proxy_password)

        cls.close(account_name)

        stop_event = threading.Event()
        started_event = threading.Event()

        thread = threading.Thread(
            target=cls._run_playwright,
            name=f"directparser-{account_name}",
            args=(account_name, profile, proxy, start_url, stop_event, started_event),
            daemon=True,
        )

        with cls._lock:
            cls._running[account_name] = _RunningContext(
                thread=thread,
                stop_event=stop_event,
                started_event=started_event,
                error=None,
                proxy_config=proxy,
            )

        thread.start()
        LOGGER.info("[%s] Playwright launcher thread started", account_name)

        if not started_event.wait(timeout=20):
            cls.close(account_name)
            raise RuntimeError("Playwright не смог запустить Chrome за 20 секунд")

        with cls._lock:
            ctx = cls._running.get(account_name)
            if ctx and ctx.error:
                message = ctx.error
                cls.close(account_name)
                raise RuntimeError(message)

        return thread

    @classmethod
    def close(cls, account_name: str) -> None:
        """Остановить контекст для указанного аккаунта."""
        with cls._lock:
            ctx = cls._running.pop(account_name, None)

        if ctx is None:
            return

        ctx.stop_event.set()
        ctx.thread.join(timeout=10)
        LOGGER.info("[%s] Playwright launcher thread stopped", account_name)

    @classmethod
    def close_all(cls) -> None:
        """Остановить все активные контексты."""
        with cls._lock:
            names = list(cls._running.keys())
        for name in names:
            cls.close(name)

    # ---------------------------------------------------------------- helpers
    @classmethod
    def _run_playwright(
        cls,
        account_name: str,
        profile_dir: Path,
        proxy_config: Optional[Dict[str, str]],
        start_url: str,
        stop_event: threading.Event,
        started_event: threading.Event,
    ) -> None:
        async def runner() -> None:
            await cls._launch_async(
                account_name,
                profile_dir,
                proxy_config,
                start_url,
                stop_event,
                started_event,
            )

        try:
            asyncio.run(runner())
        except Exception:  # pragma: no cover - поток завершается, исключение уже залогировано
            LOGGER.exception("[%s] Playwright runner crashed", account_name)
            with cls._lock:
                ctx = cls._running.get(account_name)
                if ctx:
                    ctx.error = "Не удалось запустить Chrome через Playwright (см. логи)"
            started_event.set()

    @classmethod
    async def _launch_async(
        cls,
        account_name: str,
        profile_dir: Path,
        proxy_config: Optional[Dict[str, str]],
        start_url: str,
        stop_event: threading.Event,
        started_event: threading.Event,
    ) -> None:
        profile_dir.mkdir(parents=True, exist_ok=True)

        LOGGER.info("[%s] Launching Chrome via Playwright (profile=%s)", account_name, profile_dir)
        geo_config = cls._resolve_antidetect_config(account_name)

        chrome_args = [
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
            "--no-first-run",
            "--no-default-browser-check",
        ]

        # WebRTC режимы
        if geo_config["webrtc"] in {"disable", "replace_ip", "sync_with_proxy"}:
            chrome_args.append("--force-webrtc-ip-handling-policy=disable_non_proxied_udp")
            chrome_args.append("--enable-features=WebRtcHideLocalIpsWithMdns")
            chrome_args.append("--disable-quic")
            chrome_args.append("--enforce-webrtc-ip-permission-check")
            chrome_args.append("--disable-webrtc-multiple-routes")
            chrome_args.append("--disable-webrtc-hw-decoding")
            chrome_args.append("--disable-webrtc-hw-encoding")

        # DoH
        if geo_config.get("doh_enabled"):
            chrome_args.append("--enable-features=DnsOverHttps")
            chrome_args.append("--dns-over-https-servers=https://dns.google/dns-query")

        try:
            async with async_playwright() as playwright:
                context = await playwright.chromium.launch_persistent_context(
                    user_data_dir=str(profile_dir),
                    channel=cls.CHROME_CHANNEL,
                    headless=False,
                    proxy=proxy_config,
                    bypass_csp=True,
                    ignore_https_errors=True,
                    locale=geo_config["locale"],
                    viewport={
                        "width": geo_config["screen"]["width"],
                        "height": geo_config["screen"]["height"],
                        "deviceScaleFactor": geo_config["screen"]["dpr"],
                    },
                    user_agent=geo_config["user_agent"],
                    timezone_id=geo_config["timezone"],
                    permissions=["geolocation"],
                    geolocation=geo_config["geolocation"],
                    args=chrome_args,
                    extra_http_headers={
                        "Accept-Language": ",".join(geo_config["languages"]),
                        **({"DNT": "1"} if geo_config.get("dnt") else {}),
                        **cls._build_client_hints_headers(geo_config),
                    },
                )
                try:
                    cookies = await cls._load_cookies_from_slot(account_name)
                    if cookies:
                        await context.add_cookies(cookies)
                        LOGGER.info("[%s] Loaded %d cookies from slot", account_name, len(cookies))
                except Exception as exc:
                    LOGGER.warning("[%s] Failed to load cookies from slot: %s", account_name, exc)
                await context.add_init_script(cls._build_stealth_script(geo_config))
                extra_stealth = cls._load_stealth_script()
                if extra_stealth:
                    await context.add_init_script(extra_stealth)

                LOGGER.info("[%s] Chrome persistent context ready", account_name)
                started_event.set()

                if start_url and start_url != "about:blank":
                    page = await context.new_page()
                    try:
                        await page.goto(start_url, wait_until="domcontentloaded", timeout=30000)
                        LOGGER.info("[%s] Start URL loaded: %s", account_name, start_url)
                    except Exception:
                        LOGGER.exception("[%s] Failed to open start URL: %s", account_name, start_url)

                # Основной цикл: ждём остановки
                while not stop_event.is_set():
                    await asyncio.sleep(0.5)

                try:
                    current_cookies = await context.cookies()
                    await cls._save_cookies_to_slot(account_name, current_cookies)
                    LOGGER.info("[%s] Saved %d cookies to slot", account_name, len(current_cookies))
                except Exception as exc:
                    LOGGER.error("[%s] Failed to save cookies: %s", account_name, exc)

                await context.close()
                LOGGER.info("[%s] Chrome context closed", account_name)
        except Exception as exc:
            LOGGER.exception("[%s] Unable to launch Chrome via Playwright", account_name)
            with cls._lock:
                ctx = cls._running.get(account_name)
                if ctx:
                    ctx.error = f"Playwright: {type(exc).__name__}: {exc}"
            started_event.set()
        finally:
            with cls._lock:
                ctx = cls._running.get(account_name)
                if ctx and ctx.thread is threading.current_thread():
                    cls._running.pop(account_name, None)

    @staticmethod
    def _base_antidetect_presets() -> Dict[str, Dict[str, Any]]:
        return {
            "usa": {
                "geo": "usa",
                "timezone": "America/New_York",
            "locale": "en-US",
            "languages": ["en-US", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 40.7128, "longitude": -74.006, "accuracy": 100, "jitter": 0.01},
            "screen": {
                "width": 1920,
                "height": 1080,
                "dpr": 1.0,
                "options": [
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                    {"width": 1366, "height": 768, "dpr": 1.0},
                    {"width": 1440, "height": 900, "dpr": 1.25},
                ],
            },
            "hardware": {
                "cores": 8,
                "memory": 8,
                "platform": "Windows",
                "device_name": "Windows 11",
                "coresOptions": [4, 6, 8],
                "memoryOptions": [4, 8, 16],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) Iris(R) Xe Graphics"},
                    {"vendor": "AMD", "renderer": "Radeon RX 6600"},
                ],
            },
            "webrtc": "replace_ip",
            "canvas_noise": "light",
            "webgl_noise": True,
            "audio_noise": True,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
            "russia": {
                "geo": "russia",
                "timezone": "Europe/Moscow",
            "locale": "ru-RU",
            "languages": ["ru-RU", "ru", "en-US", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 55.7558, "longitude": 37.6173, "accuracy": 100, "jitter": 0.01},
            "screen": {
                "width": 1920,
                "height": 1080,
                "dpr": 1.0,
                "options": [
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                    {"width": 1600, "height": 900, "dpr": 1.25},
                    {"width": 1366, "height": 768, "dpr": 1.0},
                ],
            },
            "hardware": {
                "cores": 8,
                "memory": 8,
                "platform": "Windows",
                "device_name": "Windows 11",
                "coresOptions": [4, 6, 8],
                "memoryOptions": [4, 8],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) HD Graphics 630"},
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) Iris(R) Graphics 6100"},
                ],
            },
            "webrtc": "disable",
            "canvas_noise": "medium",
            "webgl_noise": True,
            "audio_noise": False,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
            "kazakhstan": {
                "geo": "kazakhstan",
                "timezone": "Asia/Almaty",
            "locale": "ru-KZ",
            "languages": ["ru-KZ", "ru", "en-US", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 51.1694, "longitude": 71.4491, "accuracy": 100, "jitter": 0.01},
            "screen": {
                "width": 1920,
                "height": 1080,
                "dpr": 1.0,
                "options": [
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                    {"width": 1366, "height": 768, "dpr": 1.0},
                ],
            },
            "hardware": {
                "cores": 6,
                "memory": 8,
                "platform": "Windows",
                "device_name": "Windows 10",
                "coresOptions": [4, 6],
                "memoryOptions": [4, 8],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 610"},
                ],
            },
            "webrtc": "disable",
            "canvas_noise": "light",
            "webgl_noise": False,
            "audio_noise": False,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
            "nigeria": {
                "geo": "nigeria",
                "timezone": "Africa/Lagos",
            "locale": "en-NG",
            "languages": ["en-NG", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 6.5244, "longitude": 3.3792, "accuracy": 150, "jitter": 0.01},
            "screen": {
                "width": 1366,
                "height": 768,
                "dpr": 1.0,
                "options": [
                    {"width": 1366, "height": 768, "dpr": 1.0},
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                ],
            },
            "hardware": {
                "cores": 6,
                "memory": 8,
                "platform": "Windows",
                "device_name": "Windows 10",
                "coresOptions": [4, 6],
                "memoryOptions": [4, 8],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
                    {"vendor": "AMD", "renderer": "Radeon RX 570"},
                ],
            },
            "webrtc": "replace_ip",
            "canvas_noise": "medium",
            "webgl_noise": True,
            "audio_noise": False,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
            "lithuania": {
                "geo": "lithuania",
                "timezone": "Europe/Vilnius",
            "locale": "lt-LT",
            "languages": ["lt-LT", "lt", "en-US", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 54.6872, "longitude": 25.2797, "accuracy": 100, "jitter": 0.01},
            "screen": {
                "width": 1920,
                "height": 1080,
                "dpr": 1.0,
                "options": [
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                    {"width": 1366, "height": 768, "dpr": 1.0},
                ],
            },
            "hardware": {
                "cores": 8,
                "memory": 16,
                "platform": "Windows",
                "device_name": "Windows 11",
                "coresOptions": [6, 8],
                "memoryOptions": [8, 16],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 630"},
                    {"vendor": "AMD", "renderer": "Radeon RX 5700"},
                ],
            },
            "webrtc": "replace_ip",
            "canvas_noise": "light",
            "webgl_noise": True,
            "audio_noise": True,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
            "custom": {
                "geo": "custom",
                "timezone": "UTC",
            "locale": "en-US",
            "languages": ["en-US", "en"],
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "user_agent_random": True,
            "user_agent_pool": [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            ],
            "geolocation": {"latitude": 0, "longitude": 0, "accuracy": 100, "jitter": 0.01},
            "screen": {
                "width": 1920,
                "height": 1080,
                "dpr": 1.0,
                "options": [
                    {"width": 1920, "height": 1080, "dpr": 1.0},
                    {"width": 1366, "height": 768, "dpr": 1.0},
                ],
            },
            "hardware": {
                "cores": 4,
                "memory": 8,
                "platform": "Windows",
                "device_name": "Desktop",
                "coresOptions": [4, 6],
                "memoryOptions": [8, 16],
                "webglProfiles": [
                    {"vendor": "Intel Inc.", "renderer": "Intel(R) UHD Graphics 620"},
                ],
            },
            "webrtc": "replace_ip",
            "canvas_noise": "light",
            "webgl_noise": True,
            "audio_noise": False,
            "fonts_spoofing": True,
                "dnt": False,
                "doh_enabled": True,
            },
        }

    @classmethod
    def _resolve_antidetect_config(cls, account_name: str) -> Dict[str, Any]:
        presets = cls._base_antidetect_presets()
        antidetect_notes: Dict[str, Any] = {}
        fingerprint = ""

        try:
            for acc in account_service.list_accounts():
                if acc.name == account_name:
                    try:
                        notes = json.loads(acc.notes) if acc.notes else {}
                    except Exception:
                        notes = {}
                    if isinstance(notes, dict):
                        if isinstance(notes.get("antidetect"), dict):
                            antidetect_notes = notes.get("antidetect") or {}
                        if isinstance(notes.get("fingerprint"), str):
                            fingerprint = notes.get("fingerprint") or ""
                    break
        except Exception:
            LOGGER.debug("[%s] Failed to resolve antidetect config, using defaults.", account_name, exc_info=True)

        geo = cls._geo_from_fingerprint(fingerprint)
        geo = antidetect_notes.get("geo", geo)
        base = presets.get(geo, presets.get("russia")) or presets["russia"]

        def merged_section(section: str, camel: Optional[str] = None) -> Dict[str, Any]:
            return {
                **base.get(section, {}),
                **(antidetect_notes.get(camel or section, {}) or {}),
            }

        def _choice(items: Optional[List[Any]], default: Any):
            if items and len(items) > 0:
                return random.choice(items)
            return default

        # Build config with snake_case keys expected by launcher
        config: Dict[str, Any] = {
            "geo": geo,
            "timezone": antidetect_notes.get("timezone", base.get("timezone")),
            "locale": antidetect_notes.get("locale", base.get("locale")),
            "languages": antidetect_notes.get("languages", base.get("languages", [])),
            "user_agent": antidetect_notes.get("userAgent", base.get("user_agent")),
            "user_agent_random": antidetect_notes.get("userAgentRandom", base.get("user_agent_random", False)),
            "user_agent_pool": antidetect_notes.get("userAgentPool", base.get("user_agent_pool", [])),
            "client_hints": antidetect_notes.get("clientHints", base.get("client_hints")),
            "geolocation": merged_section("geolocation"),
            "screen": merged_section("screen"),
            "hardware": merged_section("hardware"),
            "webrtc": antidetect_notes.get("webrtc", base.get("webrtc")),
            "canvas_noise": antidetect_notes.get("canvasNoise", base.get("canvas_noise")),
            "webgl_noise": antidetect_notes.get("webglNoise", base.get("webgl_noise")),
            "audio_noise": antidetect_notes.get("audioNoise", base.get("audio_noise")),
            "fonts_spoofing": antidetect_notes.get("fontsSpoofing", base.get("fonts_spoofing")),
            "dnt": antidetect_notes.get("dnt", base.get("dnt")),
            "doh_enabled": antidetect_notes.get("dohEnabled", base.get("doh_enabled")),
        }

        # Randomization: UA, screen, cores/memory, geolocation jitter, WebGL profile
        if config.get("user_agent_random") and config.get("user_agent_pool"):
            config["user_agent"] = _choice(config.get("user_agent_pool"), config.get("user_agent"))
        screen_opts = config.get("screen", {}).get("options")
        if isinstance(screen_opts, list) and screen_opts:
            config["screen"] = {
                **config["screen"],
                **_choice(screen_opts, config["screen"]),
            }
        hw = config.get("hardware", {})
        cores_opts = hw.get("coresOptions") or hw.get("cores_options")
        if cores_opts:
            hw["cores"] = _choice(cores_opts, hw.get("cores"))
        mem_opts = hw.get("memoryOptions") or hw.get("memory_options")
        if mem_opts:
            hw["memory"] = _choice(mem_opts, hw.get("memory"))
        webgl_profiles = hw.get("webglProfiles") or hw.get("webgl_profiles")
        webgl_pick = _choice(webgl_profiles, None)
        if webgl_pick:
            config["webgl_profile"] = webgl_pick
        config["hardware"] = hw

        geo_section = config.get("geolocation", {})
        jitter = geo_section.get("jitter")
        if jitter:
            geo_section = {
                **geo_section,
                "latitude": geo_section.get("latitude", 0) + (random.random() * 2 - 1) * jitter,
                "longitude": geo_section.get("longitude", 0) + (random.random() * 2 - 1) * jitter,
            }
            config["geolocation"] = geo_section

        # Align client hints with UA version
        ua_version = cls._extract_ua_version(str(config.get("user_agent") or "")) or "131"
        ch = config.get("client_hints") or {}
        if ch:
            brands = ch.get("brands") or []
            if brands and isinstance(brands, list):
                updated = []
                for b in brands:
                    if isinstance(b, dict):
                        updated.append({"brand": b.get("brand", ""), "version": ua_version})
                ch["brands"] = updated
            ch["fullVersion"] = ch.get("fullVersion") or ua_version
            config["client_hints"] = ch
        else:
            config["client_hints"] = {
                "brands": [
                    {"brand": "Chromium", "version": ua_version},
                    {"brand": "Not:A-Brand", "version": ua_version},
                    {"brand": "Google Chrome", "version": ua_version},
                ],
                "platform": hw.get("platform") or "Windows",
                "platformVersion": "10.0.0",
                "architecture": "x86",
                "bitness": "64",
                "fullVersion": ua_version,
                "mobile": False,
            }

        return config

    @staticmethod
    def _extract_ua_version(ua: str) -> Optional[str]:
        import re

        match = re.search(r"Chrome/(\d+)", ua)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def _geo_from_fingerprint(fingerprint: str) -> str:
        fp = (fingerprint or "").lower()
        if "usa" in fp:
            return "usa"
        if "kz" in fp or "kazakhstan" in fp:
            return "kazakhstan"
        if "nigeria" in fp or "ng" in fp:
            return "nigeria"
        if "lithuania" in fp or "lt" in fp:
            return "lithuania"
        return "russia"

    @staticmethod
    def _build_client_hints_headers(config: Dict[str, Any]) -> Dict[str, str]:
        hints = config.get("client_hints") or {}
        headers: Dict[str, str] = {}
        brands = hints.get("brands")
        if isinstance(brands, list) and brands:
            formatted = ", ".join(
                f"\"{b.get('brand','')}\";v=\"{b.get('version','')}\"" for b in brands if isinstance(b, dict)
            )
            if formatted:
                headers["sec-ch-ua"] = formatted
        if hints.get("platform"):
            headers["sec-ch-ua-platform"] = f"\"{hints.get('platform')}\""
        if hints.get("platformVersion"):
            headers["sec-ch-ua-platform-version"] = f"\"{hints.get('platformVersion')}\""
        if hints.get("architecture"):
            headers["sec-ch-ua-arch"] = f"\"{hints.get('architecture')}\""
        if hints.get("bitness"):
            headers["sec-ch-ua-bitness"] = f"\"{hints.get('bitness')}\""
        if hints.get("fullVersion"):
            headers["sec-ch-ua-full-version"] = f"\"{hints.get('fullVersion')}\""
        if hints.get("mobile") is not None:
            headers["sec-ch-ua-mobile"] = "?1" if hints.get("mobile") else "?0"
        return headers

    @staticmethod
    def _build_stealth_script(config: Dict[str, Any]) -> str:
        hardware = config.get("hardware", {})
        webgl_profile = config.get("webgl_profile") or (hardware.get("webglProfiles") or [{}])[0] if hardware else {}
        vendor = webgl_profile.get("vendor") or "Intel Inc."
        renderer = webgl_profile.get("renderer") or "Intel(R) UHD Graphics 620"
        cores = hardware.get("cores", 4)
        memory = hardware.get("memory", 8)
        platform = hardware.get("platform", "Windows")
        device_name = hardware.get("device_name", platform)
        canvas_noise_level = config.get("canvas_noise", "light")
        noise_map = {"off": 0, "light": 0.001, "medium": 0.01, "hard": 0.05}
        canvas_noise = noise_map.get(canvas_noise_level, 0.001)
        fonts_spoof = bool(config.get("fonts_spoofing", True))
        audio_noise = bool(config.get("audio_noise", False))
        webrtc_mode = config.get("webrtc", "replace_ip")
        webrtc_disable = webrtc_mode != "manual"
        client_hints = config.get("client_hints") or {}

        template = r"""
(() => {
    try {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    } catch (e) {}

    try {
        Object.defineProperty(navigator, 'platform', { get: () => __PLATFORM__ });
    } catch (e) {}

    try {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => __CORES__ });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => __MEMORY__ });
    } catch (e) {}

    try {
        if (window.chrome && window.chrome.runtime) {
            delete window.chrome.runtime;
        }
    } catch (e) {}

    try {
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission })
                : originalQuery(parameters)
        );
    } catch (e) {}

    try {
        const fakePlugins = [1, 2, 3, 4, 5];
        Object.defineProperty(navigator, 'plugins', { get: () => fakePlugins });
        Object.defineProperty(navigator, 'mimeTypes', { get: () => [] });
    } catch (e) {}

    try {
        const noise = __CANVAS_NOISE__;
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function() {
            try {
                const ctx = this.getContext('2d');
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = imageData.data[i] + noise * 255 * (Math.random() - 0.5);
                }
                ctx.putImageData(imageData, 0, 0);
            } catch (e) {}
            return originalToDataURL.apply(this, arguments);
        };
    } catch (e) {}

    try {
        const OVERRIDE_VENDOR = __WEBGL_VENDOR__;
        const OVERRIDE_RENDERER = __WEBGL_RENDERER__;
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return OVERRIDE_VENDOR;
            if (parameter === 37446) return OVERRIDE_RENDERER;
            return getParameter.apply(this, arguments);
        };
        if (window.WebGL2RenderingContext) {
            const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function(parameter) {
                if (parameter === 37445) return OVERRIDE_VENDOR;
                if (parameter === 37446) return OVERRIDE_RENDERER;
                return getParameter2.apply(this, arguments);
            };
        }
    } catch (e) {}

    if (__AUDIO_NOISE__) {
        try {
            const originalGetChannelData = AudioBuffer.prototype.getChannelData;
            AudioBuffer.prototype.getChannelData = function() {
                const results = originalGetChannelData.apply(this, arguments);
                for (let i = 0; i < results.length; i += 100) {
                    results[i] = results[i] + (Math.random() - 0.5) * 1e-7;
                }
                return results;
            };
        } catch (e) {}
    }

    try {
        navigator.getBattery = () => Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
            onchargingchange: null,
            onchargingtimechange: null,
            ondischargingtimechange: null,
            onlevelchange: null,
            addEventListener: () => {},
            removeEventListener: () => {}
        });
    } catch (e) {}

    try {
        const uaData = {
            brands: __CH_BRANDS__,
            mobile: __CH_MOBILE__,
            platform: __CH_PLATFORM__,
            platformVersion: __CH_PLATFORM_VERSION__
        };
        Object.defineProperty(navigator, 'userAgentData', { get: () => uaData });
    } catch (e) {}

    if (__WEBRTC_DISABLE__) {
        try {
            const blacklist = function() { return undefined; };
            window.RTCPeerConnection = blacklist;
            window.RTCSessionDescription = blacklist;
            window.RTCIceCandidate = blacklist;
        } catch (e) {}
    }

    if (__FONTS_SPOOF__) {
        try {
            const fonts = ["Arial", "Calibri", "Segoe UI", "Courier New", "Verdana"];
            Object.defineProperty(navigator, 'fonts', { get: () => fonts });
        } catch (e) {}
    }
})();
"""
        script = template
        script = script.replace("__WEBGL_VENDOR__", json.dumps(vendor))
        script = script.replace("__WEBGL_RENDERER__", json.dumps(renderer))
        script = script.replace("__CORES__", str(cores))
        script = script.replace("__MEMORY__", str(memory))
        script = script.replace("__PLATFORM__", json.dumps(platform or device_name))
        script = script.replace("__CANVAS_NOISE__", str(canvas_noise))
        script = script.replace("__AUDIO_NOISE__", "true" if audio_noise else "false")
        script = script.replace("__WEBRTC_DISABLE__", "true" if webrtc_disable else "false")
        script = script.replace("__FONTS_SPOOF__", "true" if fonts_spoof else "false")
        ch_brands = json.dumps(client_hints.get("brands") or [])
        script = script.replace("__CH_BRANDS__", ch_brands)
        script = script.replace("__CH_MOBILE__", "true" if client_hints.get("mobile") else "false")
        script = script.replace("__CH_PLATFORM__", json.dumps(client_hints.get("platform") or platform))
        script = script.replace("__CH_PLATFORM_VERSION__", json.dumps(client_hints.get("platformVersion") or ""))
        return script

    # ---------------------------------------------------------------- parsing helpers
    @staticmethod
    def _resolve_profile(profile_path: str) -> Path:
        path = Path(profile_path)
        if not path.is_absolute():
            path = (PROFILES / path).resolve()
        return path

    # ---------------------------------------------------------------- cookies helpers
    @classmethod
    async def _load_cookies_from_slot(cls, account_name: str) -> list:
        """Load cookies for active slot."""
        try:
            from sqlalchemy import select
            from core.db import SessionLocal
            from core.models import Account, ProfileSlot
        except Exception as exc:
            LOGGER.error("[%s] Cannot import DB modules: %s", account_name, exc)
            return []

        try:
            with SessionLocal() as session:
                account_stmt = select(Account).where(Account.name == account_name)
                account = session.execute(account_stmt).scalar_one_or_none()
                if not account or not account.active_slot_id:
                    return []
                slot = (
                    session.query(ProfileSlot)
                    .filter(ProfileSlot.id == account.active_slot_id)
                    .first()
                )
                if not slot or not slot.cookies_file:
                    return []
                cookies_path = Path(slot.cookies_file)
                if not cookies_path.exists():
                    return []
                return json.loads(cookies_path.read_text(encoding="utf-8"))
        except Exception as exc:
            LOGGER.error("[%s] Error loading cookies from slot: %s", account_name, exc)
            return []

    @classmethod
    async def _save_cookies_to_slot(cls, account_name: str, cookies: list) -> None:
        """Persist cookies to active slot and update metadata."""
        try:
            from sqlalchemy import select
            from core.db import SessionLocal
            from core.models import Account, ProfileSlot
        except Exception as exc:
            LOGGER.error("[%s] Cannot import DB modules: %s", account_name, exc)
            return

        try:
            with SessionLocal() as session:
                account_stmt = select(Account).where(Account.name == account_name)
                account = session.execute(account_stmt).scalar_one_or_none()
                if not account or not account.active_slot_id:
                    return
                slot = (
                    session.query(ProfileSlot)
                    .filter(ProfileSlot.id == account.active_slot_id)
                    .first()
                )
                if not slot:
                    return

                profile_path = Path(slot.profile_path)
                cookies_path = profile_path / "cookies" / "cookies.json"
                cookies_path.parent.mkdir(parents=True, exist_ok=True)
                cookies_path.write_text(
                    json.dumps(cookies, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

                slot.cookies_file = str(cookies_path)
                from datetime import datetime
                slot.cookies_count = len(cookies)
                slot.last_updated = datetime.utcnow()
                try:
                    slot.profile_size = sum(
                        f.stat().st_size for f in profile_path.rglob("*") if f.is_file()
                    )
                except Exception:
                    pass
                session.commit()
        except Exception as exc:
            LOGGER.error("[%s] Error saving cookies to slot: %s", account_name, exc)

    @staticmethod
    def _load_stealth_script() -> str:
        """Load external stealth.js if present."""
        try:
            import sys
            if getattr(sys, "frozen", False):
                resources_dir = Path(sys.executable).parent / "resources"
            else:
                resources_dir = Path(__file__).resolve().parents[1] / "resources"
            stealth_file = resources_dir / "stealth.js"
            if stealth_file.exists():
                return stealth_file.read_text(encoding="utf-8")
        except Exception as exc:
            LOGGER.warning("Failed to load external stealth script: %s", exc)
        return ""

    @classmethod
    def _build_proxy_config(
        cls,
        account_name: str,
        proxy_server: Optional[str],
        proxy_username: Optional[str],
        proxy_password: Optional[str],
    ) -> Optional[Dict[str, str]]:
        if not proxy_server:
            return None

        data = cls._parse_proxy(
            proxy_server,
            proxy_username,
            proxy_password,
            account_name=account_name,
        )
        server = data["server"]

        config: Dict[str, str] = {"server": server}
        if data.get("username"):
            config["username"] = data["username"]
        if data.get("password"):
            config["password"] = data["password"]

        LOGGER.info(
            "[%s] Proxy config built: %s (auth=%s)",
            account_name,
            server,
            "yes" if config.get("username") else "no",
        )
        return config

    @staticmethod
    def _parse_proxy(
        proxy_server: str,
        proxy_username: Optional[str] = None,
        proxy_password: Optional[str] = None,
        *,
        account_name: str = "unknown",
    ) -> Dict[str, str]:
        """
        Нормализовать строку прокси и вернуть dict для Playwright.

        Принимает host:port или строку со схемой.
        Username/password по умолчанию берутся из аргументов, но если в строке
        была auth-часть user:pass@host:port — она будет использована.
        """
        raw = proxy_server.strip()
        if not raw:
            raise ValueError("Proxy server string is empty")

        # Если в строке уже есть схема, используем её, иначе считаем http
        parsed = urlparse(raw if "://" in raw else f"http://{raw}")
        if not parsed.hostname or not parsed.port:
            raise ValueError(f"Invalid proxy format: {proxy_server}")

        username = proxy_username or parsed.username or ""
        password = proxy_password or parsed.password or ""
        scheme = parsed.scheme or "http"

        host_port = f"{parsed.hostname}:{parsed.port}"
        server = f"{scheme}://{host_port}"

        return {
            "account": account_name,
            "server": server,
            "scheme": scheme,
            "host": parsed.hostname,
            "port": parsed.port,
            "username": username,
            "password": password,
        }

    # ------------------------------------------------------------------ HTTP helpers
    @classmethod
    async def get_http_session(cls, account_name: str):
        """
        Вернуть aiohttp.ClientSession с тем же прокси, что и у браузера.

        Используйте это для REST-запросов (Wordstat API и т.п.) чтобы гарантировать,
        что запросы идут через тот же прокси-канал.
        """
        if aiohttp is None:
            raise RuntimeError("aiohttp не установлен: pip install aiohttp")

        with cls._lock:
            ctx = cls._running.get(account_name)

        if ctx is None or not ctx.proxy_config:
            LOGGER.error("[%s] Proxy config not available for HTTP session", account_name)
            return None

        proxy_url = ctx.proxy_config["server"]
        username = ctx.proxy_config.get("username", "")
        password = ctx.proxy_config.get("password", "")

        connector = None
        if ProxyConnector is not None:
            try:
                connector = ProxyConnector.from_url(proxy_url)
            except Exception:
                LOGGER.debug("[%s] Failed to init ProxyConnector", account_name, exc_info=True)
                connector = None

        if connector is None:
            connector = aiohttp.TCPConnector(ssl=False)

        session = aiohttp.ClientSession(connector=connector, trust_env=False)

        if ProxyConnector is None or not isinstance(connector, ProxyConnector):
            session._default_proxy = proxy_url  # type: ignore[attr-defined]
            if username:
                session._default_proxy_auth = BasicAuth(username, password)  # type: ignore[attr-defined]

        LOGGER.info("[%s] HTTP session created via proxy %s", account_name, proxy_url)
        return session


__all__ = ["ChromeLauncherDirectParser"]
