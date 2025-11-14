# 03. РђРєРєР°СѓРЅС‚С‹ Рё Chrome РїСЂРѕС„РёР»Рё

> **РЈРїСЂР°РІР»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°РјРё РЇРЅРґРµРєСЃ, РїСЂРѕС„РёР»СЏРјРё Chrome Рё СЃС‚Р°С‚СѓСЃР°РјРё**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [РћР±Р·РѕСЂ](#РѕР±Р·РѕСЂ)
- [РЎС‚СЂСѓРєС‚СѓСЂР° Р°РєРєР°СѓРЅС‚Р°](#СЃС‚СЂСѓРєС‚СѓСЂР°-Р°РєРєР°СѓРЅС‚Р°)
- [РЎС‚Р°С‚СѓСЃС‹ Р°РєРєР°СѓРЅС‚Р°](#СЃС‚Р°С‚СѓСЃС‹-Р°РєРєР°СѓРЅС‚Р°)
- [Р Р°Р±РѕС‚Р° СЃ РїСЂРѕС„РёР»СЏРјРё](#СЂР°Р±РѕС‚Р°-СЃ-РїСЂРѕС„РёР»СЏРјРё)
- [РњРµРЅРµРґР¶РјРµРЅС‚ Р°РєРєР°СѓРЅС‚РѕРІ](#РјРµРЅРµРґР¶РјРµРЅС‚-Р°РєРєР°СѓРЅС‚РѕРІ)
- [API СѓСЂРѕРІРЅСЏ backend](#api-СѓСЂРѕРІРЅСЏ-backend)
- [РРЅС‚РµРіСЂР°С†РёСЏ СЃ С„СЂРѕРЅС‚РµРЅРґРѕРј](#РёРЅС‚РµРіСЂР°С†РёСЏ-СЃ-С„СЂРѕРЅС‚РµРЅРґРѕРј)
- [РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ](#РїСЂРёРјРµСЂС‹-РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ)

---

## РћР±Р·РѕСЂ

РњРѕРґСѓР»СЊ Р°РєРєР°СѓРЅС‚РѕРІ KeySet-MVP РѕС‚РІРµС‡Р°РµС‚ Р·Р°:

1. **РҐСЂР°РЅРµРЅРёРµ РґР°РЅРЅС‹С… Р°РєРєР°СѓРЅС‚Р°** РІ Р‘Р” (`accounts` С‚Р°Р±Р»РёС†Р°)
2. **РЈРїСЂР°РІР»РµРЅРёРµ Chrome РїСЂРѕС„РёР»СЏРјРё** (РїСѓС‚Рё, РЅРѕСЂРјР°Р»РёР·Р°С†РёСЏ, Р·Р°РїСѓСЃРє)
3. **РќР°Р·РЅР°С‡РµРЅРёРµ Рё СЂРѕС‚Р°С†РёСЋ РїСЂРѕРєСЃРё**
4. **РћС‚СЃР»РµР¶РёРІР°РЅРёРµ СЃС‚Р°С‚СѓСЃР° Р°РєРєР°СѓРЅС‚Р°** (ok/cooldown/captcha/...)
5. **РРЅС‚РµРіСЂР°С†РёСЋ СЃ С„СЂРѕРЅС‚РµРЅРґРѕРј** С‡РµСЂРµР· REST API `/api/accounts`

РћСЃРЅРѕРІРЅРѕР№ РєРѕРґ СЂР°СЃРїРѕР»РѕР¶РµРЅ РІ:
- `backend/db.py` вЂ” CRUD РѕРїРµСЂР°С†РёРё РґР»СЏ С‚Р°Р±Р»РёС†С‹ `accounts`
- `keyset/core/models.py` вЂ” ORM РјРѕРґРµР»СЊ Р°РєРєР°СѓРЅС‚Р°
- `keyset/services/accounts.py` вЂ” Р±РёР·РЅРµСЃ-Р»РѕРіРёРєР° Рё СѓС‚РёР»РёС‚С‹
- `keyset/services/chrome_launcher.py` вЂ” СЂР°Р±РѕС‚Р° СЃ РїСЂРѕС„РёР»СЏРјРё
- `backend/routers/accounts.py` вЂ” REST API РґР»СЏ С„СЂРѕРЅС‚РµРЅРґР°

---

## РЎС‚СЂСѓРєС‚СѓСЂР° Р°РєРєР°СѓРЅС‚Р°

**РњРѕРґРµР»СЊ:** `keyset/core/models.py`

```python
class Account(Base):
    __tablename__ = 'accounts'

    id: Mapped[int]
    name: Mapped[str]               # Email Р°РєРєР°СѓРЅС‚Р° (СѓРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ)
    profile_path: Mapped[str]       # РџР°РїРєР° РїСЂРѕС„РёР»СЏ Chrome
    proxy: Mapped[str | None]       # URI РїСЂРѕРєСЃРё: http://user:pass@host:port
    proxy_id: Mapped[str | None]    # ID РІ ProxyManager (config/proxies.json)
    proxy_strategy: Mapped[str]     # РЎС‚СЂР°С‚РµРіРёСЏ: fixed / rotate
    captcha_key: Mapped[str | None] # РљР»СЋС‡ Р°РЅС‚РёРєР°РїС‡Рё (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)
    cookies: Mapped[str | None]     # JSON СЃ РєСѓРєР°РјРё (СЃРј. Authentication)

    status: Mapped[str]             # РўРµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ (СЃРј. РЅРёР¶Рµ)
    captcha_tries: Mapped[int]      # РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРїС‹С‚РѕРє СЂРµС€РµРЅРёСЏ РєР°РїС‡Рё
    cooldown_until: Mapped[datetime | None]

    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    last_used_at: Mapped[datetime | None]

    notes: Mapped[str | None]
    tasks: Mapped[list['Task']]
```

---

## РЎС‚Р°С‚СѓСЃС‹ Р°РєРєР°СѓРЅС‚Р°

### Enum `ACCOUNT_STATUSES`

```python
ACCOUNT_STATUSES = (
    'ok',        # РђРєРєР°СѓРЅС‚ РІ СЂР°Р±РѕС‡РµРј СЃРѕСЃС‚РѕСЏРЅРёРё
    'cooldown',  # Р’СЂРµРјРµРЅРЅС‹Р№ РєСѓР»РґР°СѓРЅ (РїР°СѓР·Р°)
    'captcha',   # РўСЂРµР±СѓРµС‚СЃСЏ СЂРµС€РµРЅРёРµ РєР°РїС‡Рё
    'banned',    # РђРєРєР°СѓРЅС‚ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ
    'disabled',  # РћС‚РєР»СЋС‡РµРЅ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј
    'error',     # РћС€РёР±РєР° РїСЂРё РїРѕСЃР»РµРґРЅРµР№ РѕРїРµСЂР°С†РёРё
)
```

### РћС‚РѕР±СЂР°Р¶РµРЅРёРµ СЃС‚Р°С‚СѓСЃРѕРІ РІРѕ С„СЂРѕРЅС‚РµРЅРґРµ

**Р¤Р°Р№Р»:** `backend/routers/accounts.py`

```python
def _map_status(raw_status: str | None) -> tuple[str, str]:
    """Р’РµСЂРЅСѓС‚СЊ (frontend_status, human_label)."""
    status = (raw_status or "ok").lower()
    if status in {"ok"}:
        return "active", "РђРІС‚РѕСЂРёР·РѕРІР°РЅ"
    if status in {"cooldown"}:
        return "working", "Р’ СЂР°Р±РѕС‚Рµ"
    if status in {"captcha"}:
        return "needs_login", "РўСЂРµР±СѓРµС‚СЃСЏ РєР°РїС‡Р°"
    if status in {"banned", "disabled"}:
        return "error", "Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ"
    if status in {"error"}:
        return "error", "РћС€РёР±РєР°"
    return "needs_login", "РќРµРёР·РІРµСЃС‚РЅРѕ"
```

**UI СЃС‚Р°С‚СѓСЃ** С…СЂР°РЅРёС‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕ РѕС‚ РІРЅСѓС‚СЂРµРЅРЅРµРіРѕ `status` РґР»СЏ СѓРґРѕР±СЃС‚РІР° РІРёР·СѓР°Р»РёР·Р°С†РёРё.

### РЈРїСЂР°РІР»РµРЅРёРµ СЃС‚Р°С‚СѓСЃР°РјРё

**Р¤Р°Р№Р»:** `keyset/services/accounts.py`

```python
def set_status(
    account_id: int,
    status: str,
    *,
    cooldown_minutes: int | None = None,
    captcha_increment: bool = False,
) -> Account:
    with SessionLocal() as session:
        account = session.get(Account, account_id)
        account.status = status

        if cooldown_minutes is not None:
            account.cooldown_until = datetime.utcnow() + timedelta(minutes=cooldown_minutes)
        elif status == 'ok':
            account.cooldown_until = None

        if captcha_increment:
            account.captcha_tries = (account.captcha_tries or 0) + 1

        session.commit()
        session.refresh(account)
        return _sanitize_account(account)
```

**РЁРѕСЂС‚РєР°С‚С‹:** `mark_captcha`, `mark_cooldown`, `mark_error`, `mark_ok`.

---

## Р Р°Р±РѕС‚Р° СЃ РїСЂРѕС„РёР»СЏРјРё

### РќРѕСЂРјР°Р»РёР·Р°С†РёСЏ РїСѓС‚Рё РїСЂРѕС„РёР»СЏ

```python
profile_dir = ChromeLauncher._normalise_profile_path(profile_path, account.name)
```

Р›РѕРіРёРєР°:
1. РџРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃС‚Р°СЂС‹Рµ РїСѓС‚Рё РёР· В«legacyВ» РІРµСЂСЃРёР№ (`C:/AI/yandex/`)
2. РЎРѕР·РґР°С‘С‚ РїСЂРѕС„РёР»СЊ РІ `.profiles/{email}` РµСЃР»Рё РїСѓС‚СЊ РЅРµ СѓРєР°Р·Р°РЅ
3. РџСЂРѕРІРµСЂСЏРµС‚ РЅР°Р»РёС‡РёРµ РєР°С‚Р°Р»РѕРіР° Рё СЃРѕР·РґР°С‘С‚ РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё

### ChromeLauncher

**Р¤Р°Р№Р»:** `keyset/services/chrome_launcher.py`

Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё:
- РџРѕРёСЃРє СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕРіРѕ Chrome (`_resolve_chrome_executable`)
- РЈРїСЂР°РІР»РµРЅРёРµ РїСЂРѕС†РµСЃСЃР°РјРё Chrome (Р·Р°РїСѓСЃРє/С‚РµСЂРјРёРЅР°С†РёСЏ)
- РџСЂРѕРєСЃРё С‡РµСЂРµР· С„Р»Р°РіРё `--proxy-server`
- Р“РµРЅРµСЂР°С†РёСЏ СЂР°СЃС€РёСЂРµРЅРёР№ РґР»СЏ РїСЂРѕРєСЃРё СЃ Р°РІС‚РѕСЂРёР·Р°С†РёРµР№

```python
ChromeLauncher.launch(
    account='user@yandex.ru',
    profile_path='C:/AI/yandex/.profiles/user@yandex.ru',
    cdp_port=9222,
    proxy_server='http://proxy:8080',
    proxy_username='user',
    proxy_password='pass',
    start_url='https://wordstat.yandex.ru'
)
```

---

## РњРµРЅРµРґР¶РјРµРЅС‚ Р°РєРєР°СѓРЅС‚РѕРІ

### РЎРµСЂРІРёСЃ СѓРїСЂР°РІР»РµРЅРёСЏ

**Р¤Р°Р№Р»:** `keyset/services/accounts.py`

РћСЃРЅРѕРІРЅС‹Рµ С„СѓРЅРєС†РёРё:

- `list_accounts()` вЂ” РІСЃРµ Р°РєРєР°СѓРЅС‚С‹ СЃ Р°РІС‚Рѕ-РѕР±РЅРѕРІР»РµРЅРёРµРј СЃС‚Р°С‚СѓСЃРѕРІ
- `create_account()` вЂ” СЃРѕР·РґР°РЅРёРµ РЅРѕРІРѕРіРѕ Р°РєРєР°СѓРЅС‚Р°
- `upsert_account()` вЂ” СЃРѕР·РґР°С‚СЊ РёР»Рё РѕР±РЅРѕРІРёС‚СЊ РїРѕ email
- `update_account()` вЂ” РѕР±РЅРѕРІР»РµРЅРёРµ РїРѕР»РµР№
- `set_account_proxy()` вЂ” РЅР°Р·РЅР°С‡РµРЅРёРµ РїСЂРѕРєСЃРё
- `delete_account()` вЂ” СѓРґР°Р»РµРЅРёРµ
- `get_account_by_email()` вЂ” РїРѕР»СѓС‡РёС‚СЊ СЃР»РѕРІР°СЂСЊ РїРѕ email
- `get_cookies_status()` вЂ” РѕС†РµРЅРєР° СЃРІРµР¶РµСЃС‚Рё РєСѓРєРѕРІ
- `autologin_account()` вЂ” Р·Р°РїСѓСЃРє Playwright Р°РІС‚РѕР»РѕРіРёРЅР°

### РђРІС‚РѕРѕР±РЅРѕРІР»РµРЅРёРµ РєСѓР»РґР°СѓРЅРѕРІ

```python
def _auto_refresh(session):
    now = datetime.utcnow()
    stmt = select(Account).where(Account.status.in_(['cooldown', 'captcha']))
    for acc in session.execute(stmt).scalars():
        if acc.cooldown_until and acc.cooldown_until <= now:
            acc.status = 'ok'
            acc.cooldown_until = None
            acc.captcha_tries = 0
    session.commit()
```

Р¤СѓРЅРєС†РёСЏ РІС‹Р·С‹РІР°РµС‚СЃСЏ РїСЂРё РєР°Р¶РґРѕРј `list_accounts()`.

### РЎР°РЅР°С†РёСЏ РґР°РЅРЅС‹С…

```python
def _sanitize_account(account: Account) -> Account:
    account.name = fix_mojibake(account.name)
    account.profile_path = fix_mojibake(account.profile_path)
    account.proxy = fix_mojibake(account.proxy)
    account.proxy_id = fix_mojibake(account.proxy_id)
    account.proxy_strategy = fix_mojibake(account.proxy_strategy) or "fixed"
    account.notes = fix_mojibake(account.notes)
    account.status = fix_mojibake(account.status)

    if account.proxy_id and not account.proxy:
        proxy = ProxyManager.instance().get(account.proxy_id)
        if proxy:
            account.proxy = proxy.uri()
    return account
```

РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РёСЃРїСЂР°РІР»РµРЅРёСЏ РєРѕРґРёСЂРѕРІРєРё (mojibake) Рё РїРѕРґС‚СЏРіРёРІР°РЅРёСЏ РїСЂРѕРєСЃРё РїРѕ ID.

---

## API СѓСЂРѕРІРЅСЏ backend

**Р¤Р°Р№Р»:** `backend/routers/accounts.py`

### Endpoint: `GET /api/accounts`

Р’РѕР·РІСЂР°С‰Р°РµС‚ СЃРїРёСЃРѕРє Р°РєРєР°СѓРЅС‚РѕРІ СЃ СЃРµСЂРёР°Р»РёР·Р°С†РёРµР№ РїРѕРґ С„СЂРѕРЅС‚РµРЅРґ:

```python
@router.get("", response_model=List[AccountPayload])
def list_accounts() -> List[AccountPayload]:
    rows = legacy_accounts.list_accounts()
    payload = [
        _serialize_account(record)
        for record in rows
        if getattr(record, "profile_path", None)
    ]
    return payload
```

**`AccountPayload` СЃС‚СЂСѓРєС‚СѓСЂР°:**

```python
class AccountPayload(BaseModel):
    id: int
    email: str
    password: str              # РІСЃРµРіРґР° РїСѓСЃС‚Р°СЏ СЃС‚СЂРѕРєР° (РїР°СЂРѕР»Рё РЅРµ С…СЂР°РЅРёРј)
    secretAnswer: str          # РїРµСЂРµРЅРѕСЃРёС‚СЃСЏ notes
    profilePath: str           # РїСѓС‚СЊ Рє РїСЂРѕС„РёР»СЋ
    status: str                # frontend СЃС‚Р°С‚СѓСЃ (active/working/...)
    proxy: str                 # host:port
    proxyUsername: str
    proxyPassword: str
    proxyType: str             # http/https/socks5
    fingerprint: str           # "no_spoofing" (Р·Р°РіР»СѓС€РєР°)
    lastLaunch: str            # humanized ("10 РјРёРЅ РЅР°Р·Р°Рґ")
    authStatus: str            # "РђРІС‚РѕСЂРёР·РѕРІР°РЅ", "Р’ СЂР°Р±РѕС‚Рµ" ...
    lastLogin: str             # РґР°С‚Р° РІ С„РѕСЂРјР°С‚Рµ YYYY-MM-DD HH:MM
    profileSize: str           # placeholder "вЂ”"
```

**Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ РґР°С‚**:

```python
def _format_relative(value: datetime | None) -> str:
    if not value:
        return "вЂ”"
    now = datetime.utcnow()
    delta = now - value
    if delta < timedelta(minutes=1):
        return "С‚РѕР»СЊРєРѕ С‡С‚Рѕ"
    if delta < timedelta(hours=1):
        return f"{delta.seconds // 60} РјРёРЅ РЅР°Р·Р°Рґ"
    if delta < timedelta(days=1):
        return f"{delta.seconds // 3600} С‡ РЅР°Р·Р°Рґ"
    if delta < timedelta(days=30):
        return f"{delta.days} РґРЅ РЅР°Р·Р°Рґ"
    return value.strftime("%Y-%m-%d %H:%M")
```

РќР° С‚РµРєСѓС‰РёР№ РјРѕРјРµРЅС‚ API **С‡РёС‚Р°РµС‚ РґР°РЅРЅС‹Рµ** РёР· Р»РµРіР°СЃРё СЃРµСЂРІРёСЃР° (`keyset.services.accounts`), Р° РѕРїРµСЂР°С†РёРё create/update/delete РІС‹РїРѕР»РЅСЏСЋС‚СЃСЏ С‡РµСЂРµР· РЅРёС… РЅР°РїСЂСЏРјСѓСЋ.

---

## РРЅС‚РµРіСЂР°С†РёСЏ СЃ С„СЂРѕРЅС‚РµРЅРґРѕРј

### Р¤Р°Р№Р»: `frontend/src/modules/accounts`

- `index.tsx` вЂ” РіР»Р°РІРЅС‹Р№ РјРѕРґСѓР»СЊ РІРєР»Р°РґРєРё Р°РєРєР°СѓРЅС‚РѕРІ
- `api.ts` вЂ” С„СѓРЅРєС†РёРё, РѕР±СЂР°С‰Р°СЋС‰РёРµСЃСЏ Рє `/api/accounts`
- `types.ts` вЂ” С‚РёРїС‹ РґР°РЅРЅС‹С… С„СЂРѕРЅС‚РµРЅРґР°
- `mockData.ts` вЂ” РјРѕРєРё РґР»СЏ СЂР°Р·СЂР°Р±РѕС‚РєРё Р±РµР· backend
- `utils.ts` вЂ” С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ Рё РІСЃРїРѕРјРѕРіР°С‚РµР»СЊРЅС‹Рµ С„СѓРЅРєС†РёРё

#### РџСЂРёРјРµСЂ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ API РЅР° С„СЂРѕРЅС‚РµРЅРґРµ

```typescript
// frontend/src/modules/accounts/api.ts
export async function fetchAccounts(): Promise<AccountPayload[]> {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РєРєР°СѓРЅС‚С‹");
  }
  return response.json();
}
```

### РЎС‚СЂСѓРєС‚СѓСЂР° UI

- РўР°Р±Р»РёС†Р° СЃ Р°РєРєР°СѓРЅС‚Р°РјРё (email, СЃС‚Р°С‚СѓСЃ, РїСЂРѕРєСЃРё, РїРѕСЃР»РµРґРЅРёРµ РґРµР№СЃС‚РІРёСЏ)
- РњРѕРґР°Р»РєР° РґРѕР±Р°РІР»РµРЅРёСЏ/СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ Р°РєРєР°СѓРЅС‚Р°
- РџСЂРёРІСЏР·РєР° РїСЂРѕРєСЃРё Рё СѓРїСЂР°РІР»РµРЅРёРµ СЃС‚СЂР°С‚РµРіРёРµР№
- РњРµС‚РєРё СЃРІРµР¶РµСЃС‚Рё РїСЂРѕС„РёР»СЏ (РЅР° РѕСЃРЅРѕРІРµ `get_cookies_status`)

---

## РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ

### 1. РЎРѕР·РґР°РЅРёРµ РёР»Рё РѕР±РЅРѕРІР»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°

```python
from keyset.services.accounts import upsert_account

account = upsert_account(
    name='user@yandex.ru',
    profile_path='C:/AI/yandex/.profiles/user',
    proxy='http://user:pass@proxy.example.com:8080',
    notes='РћСЃРЅРѕРІРЅРѕР№ Р°РєРєР°СѓРЅС‚',
    proxy_strategy='rotate'
)
print(f"Account ID: {account.id}, proxy: {account.proxy}")
```

### 2. РќР°Р·РЅР°С‡РµРЅРёРµ РїСЂРѕРєСЃРё РїРѕ ID

```python
from keyset.services.accounts import set_account_proxy

account = set_account_proxy(
    account_id=1,
    proxy_id='proxy_us_1',
    strategy='rotate'
)
print(account.proxy)  # => http://user:pass@us.proxy.net:9000
```

### 3. РџРѕРјРµС‚РєР° Р°РєРєР°СѓРЅС‚Р° РєР°Рє В«captchaВ»

```python
from keyset.services.accounts import mark_captcha

account = mark_captcha(account_id=3, minutes=45)
print(account.status)         # captcha
print(account.cooldown_until) # РІСЂРµРјСЏ РІС‹С…РѕРґР° РёР· РєР°СЂР°РЅС‚РёРЅР°
```

### 4. РџРѕР»СѓС‡РµРЅРёРµ СЃС‚Р°С‚СѓСЃР° РєСѓРєРѕРІ

```python
from keyset.services.accounts import get_cookies_status
from keyset.services.accounts import list_accounts

accounts = list_accounts()
for account in accounts:
    print(account.name, get_cookies_status(account))
# Р’С‹РІРѕРґ: user@yandex.ru 18.2KB Chrome (Fresh)
```

### 5. РЈРґР°Р»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р°

```python
from keyset.services.accounts import delete_account

delete_account(account_id=2)
```

---

## Р’Р°Р¶РЅС‹Рµ Р·Р°РјРµС‡Р°РЅРёСЏ

1. **РџР°СЂРѕР»Рё РЅРµ С…СЂР°РЅСЏС‚СЃСЏ** вЂ” РїРѕР»Рµ `password` РІ API РІСЃРµРіРґР° РїСѓСЃС‚РѕРµ
2. **Proxy СЃС‚СЂР°С‚РµРіРёСЏ** вЂ” РІР»РёСЏРµС‚ РЅР° СЂРѕС‚Р°С†РёСЋ (РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РІ РїР°СЂСЃРµСЂРµ)
3. **Notes в†’ secretAnswer** вЂ” РёСЃС‚РѕСЂРёС‡РµСЃРєРё РїРѕР»Рµ РЅР°Р·С‹РІР°РµС‚СЃСЏ С‚Р°Рє РІРѕ С„СЂРѕРЅС‚РµРЅРґРµ
4. **Profile path** вЂ” РґРѕР»Р¶РµРЅ СѓРєР°Р·С‹РІР°С‚СЊ РЅР° СЃСѓС‰РµСЃС‚РІСѓСЋС‰СѓСЋ РїР°РїРєСѓ СЃ РїСЂРѕС„РёР»РµРј
5. **Cookies** вЂ” СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓСЋС‚СЃСЏ С‡РµСЂРµР· РјРѕРґСѓР»СЊ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё

---

**РЎР»РµРґСѓСЋС‰РёР№ СЂР°Р·РґРµР»:** [04_PROXY_CONNECTIONS.md](./04_PROXY_CONNECTIONS.md) вЂ” РџСЂРѕРєСЃРё СЃРёСЃС‚РµРјР° Рё СЂРѕС‚Р°С†РёСЏ
