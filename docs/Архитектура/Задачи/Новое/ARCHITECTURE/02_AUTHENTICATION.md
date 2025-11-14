# 02. РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ Рё СЃРµСЃСЃРёРё KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃРёСЃС‚РµРјС‹ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё, СЂР°Р±РѕС‚С‹ СЃ РєСѓРєР°РјРё Рё Chrome РїСЂРѕС„РёР»СЏРјРё**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [РћР±Р·РѕСЂ](#РѕР±Р·РѕСЂ)
- [Chrome РїСЂРѕС„РёР»Рё](#chrome-РїСЂРѕС„РёР»Рё)
- [Cookie СЃРёСЃС‚РµРјР°](#cookie-СЃРёСЃС‚РµРјР°)
- [Storage State](#storage-state)
- [РђРІС‚РѕР»РѕРіРёРЅ](#Р°РІС‚РѕР»РѕРіРёРЅ)
- [РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ](#РїСЂРёРјРµСЂС‹-РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ)

---

## РћР±Р·РѕСЂ

РЎРёСЃС‚РµРјР° Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё KeySet-MVP РїРѕСЃС‚СЂРѕРµРЅР° РЅР° СЂР°Р±РѕС‚Рµ СЃ **Chrome РїСЂРѕС„РёР»СЏРјРё** Рё **cookies**. Р’РјРµСЃС‚Рѕ С‚СЂР°РґРёС†РёРѕРЅРЅРѕР№ Р°РІС‚РѕСЂРёР·Р°С†РёРё С‡РµСЂРµР· Р»РѕРіРёРЅ/РїР°СЂРѕР»СЊ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ:

1. **Chrome profiles** вЂ” СЃРѕС…СЂР°РЅРµРЅРёРµ СЃРµСЃСЃРёР№ РІ РїР°РїРєР°С… РїСЂРѕС„РёР»РµР№
2. **Cookies extraction** вЂ” РёР·РІР»РµС‡РµРЅРёРµ РєСѓРєРѕРІ РёР· Chrome Р‘Р”
3. **Playwright storage_state** вЂ” JSON СЃРѕ РІСЃРµРјРё РєСѓРєР°РјРё Рё localStorage
4. **DPAPI decryption** вЂ” СЂР°СЃС€РёС„СЂРѕРІРєР° РєСѓРєРѕРІ Windows

### РџРѕС‚РѕРє Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ РЇРЅРґРµРєСЃ Р°РєРєР°СѓРЅС‚   в”‚
в”‚ + Chrome РїСЂРѕС„РёР»СЊ в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¬в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в–ј
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ Chrome СЃРѕС…СЂР°РЅСЏРµС‚ cookies РІ:    в”‚
в”‚ - Default/Cookies (SQLite DB)  в”‚
в”‚ - Encrypted (DPAPI v10/v11)    в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¬в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в–ј
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ KeySet РёР·РІР»РµРєР°РµС‚ cookies:      в”‚
в”‚ 1. РљРѕРїРёСЂСѓРµС‚ Cookies DB         в”‚
в”‚ 2. Р Р°СЃС€РёС„СЂРѕРІС‹РІР°РµС‚ С‡РµСЂРµР· DPAPI  в”‚
в”‚ 3. РљРѕРЅРІРµСЂС‚РёСЂСѓРµС‚ РІ Playwright   в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¬в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в–ј
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ РЎРѕС…СЂР°РЅРµРЅРёРµ:                    в”‚
в”‚ - Р‘Р” (Account.cookies JSON)    в”‚
в”‚ - storage_state.json           в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¬в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в–ј
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ РџР°СЂСЃРµСЂ РёСЃРїРѕР»СЊР·СѓРµС‚ cookies:     в”‚
в”‚ - context.add_cookies()        в”‚
в”‚ - РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ   в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
```

---

## Chrome РїСЂРѕС„РёР»Рё

### РЎС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕС„РёР»СЏ

Chrome РїСЂРѕС„РёР»СЊ вЂ” СЌС‚Рѕ РїР°РїРєР° РЅР° РґРёСЃРєРµ, СЃРѕРґРµСЂР¶Р°С‰Р°СЏ:

```
C:/AI/yandex/.profiles/user@example.com/
в”њв”Ђв”Ђ Default/
в”‚   в”њв”Ђв”Ђ Cookies                  # SQLite Р‘Р” СЃ РєСѓРєР°РјРё
в”‚   в”њв”Ђв”Ђ Network/
в”‚   в”‚   в””в”Ђв”Ђ Cookies              # РђР»СЊС‚РµСЂРЅР°С‚РёРІРЅРѕРµ СЂР°СЃРїРѕР»РѕР¶РµРЅРёРµ
в”‚   в”њв”Ђв”Ђ Local Storage/
в”‚   в”њв”Ђв”Ђ Cache/
в”‚   в””в”Ђв”Ђ Preferences              # JSON РЅР°СЃС‚СЂРѕР№РєРё
в”њв”Ђв”Ђ Local State                  # JSON СЃ encrypted_key РґР»СЏ v10 cookies
в””в”Ђв”Ђ storage_state.json           # Playwright storage (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
```

### Р Р°СЃРїРѕР»РѕР¶РµРЅРёРµ РїСЂРѕС„РёР»РµР№

**Р‘Р°Р·РѕРІР°СЏ РґРёСЂРµРєС‚РѕСЂРёСЏ:**
```python
BASE_DIR = Path(r"C:/AI/yandex")
PROFILES_DIR = BASE_DIR / ".profiles"
```

**Р”Р»СЏ РєР°Р¶РґРѕРіРѕ Р°РєРєР°СѓРЅС‚Р°:**
```python
profile_path = PROFILES_DIR / account_email
# РџСЂРёРјРµСЂ: C:/AI/yandex/.profiles/user@yandex.ru
```

### РќРѕСЂРјР°Р»РёР·Р°С†РёСЏ РїСѓС‚РµР№

```python
from keyset.services.chrome_launcher import ChromeLauncher

profile_path = ChromeLauncher._normalise_profile_path(
    profile_path=None,  # РёР»Рё СЃС‚СЂРѕРєР° РїСѓС‚Рё
    account="user@yandex.ru"
)
# Returns: Path object, СЃРѕР·РґР°С‘С‚ РµСЃР»Рё РЅРµ СЃСѓС‰РµСЃС‚РІСѓРµС‚
```

**Р›РѕРіРёРєР° РЅРѕСЂРјР°Р»РёР·Р°С†РёРё:**
1. Р•СЃР»Рё `profile_path` Р°Р±СЃРѕР»СЋС‚РЅС‹Р№ вЂ” РёСЃРїРѕР»СЊР·СѓРµС‚ РµРіРѕ
2. Р•СЃР»Рё РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅС‹Р№ вЂ” РґРѕР±Р°РІР»СЏРµС‚ `BASE_DIR`
3. Р•СЃР»Рё `None` вЂ” СЃРѕР·РґР°С‘С‚ РІ `.profiles/{account}`
4. РџСЂРѕРІРµСЂСЏРµС‚ СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ Рё СЃРѕР·РґР°С‘С‚ РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё

---

## Cookie СЃРёСЃС‚РµРјР°

### РўРёРїС‹ cookies

KeySet СЂР°Р±РѕС‚Р°РµС‚ СЃ С‚СЂРµРјСЏ РІРµСЂСЃРёСЏРјРё С€РёС„СЂРѕРІР°РЅРёСЏ Chrome cookies:

1. **РќРµ Р·Р°С€РёС„СЂРѕРІР°РЅРЅС‹Рµ** вЂ” СЃС‚Р°СЂС‹Рµ РІРµСЂСЃРёРё Chrome (value РєР°Рє РµСЃС‚СЊ)
2. **DPAPI** вЂ” Windows С€РёС„СЂРѕРІР°РЅРёРµ (СЂР°СЃС€РёС„СЂРѕРІС‹РІР°РµС‚СЃСЏ С‡РµСЂРµР· `win32crypt`)
3. **v10/v11** вЂ” AES-GCM С€РёС„СЂРѕРІР°РЅРёРµ СЃ master key

### РР·РІР»РµС‡РµРЅРёРµ cookies РёР· Chrome

**Р¤Р°Р№Р»:** `keyset/services/multiparser_manager.py`

#### 1. РџРѕР»СѓС‡РµРЅРёРµ РјР°СЃС‚РµСЂ-РєР»СЋС‡Р°

```python
def _get_chrome_master_key(profile_path: Path, logger_obj: logging.Logger) -> Optional[bytes]:
    """РР·РІР»РµС‡СЊ РјР°СЃС‚РµСЂ-РєР»СЋС‡ Chrome РґР»СЏ СЂР°СЃС€РёС„СЂРѕРІРєРё v10 cookie."""
    local_state_path = profile_path / "Local State"
    
    if not local_state_path.exists():
        return None
    
    data = json.loads(local_state_path.read_text(encoding="utf-8"))
    encrypted_key_b64 = data.get("os_crypt", {}).get("encrypted_key")
    
    if not encrypted_key_b64:
        return None
    
    encrypted_key = base64.b64decode(encrypted_key_b64)
    
    # РЈР±РёСЂР°РµРј РїСЂРµС„РёРєСЃ "DPAPI"
    if encrypted_key.startswith(b"DPAPI"):
        encrypted_key = encrypted_key[5:]
    
    # Р Р°СЃС€РёС„СЂРѕРІС‹РІР°РµРј С‡РµСЂРµР· Windows DPAPI
    master_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    
    return master_key
```

#### 2. Р Р°СЃС€РёС„СЂРѕРІРєР° Р·РЅР°С‡РµРЅРёСЏ cookie

```python
def _decrypt_chrome_value(
    encrypted_value: bytes,
    profile_path: Path,
    logger_obj: logging.Logger,
    master_key: Optional[bytes],
) -> str:
    """Р Р°СЃС€РёС„СЂРѕРІР°С‚СЊ Р·РЅР°С‡РµРЅРёРµ cookie РёР· Chrome (Windows DPAPI)."""
    
    if not encrypted_value:
        return ""
    
    # v10/v11 cookies (AES-GCM)
    if encrypted_value.startswith(b'v10') or encrypted_value.startswith(b'v11'):
        if not master_key:
            master_key = _get_chrome_master_key(profile_path, logger_obj)
            if not master_key:
                return ""
        
        # Р¤РѕСЂРјР°С‚: v10 + nonce (12 bytes) + ciphertext + tag (16 bytes)
        nonce = encrypted_value[3:15]
        ciphertext = encrypted_value[15:-16]
        tag = encrypted_value[-16:]
        
        aesgcm = AESGCM(master_key)
        decrypted = aesgcm.decrypt(nonce, ciphertext + tag, None)
    else:
        # РЎС‚Р°СЂС‹Р№ С„РѕСЂРјР°С‚ DPAPI
        decrypted = win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1]
    
    return decrypted.decode("utf-8", errors="ignore")
```

#### 3. РР·РІР»РµС‡РµРЅРёРµ РІСЃРµС… cookies

```python
def _extract_profile_cookies(profile_path: Path, logger_obj: logging.Logger) -> List[Dict[str, Any]]:
    """Р’С‹С‚Р°С‰РёС‚СЊ РєСѓРєРё РёР· Chrome-РїСЂРѕС„РёР»СЏ РЅР° РґРёСЃРєРµ Рё РїСЂРёРІРµСЃС‚Рё РІ С„РѕСЂРјР°С‚ Playwright."""
    
    # РџРѕРёСЃРє С„Р°Р№Р»Р° Cookies
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
    
    # РљРѕРїРёСЂСѓРµРј С„Р°Р№Р» (Chrome Р±Р»РѕРєРёСЂСѓРµС‚ РїСЂСЏРјРѕР№ РґРѕСЃС‚СѓРї)
    tmp_copy = Path(tempfile.gettempdir()) / f"cookies_{profile_path.name}_{int(time.time())}.db"
    shutil.copy2(source_path, tmp_copy)
    
    # Р§РёС‚Р°РµРј SQLite
    conn = sqlite3.connect(tmp_copy)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT host_key, name, value, encrypted_value, path, expires_utc,
               is_secure, is_httponly, samesite
        FROM cookies
    """)
    rows = cursor.fetchall()
    conn.close()
    
    # РџРѕР»СѓС‡Р°РµРј РјР°СЃС‚РµСЂ-РєР»СЋС‡ РѕРґРёРЅ СЂР°Р·
    master_key = _get_chrome_master_key(profile_path, logger_obj)
    
    cookies = []
    for host_key, name, value, encrypted_value, path_value, expires_utc, is_secure, is_httponly, same_site in rows:
        if not name:
            continue
        
        # Р Р°СЃС€РёС„СЂРѕРІС‹РІР°РµРј РµСЃР»Рё РЅСѓР¶РЅРѕ
        if not value and encrypted_value:
            value = _decrypt_chrome_value(encrypted_value, profile_path, logger_obj, master_key)
        
        if not value:
            continue
        
        # Р¤РёР»СЊС‚СЂСѓРµРј С‚РѕР»СЊРєРѕ Yandex cookies
        if "yandex" not in host_key and ".ya" not in host_key:
            continue
        
        # РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј РІ С„РѕСЂРјР°С‚ Playwright
        cookie_entry = {
            "name": name,
            "value": value,
            "domain": host_key if host_key.startswith(".") else f".{host_key}",
            "path": path_value or "/",
            "secure": bool(is_secure),
            "httpOnly": bool(is_httponly),
        }
        
        # РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј expires
        if expires_utc and expires_utc != 0:
            # Windows epoch (РјРёРєСЂРѕСЃРµРєСѓРЅРґС‹ СЃ 1601 Рі.) -> Unix epoch
            expires = int(expires_utc / 1_000_000 - 11644473600)
            if expires > 0:
                cookie_entry["expires"] = expires
        
        # SameSite Р°С‚СЂРёР±СѓС‚
        same_site_map = {0: "None", 1: "Lax", 2: "Strict"}
        if same_site in same_site_map:
            cookie_entry["sameSite"] = same_site_map[same_site]
        
        cookies.append(cookie_entry)
    
    tmp_copy.unlink(missing_ok=True)
    return cookies
```

### Р¤РѕСЂРјР°С‚ cookie РІ Playwright

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

### Р§С‚Рѕ С‚Р°РєРѕРµ storage_state?

**Storage state** вЂ” СЌС‚Рѕ JSON С„Р°Р№Р» РѕС‚ Playwright, СЃРѕРґРµСЂР¶Р°С‰РёР№:
- Р’СЃРµ cookies
- localStorage РґР°РЅРЅС‹Рµ
- sessionStorage РґР°РЅРЅС‹Рµ

### Р¤РѕСЂРјР°С‚ С„Р°Р№Р»Р°

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

### РЎРѕС…СЂР°РЅРµРЅРёРµ storage_state

```python
from playwright.async_api import BrowserContext

async def save_storage_state(context: BrowserContext, profile_path: Path):
    """РЎРѕС…СЂР°РЅРёС‚СЊ storage_state РІ С„Р°Р№Р»"""
    storage_file = profile_path / "storage_state.json"
    await context.storage_state(path=str(storage_file))
```

### Р—Р°РіСЂСѓР·РєР° storage_state

```python
from playwright.async_api import async_playwright

async with async_playwright() as pw:
    browser = await pw.chromium.launch()
    
    # Р—Р°РіСЂСѓР·РёС‚СЊ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёР№ state
    context = await browser.new_context(
        storage_state="path/to/storage_state.json"
    )
    
    # РўРµРїРµСЂСЊ context СЃРѕРґРµСЂР¶РёС‚ РІСЃРµ cookies Рё localStorage
```

---

## Р Р°Р±РѕС‚Р° СЃ cookies РІ РїР°СЂСЃРµСЂРµ

### Р—Р°РіСЂСѓР·РєР° cookies РёР· Р‘Р”

```python
async def load_cookies_from_db_to_context(
    context: BrowserContext,
    account_name: str,
    logger_obj: Optional[logging.Logger] = None,
) -> bool:
    """Р—Р°РіСЂСѓР·РёС‚СЊ РєСѓРєРё РёР· Р‘Р” Рё РґРѕР±Р°РІРёС‚СЊ РёС… РІ РєРѕРЅС‚РµРєСЃС‚ Р±СЂР°СѓР·РµСЂР°."""
    
    with SessionLocal() as session:
        stmt = select(Account).where(Account.name == account_name)
        account = session.execute(stmt).scalar_one_or_none()
        
        if not account or not account.cookies:
            return False
        
        # РџР°СЂСЃРёРј JSON
        cookies_payload = json.loads(account.cookies)
        
        if not isinstance(cookies_payload, list) or not cookies_payload:
            return False
        
        # Р”РѕР±Р°РІР»СЏРµРј cookies РІ РєРѕРЅС‚РµРєСЃС‚
        await context.add_cookies(cookies_payload)
        
        return True
```

### Р—Р°РіСЂСѓР·РєР° cookies РёР· РїСЂРѕС„РёР»СЏ

```python
async def load_cookies_from_profile_to_context(
    context: BrowserContext,
    account_name: str,
    profile_path: Path,
    logger_obj: Optional[logging.Logger] = None,
    persist: bool = True,
) -> bool:
    """Р—Р°РіСЂСѓР·РёС‚СЊ РєСѓРєРё РёР· Р»РѕРєР°Р»СЊРЅРѕРіРѕ Chrome-РїСЂРѕС„РёР»СЏ."""
    
    # РР·РІР»РµРєР°РµРј cookies РёР· Chrome SQLite DB
    cookies = _extract_profile_cookies(profile_path, logger_obj)
    
    if not cookies:
        return False
    
    # Р”РѕР±Р°РІР»СЏРµРј РІ РєРѕРЅС‚РµРєСЃС‚
    await context.add_cookies(cookies)
    
    # РћРїС†РёРѕРЅР°Р»СЊРЅРѕ СЃРѕС…СЂР°РЅСЏРµРј РІ Р‘Р”
    if persist:
        await save_cookies_to_db(account_name, context, logger_obj)
    
    return True
```

### РЎРѕС…СЂР°РЅРµРЅРёРµ cookies РІ Р‘Р”

```python
async def save_cookies_to_db(
    account_name: str,
    context: BrowserContext,
    logger_obj: Optional[logging.Logger] = None,
) -> None:
    """РЎРѕС…СЂР°РЅРёС‚СЊ С‚РµРєСѓС‰РёРµ РєСѓРєРё РёР· РєРѕРЅС‚РµРєСЃС‚Р° Р±СЂР°СѓР·РµСЂР° РІ Р±Р°Р·Сѓ РґР°РЅРЅС‹С…."""
    
    # РџРѕР»СѓС‡Р°РµРј РІСЃРµ cookies РёР· РєРѕРЅС‚РµРєСЃС‚Р°
    cookies = await context.cookies()
    
    with SessionLocal() as session:
        stmt = select(Account).where(Account.name == account_name)
        account = session.execute(stmt).scalar_one_or_none()
        
        if not account:
            return
        
        # РЎРѕС…СЂР°РЅСЏРµРј РєР°Рє JSON
        account.cookies = json.dumps(cookies, ensure_ascii=False)
        session.commit()
```

---

## РђРІС‚РѕР»РѕРіРёРЅ

### РџСЂРѕС†РµСЃСЃ Р°РІС‚РѕР»РѕРіРёРЅР°

```python
async def autologin_account(account: Account) -> Dict[str, Any]:
    """
    РђРІС‚РѕР»РѕРіРёРЅ Р°РєРєР°СѓРЅС‚Р° С‡РµСЂРµР· Playwright
    РћС‚РєСЂС‹РІР°РµС‚ Wordstat, РїСЂРѕРІРµСЂСЏРµС‚ Р°РІС‚РѕСЂРёР·Р°С†РёСЋ, СЃРѕС…СЂР°РЅСЏРµС‚ storage_state
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
        
        # РћС‚РєСЂС‹РІР°РµРј Wordstat
        await page.goto("https://wordstat.yandex.ru/", timeout=60000)
        await page.wait_for_load_state("domcontentloaded")
        
        current_url = page.url
        
        # РџСЂРѕРІРµСЂСЏРµРј Р°РІС‚РѕСЂРёР·РѕРІР°РЅ Р»Рё
        if "passport.yandex" in current_url or "passport.ya.ru" in current_url:
            await browser.close()
            return {
                "ok": False,
                "message": "РўСЂРµР±СѓРµС‚СЃСЏ СЂСѓС‡РЅРѕР№ РІС…РѕРґ (РѕС‚РєСЂС‹С‚Р° СЃС‚СЂР°РЅРёС†Р° РїР°СЃРїРѕСЂС‚Р°)"
            }
        
        # РЎРѕС…СЂР°РЅСЏРµРј storage_state
        await context.storage_state(path=str(storage_file))
        await browser.close()
        
        # РћР±РЅРѕРІР»СЏРµРј last_used_at РІ Р‘Р”
        with SessionLocal() as session:
            stmt = select(Account).where(Account.id == account.id)
            acc = session.execute(stmt).scalar_one_or_none()
            if acc:
                acc.last_used_at = datetime.utcnow()
                session.commit()
        
        return {
            "ok": True,
            "message": "РђРІС‚РѕСЂРёР·Р°С†РёСЏ СѓСЃРїРµС€РЅР°",
            "storage_path": str(storage_file)
        }
```

### РџСЂРѕРІРµСЂРєР° Р°РІС‚РѕСЂРёР·Р°С†РёРё

```python
async def verify_authorization(
    page: Page,
    account_name: str,
    logger_obj: logging.Logger
) -> bool:
    """РџСЂРѕРІРµСЂРёС‚СЊ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ Р»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅР° СЃС‚СЂР°РЅРёС†Рµ."""
    
    current_url = page.url
    
    # Р•СЃР»Рё СЂРµРґРёСЂРµРєС‚ РЅР° РїР°СЃРїРѕСЂС‚ вЂ” РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ
    if "passport.yandex" in current_url or "passport.ya.ru" in current_url:
        logger_obj.warning(f"[{account_name}] РќРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅ, РѕС‚РєСЂС‹С‚Р° СЃС‚СЂР°РЅРёС†Р° РїР°СЃРїРѕСЂС‚Р°")
        return False
    
    # РџСЂРѕРІРµСЂСЏРµРј РЅР°Р»РёС‡РёРµ РєРЅРѕРїРєРё РїСЂРѕС„РёР»СЏ РёР»Рё РґСЂСѓРіРѕРіРѕ РёРЅРґРёРєР°С‚РѕСЂР°
    try:
        # Р–РґС‘Рј СЌР»РµРјРµРЅС‚, РєРѕС‚РѕСЂС‹Р№ РµСЃС‚СЊ С‚РѕР»СЊРєРѕ Сѓ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅС‹С…
        await page.wait_for_selector('[data-bem*="user"]', timeout=5000)
        return True
    except:
        return False
```

---

## РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ

### 1. РЎРѕР·РґР°РЅРёРµ Р°РєРєР°СѓРЅС‚Р° СЃ Р°РІС‚РѕР»РѕРіРёРЅРѕРј

```python
from keyset.services.accounts import create_account, autologin_account

# РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚
account = create_account(
    name='test@yandex.ru',
    profile_path='/home/user/profiles/test',
    proxy='http://proxy:8080'
)

# Р—Р°РїСѓСЃС‚РёС‚СЊ Р°РІС‚РѕР»РѕРіРёРЅ
result = await autologin_account(account)

if result['ok']:
    print(f"вњ“ РђРІС‚РѕСЂРёР·Р°С†РёСЏ СѓСЃРїРµС€РЅР°")
    print(f"Storage state: {result['storage_path']}")
else:
    print(f"вњ— РћС€РёР±РєР°: {result['message']}")
```

### 2. РџР°СЂСЃРёРЅРі СЃ Р·Р°РіСЂСѓР·РєРѕР№ cookies

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
        
        # РџСЂРѕР±СѓРµРј Р·Р°РіСЂСѓР·РёС‚СЊ РёР· Р‘Р”
        loaded = await load_cookies_from_db_to_context(context, account_name)
        
        if not loaded:
            # РџСЂРѕР±СѓРµРј РёР·РІР»РµС‡СЊ РёР· РїСЂРѕС„РёР»СЏ
            loaded = await load_cookies_from_profile_to_context(
                context,
                account_name,
                profile_path,
                persist=True  # РЎРѕС…СЂР°РЅРёС‚СЊ РІ Р‘Р” РїРѕСЃР»Рµ РёР·РІР»РµС‡РµРЅРёСЏ
            )
        
        if not loaded:
            print("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ cookies")
            return
        
        # РўРµРїРµСЂСЊ РјРѕР¶РЅРѕ РїР°СЂСЃРёС‚СЊ СЃ Р°РІС‚РѕСЂРёР·Р°С†РёРµР№
        page = await context.new_page()
        await page.goto("https://wordstat.yandex.ru/")
```

### 3. РџСЂРѕРІРµСЂРєР° СЃС‚Р°С‚СѓСЃР° cookies

```python
from keyset.services.accounts import get_cookies_status

account = get_account(db, account_id=1)
status = get_cookies_status(account)

print(f"Cookies status: {status}")
# Р’С‹РІРµРґРµС‚: "12.3KB Chrome (Fresh)" РёР»Рё "РќРµС‚ РєСѓРєРѕРІ"
```

### 4. РЎРѕС…СЂР°РЅРµРЅРёРµ cookies РїРѕСЃР»Рµ РїР°СЂСЃРёРЅРіР°

```python
from keyset.services.multiparser_manager import save_cookies_to_db

# РџРѕСЃР»Рµ Р·Р°РІРµСЂС€РµРЅРёСЏ РїР°СЂСЃРёРЅРіР°
await save_cookies_to_db(account_name, context)
```

---

## Р’Р°Р¶РЅС‹Рµ Р·Р°РјРµС‡Р°РЅРёСЏ

### Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ

1. **Cookies С…СЂР°РЅСЏС‚СЃСЏ РІ Р‘Р” РІ РѕС‚РєСЂС‹С‚РѕРј РІРёРґРµ** (JSON)
2. **Local State encrypted_key Р·Р°С‰РёС‰С‘РЅ DPAPI** (Windows)
3. **Master key РєРµС€РёСЂСѓРµС‚СЃСЏ** РґР»СЏ РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚Рё

### РЎРѕРІРјРµСЃС‚РёРјРѕСЃС‚СЊ

- **Windows С‚РѕР»СЊРєРѕ** вЂ” DPAPI Рё win32crypt
- **Chrome 109+** вЂ” РґР»СЏ v10/v11 cookies
- **Playwright** вЂ” РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РєРѕРЅС‚РµРєСЃС‚РѕРј

### РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ

- **РљРµС€РёСЂРѕРІР°РЅРёРµ РјР°СЃС‚РµСЂ-РєР»СЋС‡Р°** вЂ” РЅРµ РёР·РІР»РµРєР°РµРј РїРѕРІС‚РѕСЂРЅРѕ
- **РљРѕРїРёСЂРѕРІР°РЅРёРµ Cookies DB** вЂ” Chrome Р±Р»РѕРєРёСЂСѓРµС‚ РїСЂСЏРјРѕР№ РґРѕСЃС‚СѓРї
- **Р’СЂРµРјРµРЅРЅС‹Рµ С„Р°Р№Р»С‹** вЂ” Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СѓРґР°Р»СЏСЋС‚СЃСЏ

### Troubleshooting

**РџСЂРѕР±Р»РµРјР°:** Cookies РЅРµ Р·Р°РіСЂСѓР¶Р°СЋС‚СЃСЏ
- РџСЂРѕРІРµСЂРёС‚СЊ СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ С„Р°Р№Р»Р° `Cookies`
- РџСЂРѕРІРµСЂРёС‚СЊ `Local State` РґР»СЏ v10/v11
- РџСЂРѕРІРµСЂРёС‚СЊ РїСЂР°РІР° РґРѕСЃС‚СѓРїР° Рє РїСЂРѕС„РёР»СЋ

**РџСЂРѕР±Р»РµРјР°:** РђРІС‚РѕСЂРёР·Р°С†РёСЏ РЅРµ РїСЂРѕС…РѕРґРёС‚
- РЈР±РµРґРёС‚СЊСЃСЏ С‡С‚Рѕ cookies СЃРІРµР¶РёРµ (< 14 РґРЅРµР№)
- РџСЂРѕРІРµСЂРёС‚СЊ РЅР°Р»РёС‡РёРµ Yandex cookies
- РџСЂРѕРІРµСЂРёС‚СЊ РїСЂРѕРєСЃРё РїРѕРґРєР»СЋС‡РµРЅРёРµ

### рџ”’ Security

- [13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md) вЂ” РєРѕРЅС‚СЂРѕР»СЊ РґРѕСЃС‚СѓРїР° Рє cookies, С€РёС„СЂРѕРІР°РЅРёРµ РїСЂРѕС„РёР»РµР№ Рё СЂРµРєРѕРјРµРЅРґР°С†РёРё РїРѕ С…СЂР°РЅРµРЅРёСЋ СЃРµРєСЂРµС‚РѕРІ

---

**РЎР»РµРґСѓСЋС‰РёР№ СЂР°Р·РґРµР»:** [03_ACCOUNTS_PROFILES.md](./03_ACCOUNTS_PROFILES.md) вЂ” РЈРїСЂР°РІР»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°РјРё Рё РїСЂРѕС„РёР»СЏРјРё
