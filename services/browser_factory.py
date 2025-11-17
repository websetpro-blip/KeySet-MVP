from __future__ import annotations

"""
Унифицированный запуск браузеров для аккаунтов.

Это порт рабочей логики из legacy keyset/services/browser_factory.py,
использующей Playwright для запуска Chrome с прокси и профилями.

Важное отличие от простого ChromeLauncher:
- Ветвь без CDP (use_cdp=False) использует `proxy_to_playwright` и
  параметр `proxy=...` Playwright, поэтому авторизация на прокси
  происходит автоматически (без диалога логина/пароля), как в
  рабочем парсере Wordstat.
"""

import json
import os
import shutil
import socket
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, Optional, List, Tuple

from playwright.sync_api import sync_playwright

from core.db import SessionLocal
from core.models import Account
from utils.proxy import proxy_to_playwright
from utils.text_fix import WORDSTAT_FETCH_NORMALIZER_SCRIPT
from services.proxy_manager import Proxy, ProxyManager
from services.chrome_launcher import ChromeLauncher

BASE_DIR = ChromeLauncher.BASE_DIR
RUNTIME_DIR = BASE_DIR / "runtime"
PROXY_EXT_DIR = RUNTIME_DIR / "proxy_extensions"
BROWSER_SETTINGS_PATH = BASE_DIR / "config" / "browser_settings.json"
_BROWSER_SETTINGS_CACHE: Optional[Dict[str, Any]] = None


@dataclass
class BrowserContextHandle:
  kind: str
  browser: Any
  context: Any
  page: Any
  proxy_id: Optional[str] = None
  release_cb: Callable[[], None] = lambda: None
  metadata: Dict[str, Any] = field(default_factory=dict)


def _load_browser_settings() -> Dict[str, Any]:
  global _BROWSER_SETTINGS_CACHE
  if _BROWSER_SETTINGS_CACHE is None:
    try:
      raw = BROWSER_SETTINGS_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
      _BROWSER_SETTINGS_CACHE = {}
    else:
      try:
        _BROWSER_SETTINGS_CACHE = json.loads(raw)
      except json.JSONDecodeError:
        _BROWSER_SETTINGS_CACHE = {}
  return _BROWSER_SETTINGS_CACHE or {}


def _browser_config_accounts() -> list[Dict[str, Any]]:
  settings = _load_browser_settings()
  accounts = settings.get("accounts")
  return accounts if isinstance(accounts, list) else []


def _browser_config_args() -> list[str]:
  settings = _load_browser_settings()
  args = settings.get("browser_args")
  if isinstance(args, list):
    return [str(item) for item in args if isinstance(item, str)]
  return []


def _config_entry_for_account(account_name: str) -> Optional[Dict[str, Any]]:
  for entry in _browser_config_accounts():
    if entry.get("name") == account_name:
      return entry
  return None


def _clear_system_proxy_env() -> None:
  for key in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"):
    os.environ.pop(key, None)


def _preflight_proxy(proxy_obj: Optional[Proxy], proxy_kwargs: Optional[Dict[str, str]]) -> Dict[str, Any]:
  """
  Упрощённый preflight: в MVP достаточно вернуть ok=True.

  В legacy версии выполнялась реальная проверка прокси. Здесь оставляем
  заглушку, чтобы не усложнять логику и не блокировать запуск.
  """
  return {"ok": True, "ip": None}


def _resolve_account(account_id: int) -> Account:
  with SessionLocal() as session:
    account = session.get(Account, account_id)
    if account is None:
      raise ValueError(f"Account {account_id} not found")
    return account


def _extract_fingerprint(account: Account) -> Optional[str]:
  """
  Достать пресет fingerprint из Account.notes (если там лежит JSON).

  Совместимо с front-end: extras = JSON(notes); extras.fingerprint -> строковый пресет.
  """
  raw = getattr(account, "notes", None) or ""
  if not raw:
    return None
  try:
    payload = json.loads(raw)
  except Exception:
    return None
  if isinstance(payload, dict):
    value = payload.get("fingerprint")
    if isinstance(value, str) and value.strip():
      return value.strip()
  return None


def _resolve_fingerprint(preset: Optional[str]) -> Tuple[Optional[str], str, Optional[str]]:
  """
  Вернуть (user_agent, locale, timezone_id) для выбранного fingerprint.

  Логика совпадает с TurboParser._resolve_fingerprint из turbo_parser_improved.py.
  """
  preset_normalized = (preset or "russia_standard").lower()

  ru_ua = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
  )

  if preset_normalized == "kazakhstan_standard":
    return (
      ru_ua,
      "ru-KZ",
      "Asia/Almaty",
    )

  if preset_normalized == "no_spoofing":
    return (
      None,
      "ru-RU",
      None,
    )

  # preset == russia_standard или любое неизвестное значение
  return (
    ru_ua,
    "ru-RU",
    "Europe/Moscow",
  )


