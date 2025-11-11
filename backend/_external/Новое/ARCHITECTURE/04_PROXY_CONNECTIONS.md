# 04. Прокси система и подключения

> **Документация системы прокси, стратегий ротации и интеграции с парсером**

## 📋 Содержание

- [Обзор](#обзор)
- [ProxyManager](#proxymanager)
- [Структура прокси](#структура-прокси)
- [Стратегии использования](#стратегии-использования)
- [Хранение прокси](#хранение-прокси)
- [Интеграция с Playwright](#интеграция-с-playwright)
- [Проверка прокси](#проверка-прокси)
- [Примеры использования](#примеры-использования)

---

## Обзор

Прокси система KeySet-MVP обеспечивает:

1. **Централизованное управление** через `ProxyManager` (singleton)
2. **Поддержку типов:** `http`, `https`, `socks5`
3. **Аутентификацию:** username/password
4. **Стратегии:** `fixed` (постоянный) и `rotate` (ротация)
5. **Интеграцию с Chrome** через Playwright и CDP
6. **Проверку доступности** прокси

**Файлы:**
- `keyset/services/proxy_manager.py` — менеджер прокси
- `keyset/utils/proxy.py` — утилиты для конвертации URI
- `keyset/config/proxies.json` — хранение прокси
- `backend/db.py` — таблица `proxies` (опционально)

---

## ProxyManager

**Файл:** `keyset/services/proxy_manager.py`

### Singleton паттерн

```python
class ProxyManager:
    _instance: Optional["ProxyManager"] = None
    _singleton_lock = threading.Lock()

    @classmethod
    def instance(cls) -> "ProxyManager":
        if cls._instance is None:
            with cls._singleton_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
```

### Основные методы

```python
manager = ProxyManager.instance()

# Получить прокси по ID
proxy = manager.get(proxy_id='proxy_us_1')

# Получить все прокси
all_proxies = manager.list()

# Получить только активные прокси
active_proxies = manager.list_enabled()

# Добавить новый прокси
manager.add(
    proxy_id='proxy_new',
    label='US Proxy 1',
    proxy_type='http',
    server='proxy.example.com:8080',
    username='user',
    password='pass',
    geo='US'
)

# Обновить прокси
manager.update(
    proxy_id='proxy_us_1',
    enabled=False,
    notes='Временно отключен'
)

# Удалить прокси
manager.remove(proxy_id='proxy_old')

# Сохранить изменения в файл
manager.save()
```

### Ротация прокси

```python
# Получить следующий прокси (round-robin)
proxy = manager.next_enabled()

# Освободить прокси после использования
manager.release(proxy)
```

---

## Структура прокси

### Dataclass `Proxy`

```python
@dataclass
class Proxy:
    id: str
    label: str
    type: str                      # http/https/socks5
    server: str                    # host:port или схема://host:port
    username: Optional[str] = None
    password: Optional[str] = None
    geo: Optional[str] = None      # Код страны (RU, US, etc)
    sticky: bool = True            # Статический IP
    max_concurrent: int = 10       # Макс одновременных подключений
    enabled: bool = True
    notes: str = ""
    last_check: Optional[float] = None
    last_ip: Optional[str] = None
    _in_use: int = 0               # Счётчик использования
```

### Генерация URI

```python
proxy = Proxy(
    id='proxy_1',
    label='US Proxy',
    type='http',
    server='proxy.example.com:8080',
    username='user',
    password='pass123'
)

# С credentials
uri = proxy.uri(include_credentials=True)
# => http://user:pass123@proxy.example.com:8080

# Без credentials
uri = proxy.uri(include_credentials=False)
# => http://proxy.example.com:8080
```

### Playwright конфигурация

```python
config = proxy.playwright_config()
# => {
#     "server": "http://proxy.example.com:8080",
#     "username": "user",
#     "password": "pass123"
# }
```

### Chrome флаг

```python
flag = proxy.chrome_flag()
# => '--proxy-server="http://proxy.example.com:8080"'
```

---

## Стратегии использования

### 1. Fixed (постоянный)

Аккаунт привязан к одному прокси на всё время:

```python
account.proxy_strategy = 'fixed'
account.proxy_id = 'proxy_us_1'
```

При парсинге используется только `account.proxy`.

### 2. Rotate (ротация)

Прокси ротируется между запусками:

```python
account.proxy_strategy = 'rotate'
account.proxy_id = None  # Не привязан
```

При каждом парсинге:
```python
manager = ProxyManager.instance()
proxy = manager.next_enabled()
account.proxy = proxy.uri()
```

---

## Хранение прокси

### Файл: `keyset/config/proxies.json`

```json
{
  "proxies": [
    {
      "id": "proxy_us_1",
      "label": "US Datacenter 1",
      "type": "http",
      "server": "proxy.example.com:8080",
      "username": "user",
      "password": "pass123",
      "geo": "US",
      "sticky": true,
      "max_concurrent": 10,
      "enabled": true,
      "notes": "Primary US proxy"
    },
    {
      "id": "proxy_ru_mobile",
      "label": "RU Mobile",
      "type": "socks5",
      "server": "mobile.proxy.ru:1080",
      "username": null,
      "password": null,
      "geo": "RU",
      "sticky": false,
      "max_concurrent": 5,
      "enabled": true,
      "notes": "Mobile proxy with rotation"
    }
  ]
}
```

### Загрузка из файла

```python
def _load(self) -> None:
    """Загрузить прокси из файла."""
    if not self.path.exists():
        self._items = {}
        return

    try:
        data = json.loads(self.path.read_text(encoding='utf-8'))
        proxies = data.get('proxies', [])

        self._items = {}
        for item in proxies:
            proxy = Proxy(**item)
            self._items[proxy.id] = proxy
    except Exception as exc:
        logger.error(f"Failed to load proxies: {exc}")
        self._items = {}
```

### Сохранение в файл

```python
def save(self) -> None:
    """Сохранить прокси в файл."""
    with self._lock:
        proxies = [asdict(proxy) for proxy in self._items.values()]
        # Убираем внутренние поля
        for proxy in proxies:
            proxy.pop('_in_use', None)

        data = {'proxies': proxies}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
```

---

## Интеграция с Playwright

### Конвертация URI в Playwright config

**Файл:** `keyset/utils/proxy.py`

```python
def proxy_to_playwright(proxy_uri: str | None) -> dict | None:
    """Конвертировать URI прокси в Playwright конфиг."""
    if not proxy_uri:
        return None

    # Парсим URI: http://user:pass@host:port
    parsed = urlparse(proxy_uri)

    config = {
        'server': f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"
    }

    if parsed.username:
        config['username'] = parsed.username
    if parsed.password:
        config['password'] = parsed.password

    return config
```

### Использование в парсере

```python
from playwright.async_api import async_playwright
from keyset.utils.proxy import proxy_to_playwright

proxy_config = proxy_to_playwright(account.proxy)

async with async_playwright() as pw:
    browser = await pw.chromium.launch()
    context = await browser.new_context(proxy=proxy_config)

    page = await context.new_page()
    # Теперь все запросы идут через прокси
```

### С persistent context

```python
from playwright.async_api import async_playwright

proxy_config = proxy_to_playwright(proxy_uri)

async with async_playwright() as pw:
    context = await pw.chromium.launch_persistent_context(
        user_data_dir=str(profile_path),
        proxy=proxy_config,
        headless=False,
        channel='chrome'
    )
    # Профиль + прокси
```

---

## Проверка прокси

### Тест доступности

**Файл:** `keyset/services/accounts.py`

```python
async def test_proxy(proxy: Optional[str], timeout: int = 10) -> Dict[str, Any]:
    """
    Проверка прокси
    
    Returns:
        {"ok": True/False, "ip": "1.2.3.4" или "error": "описание ошибки"}
    """
    if not proxy:
        return {"ok": True, "ip": None, "message": "Без прокси"}

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=timeout)
        ) as session:
            async with session.get(
                "https://yandex.ru/internet",
                proxy=proxy,
                headers={"User-Agent": "Mozilla/5.0"}
            ) as resp:
                resp.raise_for_status()
                ip = resp.headers.get("x-client-ip") or "ok"
                return {"ok": True, "ip": ip}
    except Exception as e:
        return {"ok": False, "error": str(e)}
```

### Использование

```python
result = await test_proxy('http://user:pass@proxy:8080')

if result['ok']:
    print(f"✓ Прокси работает, IP: {result['ip']}")
else:
    print(f"✗ Ошибка: {result['error']}")
```

---

## Примеры использования

### 1. Добавление прокси в систему

```python
from keyset.services.proxy_manager import ProxyManager

manager = ProxyManager.instance()

manager.add(
    proxy_id='proxy_us_datacenter',
    label='US Datacenter Proxy',
    proxy_type='http',
    server='proxy.example.com:8080',
    username='myuser',
    password='mypass',
    geo='US',
    sticky=True,
    max_concurrent=10
)

manager.save()
```

### 2. Назначение прокси аккаунту

```python
from keyset.services.accounts import set_account_proxy

account = set_account_proxy(
    account_id=1,
    proxy_id='proxy_us_datacenter',
    strategy='fixed'
)

print(account.proxy)
# => http://myuser:mypass@proxy.example.com:8080
```

### 3. Ротация прокси перед парсингом

```python
from keyset.services.proxy_manager import ProxyManager
from keyset.services.accounts import update_account_proxy

manager = ProxyManager.instance()

# Получить следующий доступный прокси
proxy = manager.next_enabled()

if proxy:
    # Назначить аккаунту
    account = update_account_proxy(
        account_name='user@yandex.ru',
        proxy=proxy.uri()
    )

    # Использовать для парсинга
    # ... parsing logic ...

    # Освободить прокси
    manager.release(proxy)
```

### 4. Проверка всех прокси

```python
import asyncio
from keyset.services.proxy_manager import ProxyManager
from keyset.services.accounts import test_proxy

manager = ProxyManager.instance()
proxies = manager.list_enabled()

async def check_all():
    for proxy in proxies:
        result = await test_proxy(proxy.uri())
        status = "✓" if result['ok'] else "✗"
        ip = result.get('ip', result.get('error', ''))
        print(f"{status} {proxy.label}: {ip}")

asyncio.run(check_all())
```

### 5. Получение прокси с наименьшей нагрузкой

```python
from keyset.services.proxy_manager import ProxyManager

manager = ProxyManager.instance()

# Получить прокси с наименьшим _in_use
proxy = min(
    manager.list_enabled(),
    key=lambda p: p._in_use
)

# Занять прокси
proxy._in_use += 1

# Использовать...
# ...

# Освободить
proxy._in_use -= 1
```

### 6. Disable/Enable прокси

```python
from keyset.services.proxy_manager import ProxyManager

manager = ProxyManager.instance()

# Отключить прокси
manager.update(proxy_id='proxy_us_1', enabled=False)

# Включить прокси
manager.update(proxy_id='proxy_us_1', enabled=True)

manager.save()
```

---

## Важные замечания

### Безопасность

1. **Пароли хранятся открыто** в `proxies.json`
2. **Файл должен быть в .gitignore**
3. Рекомендуется шифрование конфига в production

### Производительность

- **Singleton** — один экземпляр на приложение
- **Thread-safe** — использует `threading.RLock()`
- **Кеширование** — прокси загружаются один раз

### Лимиты

- `max_concurrent` — ограничение одновременных подключений
- `_in_use` — счётчик текущего использования
- При превышении лимита прокси пропускается в ротации

### Типы прокси

Поддерживаются:
- `http` — HTTP прокси (по умолчанию)
- `https` — HTTPS прокси
- `socks5` — SOCKS5 прокси

### Интеграция с Chrome

Для Chrome с авторизацией прокси:
- Создаётся расширение (`ChromeLauncher._create_proxy_extension`)
- Расширение перехватывает `webRequest.onAuthRequired`
- Автоматически предоставляет credentials

### 🔒 Security

- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) — безопасное хранение proxy credentials, мониторинг использования и защита от утечек

---

**Следующий раздел:** [06_PARSING.md](./06_PARSING.md) — Парсинг системы
