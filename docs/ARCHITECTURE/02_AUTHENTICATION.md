# 02. Аутентификация и сессии KeySet-MVP

> **Документация системы аутентификации, работы с куками и Chrome профилями**

## 📋 Содержание

- [Обзор](#обзор)
- [Chrome профили](#chrome-профили)
- [Cookie система](#cookie-система)
- [Storage State](#storage-state)
- [Автологин](#автологин)
- [Примеры использования](#примеры-использования)

---

## Обзор

Система аутентификации KeySet-MVP построена на работе с **Chrome профилями** и **cookies**. Вместо традиционной авторизации через логин/пароль используется:

1. **Chrome profiles** — сохранение сессий в папках профилей
2. **Cookies extraction** — извлечение куков из Chrome БД
3. **Playwright storage_state** — JSON со всеми куками и localStorage
4. **DPAPI decryption** — расшифровка куков Windows

### Поток аутентификации

```
┌──────────────────┐
│ Яндекс аккаунт   │
│ + Chrome профиль │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ Chrome сохраняет cookies в:    │
│ - Default/Cookies (SQLite DB)  │
│ - Encrypted (DPAPI v10/v11)    │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ KeySet извлекает cookies:      │
│ 1. Копирует Cookies DB         │
│ 2. Расшифровывает через DPAPI  │
│ 3. Конвертирует в Playwright   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Сохранение:                    │
│ - БД (Account.cookies JSON)    │
│ - storage_state.json           │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Парсер использует cookies:     │
│ - context.add_cookies()        │
│ - Автоматическая авторизация   │
└────────────────────────────────┘
```

---

## Chrome профили

### Структура профиля

Chrome профиль — это папка на диске, содержащая:

```
C:/AI/yandex/.profiles/user@example.com/
├── Default/
│   ├── Cookies                  # SQLite БД с куками
│   ├── Network/
│   │   └── Cookies              # Альтернативное расположение
│   ├── Local Storage/
│   ├── Cache/
│   └── Preferences              # JSON настройки
├── Local State                  # JSON с encrypted_key для v10 cookies
└── storage_state.json           # Playwright storage (опционально)
```

### Расположение профилей

**Базовая директория:**
```python
BASE_DIR = Path(r"C:/AI/yandex")
PROFILES_DIR = BASE_DIR / ".profiles"
```

**Для каждого аккаунта:**
```python
profile_path = PROFILES_DIR / account_email
# Пример: C:/AI/yandex/.profiles/user@yandex.ru
```

### Нормализация путей

```python
from keyset.services.chrome_launcher import ChromeLauncher

profile_path = ChromeLauncher._normalise_profile_path(
    profile_path=None,  # или строка пути
    account="user@yandex.ru"
)
# Returns: Path object, создаёт если не существует
```

**Логика нормализации:**
1. Если `profile_path` абсолютный — использует его
2. Если относительный — добавляет `BASE_DIR`
3. Если `None` — создаёт в `.profiles/{account}`
4. Проверяет существование и создаёт при необходимости

---

## Cookie система

### Типы cookies

KeySet работает с тремя версиями шифрования Chrome cookies:

1. **Не зашифрованные** — старые версии Chrome (value как есть)
2. **DPAPI** — Windows шифрование (расшифровывается через `win32crypt`)
3. **v10/v11** — AES-GCM шифрование с master key

### Извлечение cookies из Chrome

**Файл:** `keyset/services/multiparser_manager.py`

#### 1. Получение мастер-ключа

```python
def _get_chrome_master_key(profile_path: Path, logger_obj: logging.Logger) -> Optional[bytes]:
    """Извлечь мастер-ключ Chrome для расшифровки v10 cookie."""
    local_state_path = profile_path / "Local State"
    
    if not local_state_path.exists():
        return None
    
    data = json.loads(local_state_path.read_text(encoding="utf-8"))
    encrypted_key_b64 = data.get("os_crypt", {}).get("encrypted_key")
    
    if not encrypted_key_b64:
        return None
    
    encrypted_key = base64.b64decode(encrypted_key_b64)
    
    # Убираем префикс "DPAPI"
    if encrypted_key.startswith(b"DPAPI"):
        encrypted_key = encrypted_key[5:]
    
    # Расшифровываем через Windows DPAPI
    master_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    
    return master_key
```

#### 2. Расшифровка значения cookie

```python
def _decrypt_chrome_value(
    encrypted_value: bytes,
    profile_path: Path,
    logger_obj: logging.Logger,
    master_key: Optional[bytes],
) -> str:
    """Расшифровать значение cookie из Chrome (Windows DPAPI)."""
    
    if not encrypted_value:
        return ""
    
    # v10/v11 cookies (AES-GCM)
    if encrypted_value.startswith(b'v10') or encrypted_value.startswith(b'v11'):
        if not master_key:
            master_key = _get_chrome_master_key(profile_path, logger_obj)
            if not master_key:
                return ""
        
        # Формат: v10 + nonce (12 bytes) + ciphertext + tag (16 bytes)
        nonce = encrypted_value[3:15]
        ciphertext = encrypted_value[15:-16]
        tag = encrypted_value[-16:]
        
        aesgcm = AESGCM(master_key)
        decrypted = aesgcm.decrypt(nonce, ciphertext + tag, None)
    else:
        # Старый формат DPAPI
        decrypted = win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1]
    
    return decrypted.decode("utf-8", errors="ignore")
```

#### 3. Извлечение всех cookies

```python
def _extract_profile_cookies(profile_path: Path, logger_obj: logging.Logger) -> List[Dict[str, Any]]:
    """Вытащить куки из Chrome-профиля на диске и привести в формат Playwright."""
    
    # Поиск файла Cookies
    candidates = [
        profile_path / "Default" / "Network" / "Cookies",
        profile_path / "Default" / "Cookies",
        profile_path / "Cookies",
    ]
    
    source_path = None
    for candidate in candidates:
        if candidate.exists():
            source_path = candidate
            break
    
    if not source_path:
        return []
    
    # Копируем файл (Chrome блокирует прямой доступ)
    tmp_copy = Path(tempfile.gettempdir()) / f"cookies_{profile_path.name}_{int(time.time())}.db"
    shutil.copy2(source_path, tmp_copy)
    
    # Читаем SQLite
    conn = sqlite3.connect(tmp_copy)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT host_key, name, value, encrypted_value, path, expires_utc,
               is_secure, is_httponly, samesite
        FROM cookies
    """)
    rows = cursor.fetchall()
    conn.close()
    
    # Получаем мастер-ключ один раз
    master_key = _get_chrome_master_key(profile_path, logger_obj)
    
    cookies = []
    for host_key, name, value, encrypted_value, path_value, expires_utc, is_secure, is_httponly, same_site in rows:
        if not name:
            continue
        
        # Расшифровываем если нужно
        if not value and encrypted_value:
            value = _decrypt_chrome_value(encrypted_value, profile_path, logger_obj, master_key)
        
        if not value:
            continue
        
        # Фильтруем только Yandex cookies
        if "yandex" not in host_key and ".ya" not in host_key:
            continue
        
        # Конвертируем в формат Playwright
        cookie_entry = {
            "name": name,
            "value": value,
            "domain": host_key if host_key.startswith(".") else f".{host_key}",
            "path": path_value or "/",
            "secure": bool(is_secure),
            "httpOnly": bool(is_httponly),
        }
        
        # Конвертируем expires
        if expires_utc and expires_utc != 0:
            # Windows epoch (микросекунды с 1601 г.) -> Unix epoch
            expires = int(expires_utc / 1_000_000 - 11644473600)
            if expires > 0:
                cookie_entry["expires"] = expires
        
        # SameSite атрибут
        same_site_map = {0: "None", 1: "Lax", 2: "Strict"}
        if same_site in same_site_map:
            cookie_entry["sameSite"] = same_site_map[same_site]
        
        cookies.append(cookie_entry)
    
    tmp_copy.unlink(missing_ok=True)
    return cookies
```

### Формат cookie в Playwright

```python
cookie_entry = {
    "name": "Session_id",
    "value": "3:1234567890.5.0.abcdef...",
    "domain": ".yandex.ru",
    "path": "/",
    "secure": True,
    "httpOnly": True,
    "expires": 1735689600,  # Unix timestamp
    "sameSite": "Lax"
}
```

---

## Storage State

### Что такое storage_state?

**Storage state** — это JSON файл от Playwright, содержащий:
- Все cookies
- localStorage данные
- sessionStorage данные

### Формат файла

```json
{
  "cookies": [
    {
      "name": "Session_id",
      "value": "3:1234567890.5.0.abcdef...",
      "domain": ".yandex.ru",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "expires": 1735689600,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://wordstat.yandex.ru",
      "localStorage": [
        {
          "name": "userSettings",
          "value": "{\"theme\":\"dark\"}"
        }
      ]
    }
  ]
}
```

### Сохранение storage_state

```python
from playwright.async_api import BrowserContext

async def save_storage_state(context: BrowserContext, profile_path: Path):
    """Сохранить storage_state в файл"""
    storage_file = profile_path / "storage_state.json"
    await context.storage_state(path=str(storage_file))
```

### Загрузка storage_state

```python
from playwright.async_api import async_playwright

async with async_playwright() as pw:
    browser = await pw.chromium.launch()
    
    # Загрузить существующий state
    context = await browser.new_context(
        storage_state="path/to/storage_state.json"
    )
    
    # Теперь context содержит все cookies и localStorage
```

---

## Работа с cookies в парсере

### Загрузка cookies из БД

```python
async def load_cookies_from_db_to_context(
    context: BrowserContext,
    account_name: str,
    logger_obj: Optional[logging.Logger] = None,
) -> bool:
    """Загрузить куки из БД и добавить их в контекст браузера."""
    
    with SessionLocal() as session:
        stmt = select(Account).where(Account.name == account_name)
        account = session.execute(stmt).scalar_one_or_none()
        
        if not account or not account.cookies:
            return False
        
        # Парсим JSON
        cookies_payload = json.loads(account.cookies)
        
        if not isinstance(cookies_payload, list) or not cookies_payload:
            return False
        
        # Добавляем cookies в контекст
        await context.add_cookies(cookies_payload)
        
        return True
```

### Загрузка cookies из профиля

```python
async def load_cookies_from_profile_to_context(
    context: BrowserContext,
    account_name: str,
    profile_path: Path,
    logger_obj: Optional[logging.Logger] = None,
    persist: bool = True,
) -> bool:
    """Загрузить куки из локального Chrome-профиля."""
    
    # Извлекаем cookies из Chrome SQLite DB
    cookies = _extract_profile_cookies(profile_path, logger_obj)
    
    if not cookies:
        return False
    
    # Добавляем в контекст
    await context.add_cookies(cookies)
    
    # Опционально сохраняем в БД
    if persist:
        await save_cookies_to_db(account_name, context, logger_obj)
    
    return True
```

### Сохранение cookies в БД

```python
async def save_cookies_to_db(
    account_name: str,
    context: BrowserContext,
    logger_obj: Optional[logging.Logger] = None,
) -> None:
    """Сохранить текущие куки из контекста браузера в базу данных."""
    
    # Получаем все cookies из контекста
    cookies = await context.cookies()
    
    with SessionLocal() as session:
        stmt = select(Account).where(Account.name == account_name)
        account = session.execute(stmt).scalar_one_or_none()
        
        if not account:
            return
        
        # Сохраняем как JSON
        account.cookies = json.dumps(cookies, ensure_ascii=False)
        session.commit()
```

---

## Автологин

### Процесс автологина

```python
async def autologin_account(account: Account) -> Dict[str, Any]:
    """
    Автологин аккаунта через Playwright
    Открывает Wordstat, проверяет авторизацию, сохраняет storage_state
    """
    
    profile_path = ChromeLauncher._normalise_profile_path(
        account.profile_path,
        account.name
    )
    profile_path.mkdir(parents=True, exist_ok=True)
    storage_file = profile_path / "storage_state.json"
    
    proxy_config = proxy_to_playwright(account.proxy)
    
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        
        context = await browser.new_context(
            proxy=proxy_config,
            viewport={"width": 1280, "height": 900}
        )
        
        page = await context.new_page()
        
        # Открываем Wordstat
        await page.goto("https://wordstat.yandex.ru/", timeout=60000)
        await page.wait_for_load_state("domcontentloaded")
        
        current_url = page.url
        
        # Проверяем авторизован ли
        if "passport.yandex" in current_url or "passport.ya.ru" in current_url:
            await browser.close()
            return {
                "ok": False,
                "message": "Требуется ручной вход (открыта страница паспорта)"
            }
        
        # Сохраняем storage_state
        await context.storage_state(path=str(storage_file))
        await browser.close()
        
        # Обновляем last_used_at в БД
        with SessionLocal() as session:
            stmt = select(Account).where(Account.id == account.id)
            acc = session.execute(stmt).scalar_one_or_none()
            if acc:
                acc.last_used_at = datetime.utcnow()
                session.commit()
        
        return {
            "ok": True,
            "message": "Авторизация успешна",
            "storage_path": str(storage_file)
        }
```

### Проверка авторизации

```python
async def verify_authorization(
    page: Page,
    account_name: str,
    logger_obj: logging.Logger
) -> bool:
    """Проверить авторизован ли пользователь на странице."""
    
    current_url = page.url
    
    # Если редирект на паспорт — не авторизован
    if "passport.yandex" in current_url or "passport.ya.ru" in current_url:
        logger_obj.warning(f"[{account_name}] Не авторизован, открыта страница паспорта")
        return False
    
    # Проверяем наличие кнопки профиля или другого индикатора
    try:
        # Ждём элемент, который есть только у авторизованных
        await page.wait_for_selector('[data-bem*="user"]', timeout=5000)
        return True
    except:
        return False
```

---

## Примеры использования

### 1. Создание аккаунта с автологином

```python
from keyset.services.accounts import create_account, autologin_account

# Создать аккаунт
account = create_account(
    name='test@yandex.ru',
    profile_path='/home/user/profiles/test',
    proxy='http://proxy:8080'
)

# Запустить автологин
result = await autologin_account(account)

if result['ok']:
    print(f"✓ Авторизация успешна")
    print(f"Storage state: {result['storage_path']}")
else:
    print(f"✗ Ошибка: {result['message']}")
```

### 2. Парсинг с загрузкой cookies

```python
from playwright.async_api import async_playwright
from keyset.services.multiparser_manager import (
    load_cookies_from_db_to_context,
    load_cookies_from_profile_to_context
)

async def parse_with_auth(account_name: str, profile_path: Path):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        context = await browser.new_context()
        
        # Пробуем загрузить из БД
        loaded = await load_cookies_from_db_to_context(context, account_name)
        
        if not loaded:
            # Пробуем извлечь из профиля
            loaded = await load_cookies_from_profile_to_context(
                context,
                account_name,
                profile_path,
                persist=True  # Сохранить в БД после извлечения
            )
        
        if not loaded:
            print("Не удалось загрузить cookies")
            return
        
        # Теперь можно парсить с авторизацией
        page = await context.new_page()
        await page.goto("https://wordstat.yandex.ru/")
```

### 3. Проверка статуса cookies

```python
from keyset.services.accounts import get_cookies_status

account = get_account(db, account_id=1)
status = get_cookies_status(account)

print(f"Cookies status: {status}")
# Выведет: "12.3KB Chrome (Fresh)" или "Нет куков"
```

### 4. Сохранение cookies после парсинга

```python
from keyset.services.multiparser_manager import save_cookies_to_db

# После завершения парсинга
await save_cookies_to_db(account_name, context)
```

---

## Важные замечания

### Безопасность

1. **Cookies хранятся в БД в открытом виде** (JSON)
2. **Local State encrypted_key защищён DPAPI** (Windows)
3. **Master key кешируется** для производительности

### Совместимость

- **Windows только** — DPAPI и win32crypt
- **Chrome 109+** — для v10/v11 cookies
- **Playwright** — для управления контекстом

### Производительность

- **Кеширование мастер-ключа** — не извлекаем повторно
- **Копирование Cookies DB** — Chrome блокирует прямой доступ
- **Временные файлы** — автоматически удаляются

### Troubleshooting

**Проблема:** Cookies не загружаются
- Проверить существование файла `Cookies`
- Проверить `Local State` для v10/v11
- Проверить права доступа к профилю

**Проблема:** Авторизация не проходит
- Убедиться что cookies свежие (< 14 дней)
- Проверить наличие Yandex cookies
- Проверить прокси подключение

### 🔒 Security

- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) — контроль доступа к cookies, шифрование профилей и рекомендации по хранению секретов

---

**Следующий раздел:** [03_ACCOUNTS_PROFILES.md](./03_ACCOUNTS_PROFILES.md) — Управление аккаунтами и профилями
