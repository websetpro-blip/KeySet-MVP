# 13. Security Notes KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїРѕ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё: С…СЂР°РЅРµРЅРёРµ РґР°РЅРЅС‹С…, РґРѕСЃС‚СѓРїС‹, Р·Р°С‰РёС‚Р° РѕРєСЂСѓР¶РµРЅРёСЏ**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [Р¦РµР»СЊ](#С†РµР»СЊ)
- [Р”Р»СЏ РєРѕРіРѕ](#РґР»СЏ-РєРѕРіРѕ)
- [РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹](#СЃРІСЏР·Р°РЅРЅС‹Рµ-РґРѕРєСѓРјРµРЅС‚С‹)
- [РњРѕРґРµР»СЊ СѓРіСЂРѕР·](#РјРѕРґРµР»СЊ-СѓРіСЂРѕР·)
- [Р”РёР°РіСЂР°РјРјР° Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё](#РґРёР°РіСЂР°РјРјР°-Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё)
- [РљРѕРЅС‚СЂРѕР»Рё Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё](#РєРѕРЅС‚СЂРѕР»Рё-Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё)
- [РЎРЅРёРїРїРµС‚С‹](#СЃРЅРёРїРїРµС‚С‹)
- [РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё](#С‚РёРїРѕРІС‹Рµ-РѕС€РёР±РєРё)
- [Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚](#Р±С‹СЃС‚СЂС‹Р№-СЃС‚Р°СЂС‚)
- [TL;DR](#tldr)
- [Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ](#С‡РµРє-Р»РёСЃС‚-РїСЂРёРјРµРЅРµРЅРёСЏ)

---

## Р¦РµР»СЊ

РћРїСЂРµРґРµР»РёС‚СЊ С‚СЂРµР±РѕРІР°РЅРёСЏ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё KeySet-MVP: Р·Р°С‰РёС‚Р° Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРѕРЅРЅС‹С… РґР°РЅРЅС‹С…, РєРѕРЅС‚СЂРѕР»СЊ РґРѕСЃС‚СѓРїР° Рє Р‘Р”, Р±РµР·РѕРїР°СЃРЅРѕРµ С…СЂР°РЅРµРЅРёРµ cookies, СѓРїСЂР°РІР»РµРЅРёРµ СЃРµРєСЂРµС‚Р°РјРё.

## Р”Р»СЏ РєРѕРіРѕ

- Security РёРЅР¶РµРЅРµСЂС‹
- Tech Lead
- Backend СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРё
- DevOps РѕС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Рµ Р·Р° РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂСѓ

## РЎРІСЏР·Р°РЅРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹

- [02_AUTHENTICATION.md](./02_AUTHENTICATION.md) вЂ” cookies Рё РїСЂРѕС„РёР»Рё
- [04_PROXY_CONNECTIONS.md](./04_PROXY_CONNECTIONS.md) вЂ” РїСЂРѕРєСЃРё РєРѕРЅС„РёРіСѓСЂР°С†РёРё
- [12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md) вЂ” production СЃР±РѕСЂРєР°
- [14_LOGGING_OBSERVABILITY.md](./14_LOGGING_OBSERVABILITY.md) вЂ” Р»РѕРіРёСЂРѕРІР°РЅРёРµ

---

## РњРѕРґРµР»СЊ СѓРіСЂРѕР·

```mermaid
graph TD
    A[Assets] --> B[Cookies & Tokens]
    A --> C[Account Credentials]
    A --> D[SQLite Database]
    A --> E[Proxy Credentials]

    B --> F[Threat: Theft]
    C --> G[Threat: Brute Force]
    D --> H[Threat: Data Leak]
    E --> I[Threat: MitM]

    F --> J[Controls: Encryption]
    G --> K[Controls: Rate Limit]
    H --> L[Controls: Access Control]
    I --> M[Controls: TLS/Proxy Rotation]
```

---

## Р”РёР°РіСЂР°РјРјР° Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Vault as Secrets Vault
    participant App as KeySet App
    participant DB as SQLite DB
    participant Logs as Logging System
    
    Dev->>Vault: request secrets
    Vault-->>Dev: scoped token
    Dev->>App: configure .env (limited access)
    App->>DB: encrypted connection (WAL + password)
    App->>Logs: send sanitized logs
    Logs-->>Dev: read-only viewing
    App->>Vault: refresh credentials
```

---

## РљРѕРЅС‚СЂРѕР»Рё Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё

### 1. Credentials (РїР°СЂРѕР»Рё, С‚РѕРєРµРЅС‹)
- РҐСЂР°РЅРёС‚СЊ РІ `.env` СЃ РїСЂР°РІР°РјРё `600` (С‚РѕР»СЊРєРѕ РІР»Р°РґРµР»РµС†).
- **РќРёРєРѕРіРґР°** РЅРµ РєРѕРјРјРёС‚РёС‚СЊ СЃРµРєСЂРµС‚С‹ РІ Git (`git-secrets` hook).
- Р РѕС‚РёСЂРѕРІР°С‚СЊ РєР°РїС‚С‡Р°-РєР»СЋС‡Рё Рё Yandex С‚РѕРєРµРЅС‹ РјРёРЅРёРјСѓРј СЂР°Р· РІ 90 РґРЅРµР№.

### 2. Cookies & Profiles (DPAPI)
- РЁРёС„СЂРѕРІР°С‚СЊ РєСѓРєРё Windows DPAPI (`win32crypt.CryptUnprotectData`).
- РћРіСЂР°РЅРёС‡РёС‚СЊ РґРѕСЃС‚СѓРї Рє `C:\AI\yandex\.profiles` вЂ” С‚РѕР»СЊРєРѕ С‚РµРєСѓС‰РёР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ (ACL).
- РќРёРєРѕРіРґР° РЅРµ РїРµСЂРµРґР°РІР°С‚СЊ `encrypted_value` РїРѕ СЃРµС‚Рё Р±РµР· TLS.

### 3. Database (SQLite)
- Р’РєР»СЋС‡РёС‚СЊ WAL СЂРµР¶РёРј: `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=30000;`.
- РћРіСЂР°РЅРёС‡РёС‚СЊ РґРѕСЃС‚СѓРї Рє `keyset.db` (ACL, С‚РѕР»СЊРєРѕ Р»РѕРєР°Р»СЊРЅС‹Р№ owner).
- Р•Р¶РµРґРЅРµРІРЅС‹Р№ backup РІ С€РёС„СЂРѕРІР°РЅРЅС‹Р№ Р°СЂС…РёРІ (AES-256) РІРѕ РІРЅРµС€РЅРµРµ С…СЂР°РЅРёР»РёС‰Рµ.

### 4. Proxy & Network (РјР°СЃРєРёСЂРѕРІР°РЅРёРµ)
- РСЃРїРѕР»СЊР·СѓР№С‚Рµ HTTPS/SOCKS5 РїСЂРѕРєСЃРё СЃ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРµР№.
- Р’ Р»РѕРіР°С… РјР°СЃРєРёСЂСѓР№С‚Рµ РїР°СЂРѕР»Рё: `f"Proxy: {proxy[:10]}...{proxy[-4:]}"`.
- РћРіСЂР°РЅРёС‡СЊС‚Рµ trusted_hosts РІ production (whitelist IP).

### 5. Logging (С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ)
- Р­РєСЂР°РЅРёСЂСѓР№С‚Рµ cookies, passwords, apiKey РїРµСЂРµРґ Р·Р°РїРёСЃСЊСЋ.
- Audit trail: РєС‚Рѕ Р·Р°РїСѓСЃС‚РёР» РїР°СЂСЃРёРЅРі, РєРѕРіРґР°, РєР°РєРѕР№ region_id.
- Р РѕС‚Р°С†РёСЏ Р»РѕРіРѕРІ: СЂР°Р· РІ 30 РґРЅРµР№ СѓРґР°Р»СЏР№С‚Рµ СЃС‚Р°СЂС‹Рµ С„Р°Р№Р»С‹ (logrotate / Task Scheduler).

### 6. Р РѕС‚Р°С†РёСЏ РєР»СЋС‡РµР№ (actionable)
1. **РђРЅС‚РёРєР°РїС‡Р°/ProxyAPI**: СЂР°Р· РІ 3 РјРµСЃСЏС†Р° РіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РЅРѕРІС‹Рµ API-С‚РѕРєРµРЅС‹, РѕР±РЅРѕРІР»СЏС‚СЊ `.env`.
2. **Chrome profiles**: РµСЃР»Рё cookies СѓС‚РµРєР»Рё вЂ” СЃР±СЂРѕСЃРёС‚СЊ СЃРµСЃСЃРёРё Yandex, РїРµСЂРµСЃРѕР·РґР°С‚СЊ РїСЂРѕС„РёР»СЊ.
3. **DB secrets**: РїСЂРё СѓС‚РµС‡РєРµ `keyset.db` вЂ” РѕР±РЅСѓР»РёС‚СЊ СЃС‚РѕР»Р±РµС† `Account.cookies`, РїРµСЂРµР°РІС‚РѕСЂРёР·РѕРІР°С‚СЊ Р°РєРєР°СѓРЅС‚С‹.

### 7. Chek-Р»РёСЃС‚ РїРµСЂРµРґ production
- [ ] `.env` РІРЅРµ Git Рё РїР°РїРєР° `.profiles` СЃ ACL owner-only.
- [ ] DPAPI РєРѕСЂСЂРµРєС‚РЅРѕ РґРµС€РёС„СЂСѓРµС‚ РєСѓРєРё (С‚РµСЃС‚ РЅР° С‡РёСЃС‚РѕР№ VM).
- [ ] Р›РѕРіРё Р±РµР· raw cookies Рё РїР°СЂРѕР»РµР№.
- [ ] DB-Р±СЌРєР°РїС‹ С€РёС„СЂРѕРІР°РЅС‹ Рё Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅС‹.
- [ ] Proxy credentials С…СЂР°РЅСЏС‚СЃСЏ РІ encrypted СЃРµРєС†РёРё РєРѕРЅС„РёРіР°.
- [ ] Р’СЃРµ API РєР»СЋС‡Рё Р·Р°РґРѕРєСѓРјРµРЅС‚РёСЂРѕРІР°РЅС‹ Рё СЂРѕС‚РёСЂСѓСЋС‚СЃСЏ РїРѕ РіСЂР°С„РёРєСѓ.
- [ ] Pre-commit hooks Р±Р»РѕРєРёСЂСѓСЋС‚ РєРѕРјРјРёС‚С‹ СЃ СЃРµРєСЂРµС‚Р°РјРё.
- [ ] РРЅСЃС‚СЂСѓРєС†РёСЏ РїРѕ security incident response РіРѕС‚РѕРІР°.

---

## РЎРЅРёРїРїРµС‚С‹

### DPAPI СЂР°СЃС€РёС„СЂРѕРІРєР° cookies

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:63-91
def _get_chrome_master_key(profile_path: Path, logger_obj: logging.Logger) -> Optional[bytes]:
    resolved_path = profile_path.resolve()
    if resolved_path in _MASTER_KEY_CACHE:
        return _MASTER_KEY_CACHE[resolved_path]

    local_state_path = resolved_path / "Local State"
    if not local_state_path.exists():
        _MASTER_KEY_CACHE[resolved_path] = None
        return None

    try:
        data = json.loads(local_state_path.read_text(encoding="utf-8"))
        encrypted_key_b64 = data.get("os_crypt", {}).get("encrypted_key")
        if not encrypted_key_b64:
            _MASTER_KEY_CACHE[resolved_path] = None
            return None
        encrypted_key = base64.b64decode(encrypted_key_b64)
        if encrypted_key.startswith(b"DPAPI"):
            encrypted_key = encrypted_key[5:]
        master_key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
        _MASTER_KEY_CACHE[resolved_path] = master_key
        return master_key
    except Exception as exc:
        logger_obj.warning(f"[{profile_path.name}] РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РјР°СЃС‚РµСЂ-РєР»СЋС‡ Chrome: {exc}")
        _MASTER_KEY_CACHE[resolved_path] = None
        return None
```

### РЁРёС„СЂРѕРІР°РЅРёРµ proxy Рё cookies

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:94-118
def _decrypt_chrome_value(
    encrypted_value: bytes,
    profile_path: Path,
    logger_obj: logging.Logger,
    master_key: Optional[bytes],
) -> str:
    if not encrypted_value:
        return ""
    try:
        if encrypted_value.startswith(b'v10') or encrypted_value.startswith(b'v11'):
            if not AESGCM_AVAILABLE:
                return ""
            if not master_key:
                master_key = _get_chrome_master_key(profile_path, logger_obj)
                if not master_key:
                    return ""
            nonce = encrypted_value[3:15]
            ciphertext = encrypted_value[15:-16]
            tag = encrypted_value[-16:]
            aesgcm = AESGCM(master_key)
            decrypted = aesgcm.decrypt(nonce, ciphertext + tag, None)
        else:
            decrypted = win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1]
        return decrypted.decode("utf-8", errors="ignore")
    except Exception:
        return ""
```

### РњР°СЃРєРёСЂРѕРІР°РЅРёРµ Р»РѕРіРѕРІ

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:48-58
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(str(LOG_DIR / 'multiparser.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# РџСЂРёРјРµСЂ РјР°СЃРєРёСЂРѕРІРєРё
proxy_value = proxy if len(proxy) < 16 else f"{proxy[:10]}...{proxy[-4:]}"
logger.info(f"[{account_name}] proxy={proxy_value}")
```

### РџСЂРѕРІРµСЂРєР° РїСЂР°РІ РґРѕСЃС‚СѓРїР° Рє РїСЂРѕС„РёР»СЋ

```python
# С„Р°Р№Р»: keyset/services/multiparser_manager.py:124-150
candidates = [
    profile_path / "Default" / "Network" / "Cookies",
    profile_path / "Default" / "Cookies",
    profile_path / "Cookies",
    profile_path / "Network" / "Cookies",
]
source_path: Optional[Path] = None
for candidate in candidates:
    if candidate.exists():
        source_path = candidate
        break

if not source_path:
    logger_obj.info(f"[{profile_path.name}] Р¤Р°Р№Р» Cookies РЅРµ РЅР°Р№РґРµРЅ РІ РїСЂРѕС„РёР»Рµ")
    return []
```

---

## РўРёРїРѕРІС‹Рµ РѕС€РёР±РєРё / РљР°Рє С‡РёРЅРёС‚СЊ

### вќЊ РћС€РёР±РєР°: "РЎРµРєСЂРµС‚С‹ РІ СЂРµРїРѕР·РёС‚РѕСЂРёРё"

**РџСЂРёС‡РёРЅР°:** Р’ Git РїРѕРїР°Р» С„Р°Р№Р» `.env` РёР»Рё Р»РѕРіРё СЃ plain-text С‚РѕРєРµРЅР°РјРё.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РќРµРјРµРґР»РµРЅРЅРѕ СЂРѕС‚РёСЂСѓР№С‚Рµ РІСЃРµ РєР»СЋС‡Рё (Р°РЅС‚РёРєР°РїС‡Р°, РїСЂРѕРєСЃРё API).
2. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ `.gitignore` СЃРѕРґРµСЂР¶РёС‚ `.env`, `*.log`, `.profiles/`.
3. РЈСЃС‚Р°РЅРѕРІРёС‚Рµ pre-commit hook: `git-secrets --install` Рё РґРѕР±Р°РІСЊС‚Рµ РїСЂР°РІРёР»Р° РґР»СЏ РїР°С‚С‚РµСЂРЅРѕРІ (`APIKEY=...`).

### вќЊ РћС€РёР±РєР°: "РћС‚РєСЂС‹С‚С‹Рµ РїРѕСЂС‚С‹"

**РџСЂРёС‡РёРЅР°:** Backend СЃР»СѓС€Р°РµС‚ `0.0.0.0:8765` РІРјРµСЃС‚Рѕ `127.0.0.1`.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. Р’ `launcher.py` Р·Р°РјРµРЅРёС‚Рµ `BACKEND_HOST = "0.0.0.0"` РЅР° `"127.0.0.1"`.
2. РќР°СЃС‚СЂРѕР№С‚Рµ Windows Firewall РґР»СЏ Р±Р»РѕРєРёСЂРѕРІРєРё РІС…РѕРґСЏС‰РёС… СЃРѕРµРґРёРЅРµРЅРёР№ РЅР° РїРѕСЂС‚ 8765 (РєСЂРѕРјРµ localhost).
3. Р”Р»СЏ remote-РґРѕСЃС‚СѓРїР° РёСЃРїРѕР»СЊР·СѓР№С‚Рµ SSH tunnel: `ssh -L 8765:127.0.0.1:8765 user@server`.

### вќЊ РћС€РёР±РєР°: "DPAPI РЅРµ СЂР°СЃС€РёС„СЂРѕРІС‹РІР°РµС‚ РєСѓРєРё"

**РџСЂРёС‡РёРЅР°:** РџСЂРѕС„РёР»СЊ СЃРѕР·РґР°РЅ РґСЂСѓРіРёРј Windows-РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј.

**РљР°Рє С‡РёРЅРёС‚СЊ:**
1. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ Р°РєРєР°СѓРЅС‚ Р·Р°РїСѓСЃРєР°РµС‚ launcher РїРѕРґ С‚РµРј Р¶Рµ Windows user, РєРѕС‚РѕСЂС‹Р№ СЃРѕР·РґР°Р» Chrome profile.
2. Р•СЃР»Рё РїРµСЂРµСЃРѕР·РґР°Р»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ вЂ” СЃРєРѕРїРёСЂСѓР№С‚Рµ РїСЂРѕС„РёР»СЊ Р·Р°РЅРѕРІРѕ Рё РїРµСЂРµСЃРѕР±РµСЂРёС‚Рµ `_MASTER_KEY_CACHE`.
3. РџСЂРѕРІРµСЂСЊС‚Рµ `Local State` РІ РїСЂРѕС„РёР»Рµ вЂ” СѓР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ `os_crypt.encrypted_key` СЃСѓС‰РµСЃС‚РІСѓРµС‚ Рё РєРѕСЂСЂРµРєС‚РЅС‹Р№.

---

## Р‘С‹СЃС‚СЂС‹Р№ СЃС‚Р°СЂС‚

### 1. РџСЂРѕРІРµСЂРєР° `.env`

```bash
grep -v '^#' .env | grep -v '^$'
```

### 2. РџСЂРѕРІРµСЂРєР° РїСЂР°РІ РЅР° РґРёСЂРµРєС‚РѕСЂРёРё

```bash
icacls C:\AI\yandex\.profiles
```

### 3. РђСѓРґРёС‚ Р»РѕРіРѕРІ

```bash
tail -f logs/security.log
```

---

## TL;DR

- **РЎРµРєСЂРµС‚С‹** вЂ” С‚РѕР»СЊРєРѕ РІ Р·Р°С‰РёС‰С‘РЅРЅРѕРј С…СЂР°РЅРёР»РёС‰Рµ
- **Cookies** вЂ” С€РёС„СЂРѕРІР°С‚СЊ Рё РѕРіСЂР°РЅРёС‡РёРІР°С‚СЊ РґРѕСЃС‚СѓРї
- **DB** вЂ” РѕРіСЂР°РЅРёС‡РµРЅРЅС‹Р№ РґРѕСЃС‚СѓРї, СЂРµРіСѓР»СЏСЂРЅС‹Рµ backup
- **Proxy** вЂ” Р°РІС‚РѕСЂРёР·Р°С†РёСЏ Рё РјРѕРЅРёС‚РѕСЂРёРЅРі
- **Logging** вЂ” Р±РµР· С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹С… РґР°РЅРЅС‹С…

---

## Р§РµРє-Р»РёСЃС‚ РїСЂРёРјРµРЅРµРЅРёСЏ

- [ ] `.env` РЅРµ РІ СЂРµРїРѕР·РёС‚РѕСЂРёРё
- [ ] РџР°РїРєР° `.profiles` Р·Р°С‰РёС‰РµРЅР° РїСЂР°РІР°РјРё
- [ ] Cookies С€РёС„СЂСѓСЋС‚СЃСЏ РїСЂРё С…СЂР°РЅРµРЅРёРё
- [ ] Proxy РґРѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ Рё РјРѕРЅРёС‚РѕСЂРёС‚СЃСЏ
- [ ] Р›РѕРіРё РѕС‡РёС‰РµРЅС‹ РѕС‚ С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅС‹С… РґР°РЅРЅС‹С…
- [ ] Backup Р‘Р” РЅР°СЃС‚СЂРѕРµРЅ Рё РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ
- [ ] РЎРµРєСЂРµС‚С‹ СЂРѕС‚РёСЂСѓСЋС‚СЃСЏ СЂРµРіСѓР»СЏСЂРЅРѕ
- [ ] Security policy Р·Р°РґРѕРєСѓРјРµРЅС‚РёСЂРѕРІР°РЅР°
- [ ] MFA РІРєР»СЋС‡РµРЅ РґР»СЏ Р°РґРјРёРЅСЃРєРёС… Р°РєРєР°СѓРЅС‚РѕРІ
- [ ] РџСЂРѕРІРµРґС‘РЅ СЂРµРіСѓР»СЏСЂРЅС‹Р№ security review

---

**РџРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ:** 2024-11-10

**РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі:** [14_LOGGING_OBSERVABILITY.md](./14_LOGGING_OBSERVABILITY.md) вЂ” Р›РѕРіРёСЂРѕРІР°РЅРёРµ Рё РЅР°Р±Р»СЋРґР°РµРјРѕСЃС‚СЊ
