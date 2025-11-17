# -*- coding: utf-8 -*-
'''Launch Google Chrome profiles with proxy support.

This module wraps subprocess.Popen to start a regular Chrome instance
(for manual browsing) with proper proxy and profile handling inside the
C:/AI/yandex workspace.
'''
from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, Optional, Sequence

from services.proxy_extension import build_proxy_extension

LOGGER = logging.getLogger(__name__)


class ChromeLauncher:
    """Utility for launching system Chrome with a specific profile."""

    _CHROME_CANDIDATES: Sequence[Path] = (
        Path(r"C:/Program Files/Google/Chrome/Application/chrome.exe"),
        Path(r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
        Path.home() / "AppData/Local/Google/Chrome/Application/chrome.exe",
    )

    BASE_DIR = Path(r"C:/AI/yandex")
    DEFAULT_START_URL = "about:blank"
    EXTENSIONS_ROOT = BASE_DIR / "runtime" / "proxy_extensions"

    _processes: Dict[str, Dict[str, Optional[Path]]] = {}

    @classmethod
    def _resolve_chrome_executable(cls) -> str:
        for candidate in cls._CHROME_CANDIDATES:
            if candidate.exists():
                return str(candidate)
        raise FileNotFoundError(
            "Chrome executable not found. Adjust ChromeLauncher._CHROME_CANDIDATES."
        )


    @classmethod
    def _normalise_profile_path(cls, profile_path: Optional[str], account: str) -> Path:
        """Вернуть фактический путь профиля Chrome.

        Исторически рабочие профили лежат в ``C:/AI/yandex/.profiles``.
        Текущая рабочая директория также располагается в ``C:/AI/yandex``.
        По-прежнему поддерживаем старые абсолютные пути и не создаём новую
        пустую папку, если уже существует профиль из «легаси»-сборок.
        """

        legacy_root = Path(r"C:/AI/yandex")
        base_root = cls.BASE_DIR
        candidates: list[Path] = []

        def add_candidate(path: Path) -> None:
            resolved = path if path.is_absolute() else path
            if resolved not in candidates:
                candidates.append(resolved)

        if profile_path:
            raw = Path(str(profile_path).strip())
            if raw.is_absolute():
                add_candidate(raw)
                try:
                    relative = raw.relative_to(legacy_root)
                except ValueError:
                    pass
                else:
                    add_candidate(base_root / relative)
            else:
                add_candidate(base_root / raw)
                add_candidate(legacy_root / raw)
        else:
            add_candidate(base_root / ".profiles" / account)
            add_candidate(legacy_root / ".profiles" / account)

        for candidate in candidates:
            if candidate and candidate.exists():
                return candidate.resolve()

        # If nothing exists yet, fallback to first candidate (creates under new workspace)
        return candidates[0].resolve()

    @classmethod
    def _cleanup_entry(cls, account: str, data: Optional[Dict[str, Optional[Path]]]) -> None:
        if not data:
            return
        extension_dir = data.get('extension')
        if extension_dir:
            shutil.rmtree(extension_dir, ignore_errors=True)
        cls._processes.pop(account, None)

    @classmethod
    def _terminate_existing(cls, account: str) -> None:
        data = cls._processes.get(account)
        proc = data.get('proc') if data else None
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
            except Exception as exc:  # pragma: no cover
                LOGGER.warning("Unable to terminate Chrome for %s: %s", account, exc)
        cls._cleanup_entry(account, data)

    @classmethod
    def launch(
        cls,
        account: str,
        profile_path: Optional[str],
        cdp_port: int,
        proxy_server: Optional[str] = None,
        *,
        proxy_username: Optional[str] = None,
        proxy_password: Optional[str] = None,
        start_url: Optional[str] = None,
    ) -> subprocess.Popen:
        """Launch Chrome and return the running ``Popen`` object."""
        chrome_path = cls._resolve_chrome_executable()
        profile_dir = cls._normalise_profile_path(profile_path, account)
        profile_dir.mkdir(parents=True, exist_ok=True)

        cls._terminate_existing(account)

        args = [
            chrome_path,
            f"--user-data-dir={profile_dir.as_posix()}",
            f"--remote-debugging-port={cdp_port}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-blink-features=AutomationControlled",
        ]

        env = os.environ.copy()

        extension_dir: Optional[Path] = None
        if proxy_server:
            # Parse proxy server to get scheme
            scheme, sep, rest = proxy_server.partition('://')
            if sep:
                server_host = rest
                proxy_scheme = scheme or 'http'
            else:
                proxy_scheme = 'http'
                server_host = proxy_server

            # ВАЖНО: нужен --proxy-server даже когда используется расширение!
            args.append(f"--proxy-server={proxy_scheme}://{server_host}")

            if proxy_username and proxy_password:
                # Расширение обработает авторизацию через chrome.webRequest.onAuthRequired
                proxy_config = {
                    "server": proxy_server,
                    "username": proxy_username,
                    "password": proxy_password,
                }
                try:
                    extension_dir = build_proxy_extension(account, proxy_config, disable_webrtc=True)
                    ext_path = extension_dir.as_posix()
                    args.extend([
                        f"--load-extension={ext_path}",
                        f"--disable-extensions-except={ext_path}",
                    ])
                    LOGGER.info("Proxy extension created for %s at %s", account, ext_path)
                except Exception as exc:
                    LOGGER.warning("Failed to create proxy extension for %s: %s", account, exc)
                    extension_dir = None

        args.append(start_url or cls.DEFAULT_START_URL)

        LOGGER.info("Launching Chrome for %s (profile=%s, port=%s)", account, profile_dir, cdp_port)
        proc = subprocess.Popen(args, env=env)
        cls._processes[account] = {'proc': proc, 'extension': extension_dir}
        return proc

    @classmethod
    def terminate(cls, account: str) -> None:
        cls._terminate_existing(account)

    @classmethod
    def terminate_all(cls) -> None:
        for name in list(cls._processes):
            cls._terminate_existing(name)

    @classmethod
    def status(cls, account: Optional[str] = None) -> Dict[str, Dict[str, object]]:
        """Return running state for launched browsers.

        Args:
            account: конкретное имя аккаунта. Если ``None`` — вернуть статусы всех
                     известных процессов.

        Returns:
            Dict[str, Dict] c полями ``running`` (bool), ``pid`` (int | None),
            ``returncode`` (int | None).
        """
        targets = [account] if account else list(cls._processes.keys())
        result: Dict[str, Dict[str, object]] = {}
        for name in targets:
            if not name:
                continue
            data = cls._processes.get(name)
            if not data:
                result[name] = {'running': False, 'pid': None, 'returncode': None}
                continue
            proc = data.get('proc')
            running = bool(proc and proc.poll() is None)
            if running:
                result[name] = {'running': True, 'pid': proc.pid if proc else None, 'returncode': None}
            else:
                returncode = proc.returncode if proc else None
                result[name] = {'running': False, 'pid': proc.pid if proc else None, 'returncode': returncode}
                cls._cleanup_entry(name, data)
        return result
