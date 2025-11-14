# 01. Р‘Р°Р·Р° РґР°РЅРЅС‹С… KeySet-MVP

> **Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ СЃС‚СЂСѓРєС‚СѓСЂС‹ Р±Р°Р·С‹ РґР°РЅРЅС‹С…, РјРѕРґРµР»РµР№ Рё РѕРїРµСЂР°С†РёР№**

## рџ“‹ РЎРѕРґРµСЂР¶Р°РЅРёРµ

- [РћР±Р·РѕСЂ](#РѕР±Р·РѕСЂ)
- [РўРµС…РЅРѕР»РѕРіРёРё](#С‚РµС…РЅРѕР»РѕРіРёРё)
- [РњРѕРґРµР»Рё РґР°РЅРЅС‹С…](#РјРѕРґРµР»Рё-РґР°РЅРЅС‹С…)
- [РЎРІСЏР·Рё РјРµР¶РґСѓ С‚Р°Р±Р»РёС†Р°РјРё](#СЃРІСЏР·Рё-РјРµР¶РґСѓ-С‚Р°Р±Р»РёС†Р°РјРё)
- [CRUD РѕРїРµСЂР°С†РёРё](#crud-РѕРїРµСЂР°С†РёРё)
- [РњРёРіСЂР°С†РёРё](#РјРёРіСЂР°С†РёРё)
- [РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ](#РїСЂРёРјРµСЂС‹-РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ)

---

## РћР±Р·РѕСЂ

KeySet РёСЃРїРѕР»СЊР·СѓРµС‚ **SQLite** РІ РєР°С‡РµСЃС‚РІРµ Р»РѕРєР°Р»СЊРЅРѕР№ Р±Р°Р·С‹ РґР°РЅРЅС‹С… РґР»СЏ С…СЂР°РЅРµРЅРёСЏ:
- РђРєРєР°СѓРЅС‚РѕРІ Yandex СЃ РїСЂРѕС„РёР»СЏРјРё Рё РїСЂРѕРєСЃРё
- Р—Р°РґР°С‡ РїР°СЂСЃРёРЅРіР°
- Р РµР·СѓР»СЊС‚Р°С‚РѕРІ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё (Wordstat)
- РџСЂРѕРєСЃРё СЃРµСЂРІРµСЂРѕРІ
- Р“СЂСѓРїРї С„СЂР°Р·

**Р Р°СЃРїРѕР»РѕР¶РµРЅРёРµ Р±Р°Р·С‹ РґР°РЅРЅС‹С…:**
```
backend/keyset.db
```

**ORM:** SQLAlchemy 2.x СЃ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹РјРё mapped columns

---

## РўРµС…РЅРѕР»РѕРіРёРё

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

# SQLite connection
engine = create_engine("sqlite:///backend/keyset.db", echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

## РњРѕРґРµР»Рё РґР°РЅРЅС‹С…

### 1. Account (Р°РєРєР°СѓРЅС‚ Yandex)

**Р¤Р°Р№Р»:** `backend/db.py` Рё `keyset/core/models.py`

```python
class Account(Base):
    __tablename__ = 'accounts'
    
    # Primary Key
    id: int                                 # PRIMARY KEY AUTOINCREMENT
    
    # РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ
    name: str                               # Email Р°РєРєР°СѓРЅС‚Р° (UNIQUE, NOT NULL)
    profile_path: str                       # РџСѓС‚СЊ Рє Chrome РїСЂРѕС„РёР»СЋ
    
    # РџСЂРѕРєСЃРё РЅР°СЃС‚СЂРѕР№РєРё
    proxy: str | None                       # URI: http://user:pass@host:port
    proxy_id: str | None                    # ID РёР· proxy_manager (РІРЅРµС€РЅРёР№ РєР»СЋС‡)
    proxy_strategy: str = 'fixed'           # РЎС‚СЂР°С‚РµРіРёСЏ: fixed/rotate
    
    # РђРІС‚РѕСЂРёР·Р°С†РёСЏ
    cookies: str | None                     # JSON СЃ РєСѓРєР°РјРё Yandex
    captcha_key: str | None                 # РљР»СЋС‡ РґР»СЏ Р°РЅС‚РёРєР°РїС‡Р° СЃРµСЂРІРёСЃР°
    
    # РЎС‚Р°С‚СѓСЃ Р°РєРєР°СѓРЅС‚Р°
    status: str = 'ok'                      # ok/cooldown/captcha/banned/disabled/error
    captcha_tries: int = 0                  # РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРїС‹С‚РѕРє СЂРµС€РµРЅРёСЏ РєР°РїС‡Рё
    
    # Р’СЂРµРјРµРЅРЅС‹Рµ РјРµС‚РєРё
    created_at: datetime                    # Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ
    updated_at: datetime                    # Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ
    last_used_at: datetime | None           # РџРѕСЃР»РµРґРЅРµРµ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ
    cooldown_until: datetime | None         # Р”Рѕ РєР°РєРѕРіРѕ РІСЂРµРјРµРЅРё РІ РєСѓР»РґР°СѓРЅРµ
    
    # Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ
    notes: str | None                       # РџСЂРѕРёР·РІРѕР»СЊРЅС‹Рµ Р·Р°РјРµС‚РєРё
    
    # Relationships
    tasks: list[Task]                       # РЎРІСЏР·СЊ 1:N СЃ Р·Р°РґР°С‡Р°РјРё
    proxy_obj: Proxy                        # РЎРІСЏР·СЊ СЃ РїСЂРѕРєСЃРё РѕР±СЉРµРєС‚РѕРј
```

**Enum СЃС‚Р°С‚СѓСЃРѕРІ:**
```python
ACCOUNT_STATUSES = (
    'ok',        # РђРєРєР°СѓРЅС‚ РіРѕС‚РѕРІ Рє СЂР°Р±РѕС‚Рµ
    'cooldown',  # Р’ РєСѓР»РґР°СѓРЅРµ (РІСЂРµРјРµРЅРЅР°СЏ РїР°СѓР·Р°)
    'captcha',   # РўСЂРµР±СѓРµС‚СЃСЏ СЂРµС€РµРЅРёРµ РєР°РїС‡Рё
    'banned',    # Р—Р°Р±Р°РЅРµРЅ РЇРЅРґРµРєСЃРѕРј
    'disabled',  # РћС‚РєР»СЋС‡РµРЅ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј
    'error',     # РћС€РёР±РєР° РїСЂРё СЂР°Р±РѕС‚Рµ
)
```

---

### 2. Task (Р·Р°РґР°С‡Р° РїР°СЂСЃРёРЅРіР°)

**Р¤Р°Р№Р»:** `backend/db.py` Рё `keyset/core/models.py`

```python
class Task(Base):
    __tablename__ = 'tasks'
    
    # Primary Key
    id: int                                 # PRIMARY KEY
    account_id: int | None                  # FOREIGN KEY -> accounts.id
    
    # РџР°СЂР°РјРµС‚СЂС‹ Р·Р°РґР°С‡Рё
    seed_file: str                          # РџСѓС‚СЊ Рє С„Р°Р№Р»Сѓ СЃ С„СЂР°Р·Р°РјРё
    region: int = 225                       # ID СЂРµРіРёРѕРЅР° (lr РїР°СЂР°РјРµС‚СЂ)
    headless: bool = False                  # Headless СЂРµР¶РёРј Р±СЂР°СѓР·РµСЂР°
    dump_json: bool = False                 # РЎРѕС…СЂР°РЅСЏС‚СЊ Р»Рё JSON Р»РѕРі
    kind: str = 'frequency'                 # РўРёРї: frequency/forecast/etc
    params: str | None                      # JSON СЃ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹РјРё РїР°СЂР°РјРµС‚СЂР°РјРё
    
    # РЎС‚Р°С‚СѓСЃ РІС‹РїРѕР»РЅРµРЅРёСЏ
    status: str = 'queued'                  # queued/running/completed/failed
    
    # Р’СЂРµРјРµРЅРЅС‹Рµ РјРµС‚РєРё
    created_at: datetime                    # Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ
    started_at: datetime | None             # Р”Р°С‚Р° РЅР°С‡Р°Р»Р° РІС‹РїРѕР»РЅРµРЅРёСЏ
    finished_at: datetime | None            # Р”Р°С‚Р° Р·Р°РІРµСЂС€РµРЅРёСЏ
    
    # Р РµР·СѓР»СЊС‚Р°С‚С‹
    log_path: str | None                    # РџСѓС‚СЊ Рє Р»РѕРіСѓ Р·Р°РґР°С‡Рё
    output_path: str | None                 # РџСѓС‚СЊ Рє С„Р°Р№Р»Сѓ СЃ СЂРµР·СѓР»СЊС‚Р°С‚Р°РјРё
    error_message: str | None               # РўРµРєСЃС‚ РѕС€РёР±РєРё РµСЃР»Рё status=failed
    
    # Relationships
    account: Account | None                 # РЎРІСЏР·СЊ СЃ Р°РєРєР°СѓРЅС‚РѕРј
```

---

### 3. FrequencyResult (СЂРµР·СѓР»СЊС‚Р°С‚С‹ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё)

**Р¤Р°Р№Р»:** `backend/db.py` Рё `keyset/core/models.py`

```python
class FrequencyResult(Base):
    __tablename__ = 'freq_results'
    
    # Primary Key
    id: int                                 # PRIMARY KEY
    
    # Р¤СЂР°Р·Р° Рё СЂРµРіРёРѕРЅ
    mask: str                               # РљР»СЋС‡РµРІР°СЏ С„СЂР°Р·Р° (NOT NULL, INDEX)
    region: int = 225                       # ID СЂРµРіРёРѕРЅР° (INDEX)
    
    # Р§Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё (РёР· Wordstat)
    freq_total: int = 0                     # РЁРёСЂРѕРєР°СЏ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚СЊ (WS)
    freq_quotes: int = 0                    # Р¤СЂР°Р·РѕРІРѕРµ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ ("WS")
    freq_exact: int = 0                     # РўРѕС‡РЅРѕРµ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ (!WS)
    
    # РњРµС‚Р°РґР°РЅРЅС‹Рµ
    group: str | None                       # Р“СЂСѓРїРїР° РґР»СЏ РѕСЂРіР°РЅРёР·Р°С†РёРё
    status: str = 'queued'                  # queued/ok/error
    attempts: int = 0                       # РљРѕР»РёС‡РµСЃС‚РІРѕ РїРѕРїС‹С‚РѕРє РїР°СЂСЃРёРЅРіР°
    error: str | None                       # РўРµРєСЃС‚ РѕС€РёР±РєРё
    
    # Р’СЂРµРјРµРЅРЅС‹Рµ РјРµС‚РєРё
    created_at: datetime                    # Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ
    updated_at: datetime                    # Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('mask', 'region', name='uq_mask_region'),
    )
```

**РЈРЅРёРєР°Р»СЊРЅРѕСЃС‚СЊ:** РџР°СЂР° `(mask, region)` СѓРЅРёРєР°Р»СЊРЅР° РІ РїСЂРµРґРµР»Р°С… С‚Р°Р±Р»РёС†С‹.

---

### 4. Proxy (РїСЂРѕРєСЃРё СЃРµСЂРІРµСЂ)

**Р¤Р°Р№Р»:** `backend/db.py`

```python
class Proxy(Base):
    __tablename__ = 'proxies'
    
    # Primary Key
    id: int                                 # PRIMARY KEY
    
    # РРЅС„РѕСЂРјР°С†РёСЏ Рѕ РїСЂРѕРєСЃРё
    host: str                               # РҐРѕСЃС‚ (NOT NULL)
    port: int                               # РџРѕСЂС‚ (NOT NULL)
    username: str | None                    # Р›РѕРіРёРЅ РґР»СЏ Р°РІС‚РѕСЂРёР·Р°С†РёРё
    password: str | None                    # РџР°СЂРѕР»СЊ РґР»СЏ Р°РІС‚РѕСЂРёР·Р°С†РёРё
    proxy_type: str = 'http'                # РўРёРї: http/https/socks5
    
    # РЎС‚Р°С‚СѓСЃ Рё РјРµС‚СЂРёРєРё
    status: str = 'active'                  # active/dead/checking
    country: str | None                     # РљРѕРґ СЃС‚СЂР°РЅС‹
    speed_ms: int | None                    # Р’СЂРµРјСЏ РѕС‚РєР»РёРєР° РІ РјСЃ
    
    # Р’СЂРµРјРµРЅРЅС‹Рµ РјРµС‚РєРё
    created_at: datetime
    updated_at: datetime
    last_checked_at: datetime | None        # РџРѕСЃР»РµРґРЅСЏСЏ РїСЂРѕРІРµСЂРєР°
    
    # Р—Р°РјРµС‚РєРё
    notes: str | None
```

---

### 5. PhraseGroup (РіСЂСѓРїРїС‹ С„СЂР°Р·)

**Р¤Р°Р№Р»:** `keyset/core/models.py`

```python
class PhraseGroup(Base):
    __tablename__ = 'groups'
    
    # Primary Key
    id: str                                 # UUID PRIMARY KEY
    
    # РРЅС„РѕСЂРјР°С†РёСЏ Рѕ РіСЂСѓРїРїРµ
    slug: str                               # Slug РґР»СЏ URL (UNIQUE)
    name: str                               # РќР°Р·РІР°РЅРёРµ РіСЂСѓРїРїС‹ (NOT NULL)
    parent_id: str | None                   # FOREIGN KEY -> groups.id
    
    # Р’РёР·СѓР°Р»СЊРЅС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё
    color: str = '#6366f1'                  # Р¦РІРµС‚ РІ HEX С„РѕСЂРјР°С‚Рµ
    type: str = 'normal'                    # РўРёРї: normal/system/template
    locked: bool = False                    # Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅР° Р»Рё РіСЂСѓРїРїР°
    comment: str | None                     # РљРѕРјРјРµРЅС‚Р°СЂРёР№
    
    # Р’СЂРµРјРµРЅРЅС‹Рµ РјРµС‚РєРё
    created_at: datetime
    updated_at: datetime
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('parent_id', 'name', name='ux_groups_parent_name'),
    )
```

---

## РЎРІСЏР·Рё РјРµР¶РґСѓ С‚Р°Р±Р»РёС†Р°РјРё

```
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚     Account     в”‚
в”‚  (id, name,     в”‚
в”‚   profile_path) в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¬в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в”‚ 1:N
         в”‚
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв–јв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ       в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚      Task       в”‚       в”‚    Proxy     в”‚
в”‚  (account_id,   в”‚в—„в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”¤  (id, host,  в”‚
в”‚   seed_file)    в”‚  N:1  в”‚    port)     в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”       в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚
         в”‚ (РЅРµ РїСЂСЏРјР°СЏ СЃРІСЏР·СЊ)
         в”‚
в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв–јв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ       в”Њв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”ђ
в”‚ FrequencyResult в”‚       в”‚ PhraseGroup  в”‚
в”‚  (mask, region, в”‚       в”‚  (id, name,  в”‚
в”‚   freq_*)       в”‚       в”‚   parent_id) в”‚
в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”       в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
         в”‚                        в”‚
         в””в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”
              (group column)
```

**РћСЃРЅРѕРІРЅС‹Рµ СЃРІСЏР·Рё:**
1. `Account.id` в†ђ `Task.account_id` (1:N)
2. `Proxy.id` в†ђ `Account.proxy_id` (1:N)
3. `PhraseGroup.id` в†ђ `PhraseGroup.parent_id` (self-referential)
4. `FrequencyResult.group` в†’ `PhraseGroup.name` (РїРѕ СЃС‚СЂРѕРєРµ, РЅРµ FK)

---

## CRUD РѕРїРµСЂР°С†РёРё

### РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Р±Р°Р·С‹ РґР°РЅРЅС‹С…

```python
from backend.db import init_db

# РЎРѕР·РґР°С‚СЊ РІСЃРµ С‚Р°Р±Р»РёС†С‹
init_db()
# Output: вњ“ Database initialized at /path/to/keyset.db
```

### РџРѕР»СѓС‡РµРЅРёРµ СЃРµСЃСЃРёРё

```python
from backend.db import get_db

# Context manager
with next(get_db()) as db:
    # СЂР°Р±РѕС‚Р° СЃ db
    pass
```

---

### Account РѕРїРµСЂР°С†РёРё

**РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚:**
```python
from backend.db import create_account, SessionLocal

with SessionLocal() as db:
    account = create_account(
        db,
        name="user@example.com",
        profile_path="/profiles/user1",
        proxy="http://proxy:8080",
        notes="РўРµСЃС‚РѕРІС‹Р№ Р°РєРєР°СѓРЅС‚"
    )
    print(f"Created account ID: {account.id}")
```

**РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ Р°РєРєР°СѓРЅС‚С‹:**
```python
from backend.db import get_accounts, SessionLocal

with SessionLocal() as db:
    accounts = get_accounts(db, skip=0, limit=100)
    for acc in accounts:
        print(f"{acc.name} - {acc.status}")
```

**РћР±РЅРѕРІРёС‚СЊ Р°РєРєР°СѓРЅС‚:**
```python
from backend.db import update_account, SessionLocal

with SessionLocal() as db:
    account = update_account(
        db,
        account_id=1,
        status='ok',
        proxy='http://newproxy:8080'
    )
```

**РЈРґР°Р»РёС‚СЊ Р°РєРєР°СѓРЅС‚:**
```python
from backend.db import delete_account, SessionLocal

with SessionLocal() as db:
    success = delete_account(db, account_id=1)
    print(f"Deleted: {success}")
```

---

### Task РѕРїРµСЂР°С†РёРё

**РЎРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ:**
```python
from backend.db import create_task, SessionLocal

with SessionLocal() as db:
    task = create_task(
        db,
        account_id=1,
        seed_file="phrases.txt",
        region=225,
        headless=False,
        kind="frequency"
    )
```

**РџРѕР»СѓС‡РёС‚СЊ Р·Р°РґР°С‡Рё:**
```python
from backend.db import get_tasks, SessionLocal

with SessionLocal() as db:
    tasks = get_tasks(db, skip=0, limit=50)
    for task in tasks:
        print(f"Task {task.id}: {task.status}")
```

**РћР±РЅРѕРІРёС‚СЊ СЃС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё:**
```python
from backend.db import update_task, SessionLocal
from datetime import datetime

with SessionLocal() as db:
    task = update_task(
        db,
        task_id=1,
        status='running',
        started_at=datetime.utcnow()
    )
```

---

### FrequencyResult РѕРїРµСЂР°С†РёРё

**Р§РµСЂРµР· СЃРµСЂРІРёСЃ (СЂРµРєРѕРјРµРЅРґСѓРµРјС‹Р№ СЃРїРѕСЃРѕР±):**

```python
from keyset.services import frequency as freq_service

# Р”РѕР±Р°РІРёС‚СЊ С„СЂР°Р·С‹ РІ РѕС‡РµСЂРµРґСЊ
inserted = freq_service.enqueue_masks(
    masks=['РєСѓРїРёС‚СЊ iphone', 'РєСѓРїРёС‚СЊ samsung'],
    region=225
)

# РџРѕР»СѓС‡РёС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚С‹
results = freq_service.list_results(
    status='ok',
    limit=100
)

# РћР±РЅРѕРІРёС‚СЊ РіСЂСѓРїРїСѓ
freq_service.update_group(
    ids=[1, 2, 3],
    group='РњРѕР±РёР»СЊРЅС‹Рµ С‚РµР»РµС„РѕРЅС‹'
)

# РЈРґР°Р»РёС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚С‹
deleted = freq_service.delete_results(ids=[1, 2, 3])

# РћС‡РёСЃС‚РёС‚СЊ РІСЃРµ
freq_service.clear_results()
```

---

### Proxy РѕРїРµСЂР°С†РёРё

**РЎРѕР·РґР°С‚СЊ РїСЂРѕРєСЃРё:**
```python
from backend.db import create_proxy, SessionLocal

with SessionLocal() as db:
    proxy = create_proxy(
        db,
        host='proxy.example.com',
        port=8080,
        username='user',
        password='pass',
        proxy_type='http',
        country='RU'
    )
```

**РџРѕР»СѓС‡РёС‚СЊ РїСЂРѕРєСЃРё:**
```python
from backend.db import get_proxies, SessionLocal

with SessionLocal() as db:
    proxies = get_proxies(db)
    for proxy in proxies:
        print(f"{proxy.host}:{proxy.port} - {proxy.status}")
```

---

## РњРёРіСЂР°С†РёРё

### РЎРѕР·РґР°РЅРёРµ СЃС…РµРјС‹

РџСЂРё РїРµСЂРІРѕРј Р·Р°РїСѓСЃРєРµ Р±Р°Р·С‹ РґР°РЅРЅС‹С… РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РёРЅРёС†РёР°Р»РёР·Р°С†РёСЏ:

```python
from backend.db import Base, engine

# РЎРѕР·РґР°С‚СЊ РІСЃРµ С‚Р°Р±Р»РёС†С‹
Base.metadata.create_all(bind=engine)
```

### РЎРєСЂРёРїС‚ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё

```bash
# Р—Р°РїСѓСЃС‚РёС‚СЊ РЅР°РїСЂСЏРјСѓСЋ
python -m backend.db
```

Р’С‹РІРѕРґ:
```
вњ“ Database initialized at /path/to/backend/keyset.db
Database schema created successfully!
```

---

## РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ

### 1. РЎРѕР·РґР°РЅРёРµ Р°РєРєР°СѓРЅС‚Р° СЃ РїСЂРѕРєСЃРё

```python
from keyset.services.accounts import create_account

account = create_account(
    name='test@yandex.ru',
    profile_path='/home/user/profiles/test',
    proxy='http://user:pass@proxy.com:8080',
    notes='Р Р°Р±РѕС‡РёР№ Р°РєРєР°СѓРЅС‚ РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ'
)

print(f"Account {account.name} created with ID {account.id}")
```

### 2. Р”РѕР±Р°РІР»РµРЅРёРµ С„СЂР°Р· РІ РѕС‡РµСЂРµРґСЊ РїР°СЂСЃРёРЅРіР°

```python
from keyset.services import frequency as freq_service

phrases = [
    'РєСѓРїРёС‚СЊ iphone 15',
    'РєСѓРїРёС‚СЊ samsung galaxy',
    'РєСѓРїРёС‚СЊ xiaomi redmi'
]

inserted = freq_service.enqueue_masks(phrases, region=213)  # 213 = РњРѕСЃРєРІР°
print(f"Р”РѕР±Р°РІР»РµРЅРѕ С„СЂР°Р·: {inserted}")
```

### 3. РџРѕР»СѓС‡РµРЅРёРµ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ СЃ С„РёР»СЊС‚СЂР°С†РёРµР№

```python
from keyset.services import frequency as freq_service

# Р’СЃРµ РіРѕС‚РѕРІС‹Рµ СЂРµР·СѓР»СЊС‚Р°С‚С‹
results = freq_service.list_results(status='ok', limit=100)

for result in results:
    print(f"{result['mask']}: WS={result['freq_total']}")
```

### 4. Р Р°Р±РѕС‚Р° СЃ РіСЂСѓРїРїР°РјРё

```python
from keyset.services import frequency as freq_service

# РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РіСЂСѓРїРїС‹
groups = freq_service.get_all_groups()
print(f"Р“СЂСѓРїРїС‹: {groups}")

# РџРµСЂРµРјРµСЃС‚РёС‚СЊ С„СЂР°Р·С‹ РІ РіСЂСѓРїРїСѓ
freq_service.update_group(
    ids=[1, 2, 3, 4, 5],
    group='РўРѕРІР°СЂС‹ > РўРµР»РµС„РѕРЅС‹'
)
```

### 5. РЈРїСЂР°РІР»РµРЅРёРµ СЃС‚Р°С‚СѓСЃРѕРј Р°РєРєР°СѓРЅС‚Р°

```python
from keyset.services.accounts import mark_cooldown, mark_ok

# РџРѕСЃС‚Р°РІРёС‚СЊ Р°РєРєР°СѓРЅС‚ РІ РєСѓР»РґР°СѓРЅ РЅР° 10 РјРёРЅСѓС‚
account = mark_cooldown(account_id=1, minutes=10)
print(f"Account in cooldown until {account.cooldown_until}")

# Р’РµСЂРЅСѓС‚СЊ РІ СЂР°Р±РѕС‡РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ
account = mark_ok(account_id=1)
print(f"Account status: {account.status}")
```

---

## Р’Р°Р¶РЅС‹Рµ Р·Р°РјРµС‡Р°РЅРёСЏ

### РўРёРїС‹ РґР°РЅРЅС‹С…

- **datetime** вЂ” РІСЃРµРіРґР° РІ UTC Р±РµР· timezone
- **str | None** вЂ” nullable РїРѕР»СЏ
- **JSON** вЂ” С…СЂР°РЅРёС‚СЃСЏ РєР°Рє TEXT РІ SQLite

### РЈРЅРёРєР°Р»СЊРЅРѕСЃС‚СЊ

- `Account.name` вЂ” СѓРЅРёРєР°Р»РµРЅ (email)
- `FrequencyResult (mask, region)` вЂ” СѓРЅРёРєР°Р»СЊРЅР°СЏ РїР°СЂР°
- `PhraseGroup (parent_id, name)` вЂ” СѓРЅРёРєР°Р»СЊРЅР°СЏ РїР°СЂР°

### РРЅРґРµРєСЃС‹

РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРё СЃРѕР·РґР°СЋС‚СЃСЏ РЅР°:
- Primary keys (id)
- UNIQUE constraints
- Foreign keys

### Cascade delete

РџСЂРё СѓРґР°Р»РµРЅРёРё `Account` Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СѓРґР°Р»СЏСЋС‚СЃСЏ РІСЃРµ СЃРІСЏР·Р°РЅРЅС‹Рµ `Task` (cascade='all, delete-orphan')

---

**РЎР»РµРґСѓСЋС‰РёР№ СЂР°Р·РґРµР»:** [02_AUTHENTICATION.md](./02_AUTHENTICATION.md) вЂ” РђСѓС‚РµРЅС‚РёС„РёРєР°С†РёСЏ Рё СЂР°Р±РѕС‚Р° СЃ РєСѓРєР°РјРё