def _normalize_profile_path(raw_path: Optional[str], account_name: str) -> Path:
  return ChromeLauncher._normalise_profile_path(raw_path, account_name)


def _prepare_proxy(
  account: Account,
  manager: ProxyManager,
  *,
  geo: Optional[str] = None,
) -> tuple[Optional[Proxy], Optional[Dict[str, str]]]:
  proxy_obj: Optional[Proxy] = None
  if account.proxy_id:
    proxy_obj = manager.acquire(account.proxy_id, geo=geo)
  if proxy_obj:
    return proxy_obj, proxy_obj.playwright_config()

  parsed = proxy_to_playwright(account.proxy)
  return None, parsed


def for_account(
  account_id: int,
  *,
  headless: bool = False,
  use_cdp: bool = False,
  chrome_path: Optional[str] = None,
  cdp_port: Optional[int] = None,
  args: Optional[list[str]] = None,
  geo: Optional[str] = None,
  profile_override: Optional[str] = None,
  target_url: Optional[str] = None,
) -> BrowserContextHandle:
  """
  Запустить браузер для аккаунта.

  В режиме use_cdp=False используется Playwright persistent context с proxy=...
  Это тот же механизм, что и в рабочем мультипарсере Wordstat.
  """
  _clear_system_proxy_env()

  account = _resolve_account(account_id)
  profile_dir = _normalize_profile_path(profile_override or account.profile_path, account.name)
  profile_dir.parent.mkdir(parents=True, exist_ok=True)

  manager = ProxyManager.instance()
  proxy_obj, proxy_kwargs = _prepare_proxy(account, manager, geo=geo)
  fingerprint_preset = _extract_fingerprint(account)
  user_agent, locale, timezone_id = _resolve_fingerprint(fingerprint_preset)

  additional_args = list(args or [])
  for extra_arg in _browser_config_args():
    if extra_arg not in additional_args:
      additional_args.append(extra_arg)

  # Для MVP: всегда используем ветку без CDP (Playwright persistent context).
  # Используем те же настройки, что и в рабочем turbo_parser_improved.py
  playwright = sync_playwright().start()
  launch_kwargs: Dict[str, Any] = {
    "user_data_dir": str(profile_dir),
    "headless": headless,
    "channel": "chrome",  # ВАЖНО: всегда channel, не executable_path!
    "proxy": proxy_kwargs,
    "args": [
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
      "--no-first-run",
      "--no-default-browser-check",
      *additional_args,
    ],
    "viewport": None,  # Полноэкранный режим
    "locale": locale,
  }
  if user_agent:
    launch_kwargs["user_agent"] = user_agent
  if timezone_id:
    launch_kwargs["timezone_id"] = timezone_id

  import logging
  LOGGER = logging.getLogger(__name__)
  LOGGER.info(f"[browser_factory] Launching browser for account_id={account_id}")
  LOGGER.info(f"[browser_factory] Profile: {profile_dir}")
  LOGGER.info(f"[browser_factory] Proxy config: {proxy_kwargs}")
  LOGGER.info(f"[browser_factory] Headless: {headless}")

  try:
    browser = playwright.chromium.launch_persistent_context(**launch_kwargs)
    LOGGER.info(f"[browser_factory] Browser launched successfully")
  except Exception as e:
    LOGGER.error(f"[browser_factory] Failed to launch: {e}")
    playwright.stop()
    manager.release(proxy_obj)
    raise

  browser.add_init_script(script=WORDSTAT_FETCH_NORMALIZER_SCRIPT)
  for existing_page in browser.pages:
    existing_page.add_init_script(script=WORDSTAT_FETCH_NORMALIZER_SCRIPT)
    try:
      existing_page.evaluate(WORDSTAT_FETCH_NORMALIZER_SCRIPT)
    except Exception:
      pass

  page = browser.pages[0] if browser.pages else browser.new_page()
  try:
    page.evaluate(WORDSTAT_FETCH_NORMALIZER_SCRIPT)
  except Exception:
    pass

  if target_url:
    try:
      page.goto(target_url, wait_until="networkidle")
    except Exception:
      try:
        page.goto(target_url)
      except Exception:
        pass

  def _release() -> None:
    try:
      browser.close()
    finally:
      try:
        playwright.stop()
      finally:
        manager.release(proxy_obj)

  return BrowserContextHandle(
    kind="playwright",
    browser=browser,
    context=browser,
    page=page,
    proxy_id=proxy_obj.id if proxy_obj else None,
    release_cb=_release,
    metadata={
      "profile_dir": str(profile_dir),
      "preflight": _preflight_proxy(proxy_obj, proxy_kwargs),
    },
  )
