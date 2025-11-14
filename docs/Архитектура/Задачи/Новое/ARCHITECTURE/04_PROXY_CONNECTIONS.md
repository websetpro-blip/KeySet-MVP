# 04. РџСЂРѕРєСЃРё СЃРёСЃС‚РµРјР° Рё РїРѕРґРєР»СЋС‡РµРЅРёСЏ

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ РїСЂРѕРєСЃРё, СЃС‚СЂР°С‚РµРіРёР№ СЂРѕС‚Р°С†РёРё Рё РёРЅС‚РµРіСЂР°С†РёРё СЃ РїР°СЂСЃРµСЂРѕРј**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [РћР±Р·РѕСЂ](#РѕР±Р·РѕСЂ)
- [ProxyManager](#proxymanager)
- [РЎС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕРєСЃРё](#СЃС‚СЂСѓРєС‚СѓСЂР°-РїСЂРѕРєСЃРё)
- [РЎС‚СЂР°С‚РµРіРёРё РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ](#СЃС‚СЂР°С‚РµРіРёРё-РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ)
- [РҐСЂР°РЅРµРЅРёРµ РїСЂРѕРєСЃРё](#С…СЂР°РЅРµРЅРёРµ-РїСЂРѕРєСЃРё)
- [РРЅС‚РµРіСЂР°С†РёСЏ СЃ Playwright](#РёРЅС‚РµРіСЂР°С†РёСЏ-СЃ-playwright)
- [РџСЂРѕРІРµСЂРєР° РїСЂРѕРєСЃРё](#РїСЂРѕРІРµСЂРєР°-РїСЂРѕРєСЃРё)
- [РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ](#РїСЂРёРјРµСЂС‹-РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ)

---

## РћР±Р·РѕСЂ

РџСЂРѕРєСЃРё СЃРёСЃС‚РµРјР° KeySet-MVP РѕР±РµСЃРїРµС‡РёРІР°РµС‚:

1. **Р¦РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅРѕРµ СѓРїСЂР°РІР»РµРЅРёРµ** С‡РµСЂРµР· `ProxyManager` (singleton)
2. **РџРѕРґРґРµСЂР¶РєСѓ С‚РёРїРѕРІ:** `http`, `https`, `socks5`
3. **РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЋ:** username/password
4. **РЎС‚СЂР°С‚РµРіРёРё:** `fixed` (РїРѕСЃС‚РѕСЏРЅРЅС‹Р№) Рё `rotate` (СЂРѕС‚Р°С†РёСЏ)
5. **РРЅС‚РµРіСЂР°С†РёСЋ СЃ Chrome** С‡РµСЂРµР· Playwright Рё CDP
6. **РџСЂРѕРІРµСЂРєСѓ РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё** РїСЂРѕРєСЃРё

**Р¤Р°Р№Р»С‹:**
- `keyset/services/proxy_manager.py` вЂ” РјРµРЅРµРґР¶РµСЂ РїСЂРѕРєСЃРё
- `keyset/utils/proxy.py` вЂ” СѓС‚РёР»РёС‚С‹ РґР»СЏ РєРѕРЅРІРµСЂС‚Р°С†РёРё URI
- `keyset/config/proxies.json` вЂ” С…СЂР°РЅРµРЅРёРµ РїСЂРѕРєСЃРё
- `backend/db.py` вЂ” С‚Р°Р±Р»РёС†Р° `proxies` (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)

---

## ProxyManager

**Р¤Р°Р№Р»:** `keyset/services/proxy_manager.py`

### Singleton РїР°С‚С‚РµСЂРЅ

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

### РћСЃРЅРѕРІРЅС‹Рµ РјРµС‚РѕРґС‹

```python
manager = ProxyManager.instance()

# РџРѕР»СѓС‡РёС‚СЊ РїСЂРѕРєСЃРё РїРѕ ID
proxy = manager.get(proxy_id='proxy_us_1')

# РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РїСЂРѕРєСЃРё
all_proxies = manager.list()

# РџРѕР»СѓС‡РёС‚СЊ С‚РѕР»СЊРєРѕ Р°РєС‚РёРІРЅС‹Рµ РїСЂРѕРєСЃРё
active_proxies = manager.list_enabled()

# Р”РѕР±Р°РІРёС‚СЊ РЅРѕРІС‹Р№ РїСЂРѕРєСЃРё
manager.add(
    proxy_id='proxy_new',
    label='US Proxy 1',
    proxy_type='http',
    server='proxy.example.com:8080',
    username='user',
    password='pass',
    geo='US'
)

# РћР±РЅРѕРІРёС‚СЊ РїСЂРѕРєСЃРё
manager.update(
    proxy_id='proxy_us_1',
    enabled=False,
    notes='Р’СЂРµРјРµРЅРЅРѕ РѕС‚РєР»СЋС‡РµРЅ'
)

# РЈРґР°Р»РёС‚СЊ РїСЂРѕРєСЃРё
manager.remove(proxy_id='proxy_old')

# РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ РІ С„Р°Р№Р»
manager.save()
```

### Р РѕС‚Р°С†РёСЏ РїСЂРѕРєСЃРё

```python
# РџРѕР»СѓС‡РёС‚СЊ СЃР»РµРґСѓСЋС‰РёР№ РїСЂРѕРєСЃРё (round-robin)
proxy = manager.next_enabled()

# РћСЃРІРѕР±РѕРґРёС‚СЊ РїСЂРѕРєСЃРё РїРѕСЃР»Рµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ
manager.release(proxy)
```

---

## РЎС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕРєСЃРё

### Dataclass `Proxy`

```python
@dataclass
class Proxy:
    id: str
    label: str
    type: str                      # http/https/socks5
    server: str                    # host:port РёР»Рё СЃС…РµРјР°://host:port
    username: Optional[str] = None
    password: Optional[str] = None
    geo: Optional[str] = None      # РљРѕРґ СЃС‚СЂР°РЅС‹ (RU, US, etc)
    sticky: bool = True            # РЎС‚Р°С‚РёС‡РµСЃРєРёР№ IP
    max_concurrent: int = 10       # РњР°РєСЃ РѕРґРЅРѕРІСЂРµРјРµРЅРЅС‹С… РїРѕРґРєР»СЋС‡РµРЅРёР№
    enabled: bool = True
    notes: str = ""
    last_check: Optional[float] = None
    last_ip: Optional[str] = None
    _in_use: int = 0               # РЎС‡С‘С‚С‡РёРє РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ
```

### Р“РµРЅРµСЂР°С†РёСЏ URI

```python
proxy = Proxy(
    id='proxy_1',
    label='US Proxy',
    type='http',
    server='proxy.example.com:8080',
    username='user',
    password='pass123'
)

# РЎ credentials
uri = proxy.uri(include_credentials=True)
# => http://user:pass123@proxy.example.com:8080

# Р‘РµР· credentials
uri = proxy.uri(include_credentials=False)
# => http://proxy.example.com:8080
```

### Playwright РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ

```python
config = proxy.playwright_config()
# => {
#     "server": "http://proxy.example.com:8080",
#     "username": "user",
#     "password": "pass123"
# }
```

### Chrome С„Р»Р°Рі

```python
flag = proxy.chrome_flag()
# => '--proxy-server="http://proxy.example.com:8080"'
```

---

## РЎС‚СЂР°С‚РµРіРёРё РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ

### 1. Fixed (РїРѕСЃС‚РѕСЏРЅРЅС‹Р№)

РђРєРєР°СѓРЅС‚ РїСЂРёРІСЏР·Р°РЅ Рє РѕРґРЅРѕРјСѓ РїСЂРѕРєСЃРё РЅР° РІСЃС‘ РІСЂРµРјСЏ:

```python
account.proxy_strategy = 'fixed'
account.proxy_id = 'proxy_us_1'
```

РџСЂРё РїР°СЂСЃРёРЅРіРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ С‚РѕР»СЊРєРѕ `account.proxy`.

### 2. Rotate (СЂРѕС‚Р°С†РёСЏ)

РџСЂРѕРєСЃРё СЂРѕС‚РёСЂСѓРµС‚СЃСЏ РјРµР¶РґСѓ Р·Р°РїСѓСЃРєР°РјРё:

```python
account.proxy_strategy = 'rotate'
account.proxy_id = None  # РќРµ РїСЂРёРІСЏР·Р°РЅ
```

РџСЂРё РєР°Р¶РґРѕРј РїР°СЂСЃРёРЅРіРµ:
```python
manager = ProxyManager.instance()
proxy = manager.next_enabled()
account.proxy = proxy.uri()
```

---

## РҐСЂР°РЅРµРЅРёРµ РїСЂРѕРєСЃРё

### Р¤Р°Р№Р»: `keyset/config/proxies.json`

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

### Р—Р°РіСЂСѓР·РєР° РёР· С„Р°Р№Р»Р°

```python
def _load(self) -> None:
    """Р—Р°РіСЂСѓР·РёС‚СЊ РїСЂРѕРєСЃРё РёР· С„Р°Р№Р»Р°."""
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

### РЎРѕС…СЂР°РЅРµРЅРёРµ РІ С„Р°Р№Р»

```python
def save(self) -> None:
    """РЎРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕРєСЃРё РІ С„Р°Р№Р»."""
    with self._lock:
        proxies = [asdict(proxy) for proxy in self._items.values()]
        # РЈР±РёСЂР°РµРј РІРЅСѓС‚СЂРµРЅРЅРёРµ РїРѕР»СЏ
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

## РРЅС‚РµРіСЂР°С†РёСЏ СЃ Playwright

### РљРѕРЅРІРµСЂС‚Р°С†РёСЏ URI РІ Playwright config

**Р¤Р°Р№Р»:** `keyset/utils/proxy.py`

```python
def proxy_to_playwright(proxy_uri: str | None) -> dict | None:
    """РљРѕРЅРІРµСЂС‚РёСЂРѕРІР°С‚СЊ URI РїСЂРѕРєСЃРё РІ Playwright РєРѕРЅС„РёРі."""
    if not proxy_uri:
        return None

    # РџР°СЂСЃРёРј URI: http://user:pass@host:port
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

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РІ РїР°СЂСЃРµСЂРµ

```python
from playwright.async_api import async_playwright
from keyset.utils.proxy import proxy_to_playwright

proxy_config = proxy_to_playwright(account.proxy)

async with async_playwright() as pw:
    browser = await pw.chromium.launch()
    context = await browser.new_context(proxy=proxy_config)

    page = await context.new_page()
    # РўРµРїРµСЂСЊ РІСЃРµ Р·Р°РїСЂРѕСЃС‹ РёРґСѓС‚ С‡РµСЂРµР· РїСЂРѕРєСЃРё
```

### РЎ persistent context

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
    # РџСЂРѕС„РёР»СЊ + РїСЂРѕРєСЃРё
```

---

## РџСЂРѕРІРµСЂРєР° РїСЂРѕРєСЃРё

### РўРµСЃС‚ РґРѕСЃС‚СѓРїРЅРѕСЃС‚Рё

**Р¤Р°Р№Р»:** `keyset/services/accounts.py`

```python
async def test_proxy(proxy: Optional[str], timeout: int = 10) -> Dict[str, Any]:
    """
    РџСЂРѕРІРµСЂРєР° РїСЂРѕРєСЃРё
    
    Returns:
        {"ok": True/False, "ip": "1.2.3.4" РёР»Рё "error": "РѕРїРёСЃР°РЅРёРµ РѕС€РёР±РєРё"}
    """
    if not proxy:
        return {"ok": True, "ip": None, "message": "Р‘РµР· РїСЂРѕРєСЃРё"}

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

### РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ

```python
result = await test_proxy('http://user:pass@proxy:8080')

if result['ok']:
    print(f"вњ“ РџСЂРѕРєСЃРё СЂР°Р±РѕС‚Р°РµС‚, IP: {result['ip']}")
else:
    print(f"вњ— РћС€РёР±РєР°: {result['error']}")
```

---

## РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ

### 1. Р”РѕР±Р°РІР»РµРЅРёРµ РїСЂРѕРєСЃРё РІ СЃРёСЃС‚РµРјСѓ

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

### 2. РќР°Р·РЅР°С‡РµРЅРёРµ РїСЂРѕРєСЃРё Р°РєРєР°СѓРЅС‚Сѓ

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

### 3. Р РѕС‚Р°С†РёСЏ РїСЂРѕРєСЃРё РїРµСЂРµРґ РїР°СЂСЃРёРЅРіРѕРј

```python
from keyset.services.proxy_manager import ProxyManager
from keyset.services.accounts import update_account_proxy

manager = ProxyManager.instance()

# РџРѕР»СѓС‡РёС‚СЊ СЃР»РµРґСѓСЋС‰РёР№ РґРѕСЃС‚СѓРїРЅС‹Р№ РїСЂРѕРєСЃРё
proxy = manager.next_enabled()

if proxy:
    # РќР°Р·РЅР°С‡РёС‚СЊ Р°РєРєР°СѓРЅС‚Сѓ
    account = update_account_proxy(
        account_name='user@yandex.ru',
        proxy=proxy.uri()
    )

    # РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґР»СЏ РїР°СЂСЃРёРЅРіР°
    # ... parsing logic ...

    # РћСЃРІРѕР±РѕРґРёС‚СЊ РїСЂРѕРєСЃРё
    manager.release(proxy)
```

### 4. РџСЂРѕРІРµСЂРєР° РІСЃРµС… РїСЂРѕРєСЃРё

```python
import asyncio
from keyset.services.proxy_manager import ProxyManager
from keyset.services.accounts import test_proxy

manager = ProxyManager.instance()
proxies = manager.list_enabled()

async def check_all():
    for proxy in proxies:
        result = await test_proxy(proxy.uri())
        status = "вњ“" if result['ok'] else "вњ—"
        ip = result.get('ip', result.get('error', ''))
        print(f"{status} {proxy.label}: {ip}")

asyncio.run(check_all())
```

### 5. РџРѕР»СѓС‡РµРЅРёРµ РїСЂРѕРєСЃРё СЃ РЅР°РёРјРµРЅСЊС€РµР№ РЅР°РіСЂСѓР·РєРѕР№

```python
from keyset.services.proxy_manager import ProxyManager

manager = ProxyManager.instance()

# РџРѕР»СѓС‡РёС‚СЊ РїСЂРѕРєСЃРё СЃ РЅР°РёРјРµРЅСЊС€РёРј _in_use
proxy = min(
    manager.list_enabled(),
    key=lambda p: p._in_use
)

# Р—Р°РЅСЏС‚СЊ РїСЂРѕРєСЃРё
proxy._in_use += 1

# РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ...
# ...

# РћСЃРІРѕР±РѕРґРёС‚СЊ
proxy._in_use -= 1
```

### 6. Disable/Enable РїСЂРѕРєСЃРё

```python
from keyset.services.proxy_manager import ProxyManager

manager = ProxyManager.instance()

# РћС‚РєР»СЋС‡РёС‚СЊ РїСЂРѕРєСЃРё
manager.update(proxy_id='proxy_us_1', enabled=False)

# Р’РєР»СЋС‡РёС‚СЊ РїСЂРѕРєСЃРё
manager.update(proxy_id='proxy_us_1', enabled=True)

manager.save()
```

---

## Р’Р°Р¶РЅС‹Рµ Р·Р°РјРµС‡Р°РЅРёСЏ

### Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ

1. **РџР°СЂРѕР»Рё С…СЂР°РЅСЏС‚СЃСЏ РѕС‚РєСЂС‹С‚Рѕ** РІ `proxies.json`
2. **Р¤Р°Р№Р» РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РІ .gitignore**
3. Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ С€РёС„СЂРѕРІР°РЅРёРµ РєРѕРЅС„РёРіР° РІ production

### РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ

- **Singleton** вЂ” РѕРґРёРЅ СЌРєР·РµРјРїР»СЏСЂ РЅР° РїСЂРёР»РѕР¶РµРЅРёРµ
- **Thread-safe** вЂ” РёСЃРїРѕР»СЊР·СѓРµС‚ `threading.RLock()`
- **РљРµС€РёСЂРѕРІР°РЅРёРµ** вЂ” РїСЂРѕРєСЃРё Р·Р°РіСЂСѓР¶Р°СЋС‚СЃСЏ РѕРґРёРЅ СЂР°Р·

### Р›РёРјРёС‚С‹

- `max_concurrent` вЂ” РѕРіСЂР°РЅРёС‡РµРЅРёРµ РѕРґРЅРѕРІСЂРµРјРµРЅРЅС‹С… РїРѕРґРєР»СЋС‡РµРЅРёР№
- `_in_use` вЂ” СЃС‡С‘С‚С‡РёРє С‚РµРєСѓС‰РµРіРѕ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ
- РџСЂРё РїСЂРµРІС‹С€РµРЅРёРё Р»РёРјРёС‚Р° РїСЂРѕРєСЃРё РїСЂРѕРїСѓСЃРєР°РµС‚СЃСЏ РІ СЂРѕС‚Р°С†РёРё

### РўРёРїС‹ РїСЂРѕРєСЃРё

РџРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ:
- `http` вЂ” HTTP РїСЂРѕРєСЃРё (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ)
- `https` вЂ” HTTPS РїСЂРѕРєСЃРё
- `socks5` вЂ” SOCKS5 РїСЂРѕРєСЃРё

### РРЅС‚РµРіСЂР°С†РёСЏ СЃ Chrome

Р”Р»СЏ Chrome СЃ Р°РІС‚РѕСЂРёР·Р°С†РёРµР№ РїСЂРѕРєСЃРё:
- РЎРѕР·РґР°С‘С‚СЃСЏ СЂР°СЃС€РёСЂРµРЅРёРµ (`ChromeLauncher._create_proxy_extension`)
- Р Р°СЃС€РёСЂРµРЅРёРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚ `webRequest.onAuthRequired`
- РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ credentials

### рџ”’ Security

- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) вЂ” Р±РµР·РѕРїР°СЃРЅРѕРµ С…СЂР°РЅРµРЅРёРµ proxy credentials, РјРѕРЅРёС‚РѕСЂРёРЅРі РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ Рё Р·Р°С‰РёС‚Р° РѕС‚ СѓС‚РµС‡РµРє

---

**РЎР»РµРґСѓСЋС‰РёР№ СЂР°Р·РґРµР»:** [06_PARSING.md](./06_PARSING.md) вЂ” РџР°СЂСЃРёРЅРі СЃРёСЃС‚РµРјС‹
