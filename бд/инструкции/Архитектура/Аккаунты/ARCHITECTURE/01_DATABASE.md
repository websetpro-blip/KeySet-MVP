# 01. База данных KeySet-MVP

> **Документация структуры базы данных, моделей и операций**

## 📋 Содержание

- [Обзор](#обзор)
- [Технологии](#технологии)
- [Модели данных](#модели-данных)
- [Связи между таблицами](#связи-между-таблицами)
- [CRUD операции](#crud-операции)
- [Миграции](#миграции)
- [Примеры использования](#примеры-использования)

---

## Обзор

KeySet использует **SQLite** в качестве локальной базы данных для хранения:
- Аккаунтов Yandex с профилями и прокси
- Задач парсинга
- Результатов частотности (Wordstat)
- Прокси серверов
- Групп фраз

**Расположение базы данных:**
```
# Development mode:
backend/keyset.db

# Production mode (упакованное приложение):
runtime/keyset.db
```

**ORM:** SQLAlchemy 2.x с типизированными mapped columns

**Путь определяется автоматически:** система использует `core/app_paths.py` для определения правильного расположения БД в зависимости от режима работы (dev/frozen).

---

## Технологии

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

# SQLite connection
engine = create_engine("sqlite:///backend/keyset.db", echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

## Модели данных

### 1. Account (аккаунт Yandex)

**Файл:** `core/models.py`

```python
class Account(Base):
    __tablename__ = 'accounts'
    
    # Primary Key
    id: int                                 # PRIMARY KEY AUTOINCREMENT
    
    # Основная информация
    name: str                               # Email аккаунта (UNIQUE, NOT NULL)
    profile_path: str                       # Путь к Chrome профилю
    
    # Прокси настройки
    proxy: str | None                       # URI: http://user:pass@host:port
    proxy_id: str | None                    # ID из proxy_manager (внешний ключ)
    proxy_strategy: str = 'fixed'           # Стратегия: fixed/rotate
    
    # Авторизация
    cookies: str | None                     # JSON с куками Yandex
    captcha_key: str | None                 # Ключ для антикапча сервиса
    
    # Статус аккаунта
    status: str = 'ok'                      # ok/cooldown/captcha/banned/disabled/error
    captcha_tries: int = 0                  # Количество попыток решения капчи
    
    # Временные метки
    created_at: datetime                    # Дата создания
    updated_at: datetime                    # Дата обновления
    last_used_at: datetime | None           # Последнее использование
    cooldown_until: datetime | None         # До какого времени в кулдауне
    
    # Дополнительно
    notes: str | None                       # Произвольные заметки
    
    # Relationships
    tasks: list[Task]                       # Связь 1:N с задачами
    proxy_obj: Proxy                        # Связь с прокси объектом
```

**Enum статусов:**
```python
ACCOUNT_STATUSES = (
    'ok',        # Аккаунт готов к работе
    'cooldown',  # В кулдауне (временная пауза)
    'captcha',   # Требуется решение капчи
    'banned',    # Забанен Яндексом
    'disabled',  # Отключен пользователем
    'error',     # Ошибка при работе
)
```

---

### 2. Task (задача парсинга)

**Файл:** `core/models.py`

```python
class Task(Base):
    __tablename__ = 'tasks'
    
    # Primary Key
    id: int                                 # PRIMARY KEY
    account_id: int | None                  # FOREIGN KEY -> accounts.id
    
    # Параметры задачи
    seed_file: str                          # Путь к файлу с фразами
    region: int = 225                       # ID региона (lr параметр)
    headless: bool = False                  # Headless режим браузера
    dump_json: bool = False                 # Сохранять ли JSON лог
    kind: str = 'frequency'                 # Тип: frequency/forecast/etc
    params: str | None                      # JSON с дополнительными параметрами
    
    # Статус выполнения
    status: str = 'queued'                  # queued/running/completed/failed
    
    # Временные метки
    created_at: datetime                    # Дата создания
    started_at: datetime | None             # Дата начала выполнения
    finished_at: datetime | None            # Дата завершения
    
    # Результаты
    log_path: str | None                    # Путь к логу задачи
    output_path: str | None                 # Путь к файлу с результатами
    error_message: str | None               # Текст ошибки если status=failed
    
    # Relationships
    account: Account | None                 # Связь с аккаунтом
```

---

### 3. FrequencyResult (результаты частотности)

**Файл:** `core/models.py`

```python
class FrequencyResult(Base):
    __tablename__ = 'freq_results'
    
    # Primary Key
    id: int                                 # PRIMARY KEY
    
    # Фраза и регион
    mask: str                               # Ключевая фраза (NOT NULL, INDEX)
    region: int = 225                       # ID региона (INDEX)
    
    # Частотности (из Wordstat)
    freq_total: int = 0                     # Широкая частотность (WS)
    freq_quotes: int = 0                    # Фразовое соответствие ("WS")
    freq_exact: int = 0                     # Точное соответствие (!WS)
    
    # Метаданные
    group: str | None                       # Группа для организации
    status: str = 'queued'                  # queued/ok/error
    attempts: int = 0                       # Количество попыток парсинга
    error: str | None                       # Текст ошибки
    
    # Временные метки
    created_at: datetime                    # Дата создания
    updated_at: datetime                    # Дата обновления
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('mask', 'region', name='uq_mask_region'),
    )
```

**Уникальность:** Пара `(mask, region)` уникальна в пределах таблицы.

---

### 4. Proxy (прокси сервер)

**Статус:** ⚠️ **Модель не реализована в текущей версии**

В текущей версии прокси управляются через:
- Поле `proxy` в модели `Account` (строка с URI вида `http://user:pass@host:port`)
- Поле `proxy_id` для связи с внешним менеджером прокси
- Поле `proxy_strategy` для выбора стратегии (fixed/rotate)
- API endpoint `/api/proxies` для управления прокси
- Сервис `ProxyManager` для ротации и проверки прокси

**Планируемая структура модели (для будущей версии):**

```python
class Proxy(Base):
    __tablename__ = 'proxies'

    # Primary Key
    id: int                                 # PRIMARY KEY

    # Информация о прокси
    host: str                               # Хост (NOT NULL)
    port: int                               # Порт (NOT NULL)
    username: str | None                    # Логин для авторизации
    password: str | None                    # Пароль для авторизации
    proxy_type: str = 'http'                # Тип: http/https/socks5

    # Статус и метрики
    status: str = 'active'                  # active/dead/checking
    country: str | None                     # Код страны
    speed_ms: int | None                    # Время отклика в мс

    # Временные метки
    created_at: datetime
    updated_at: datetime
    last_checked_at: datetime | None        # Последняя проверка

    # Заметки
    notes: str | None
```

---

### 5. PhraseGroup (группы фраз)

**Файл:** `core/models.py`

```python
class PhraseGroup(Base):
    __tablename__ = 'groups'
    
    # Primary Key
    id: str                                 # UUID PRIMARY KEY
    
    # Информация о группе
    slug: str                               # Slug для URL (UNIQUE)
    name: str                               # Название группы (NOT NULL)
    parent_id: str | None                   # FOREIGN KEY -> groups.id
    
    # Визуальные настройки
    color: str = '#6366f1'                  # Цвет в HEX формате
    type: str = 'normal'                    # Тип: normal/system/template
    locked: bool = False                    # Заблокирована ли группа
    comment: str | None                     # Комментарий
    
    # Временные метки
    created_at: datetime
    updated_at: datetime
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('parent_id', 'name', name='ux_groups_parent_name'),
    )
```

---

## Связи между таблицами

```
┌─────────────────┐
│     Account     │
│  (id, name,     │
│   profile_path) │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐       ┌──────────────┐
│      Task       │       │    Proxy     │
│  (account_id,   │◄──────┤  (id, host,  │
│   seed_file)    │  N:1  │    port)     │
└─────────────────┘       └──────────────┘
         │
         │ (не прямая связь)
         │
┌────────▼────────┐       ┌──────────────┐
│ FrequencyResult │       │ PhraseGroup  │
│  (mask, region, │       │  (id, name,  │
│   freq_*)       │       │   parent_id) │
└─────────────────┘       └──────────────┘
         │                        │
         └────────────────────────┘
              (group column)
```

**Основные связи:**
1. `Account.id` ← `Task.account_id` (1:N)
2. `Proxy.id` ← `Account.proxy_id` (1:N)
3. `PhraseGroup.id` ← `PhraseGroup.parent_id` (self-referential)
4. `FrequencyResult.group` → `PhraseGroup.name` (по строке, не FK)

---

## CRUD операции

### Инициализация базы данных

```python
from backend.db import init_db

# Создать все таблицы
init_db()
# Output: ✓ Database initialized at /path/to/keyset.db
```

### Получение сессии

```python
from backend.db import get_db

# Context manager
with next(get_db()) as db:
    # работа с db
    pass
```

---

### Account операции

**Создать аккаунт:**
```python
from backend.db import create_account, SessionLocal

with SessionLocal() as db:
    account = create_account(
        db,
        name="user@example.com",
        profile_path="/profiles/user1",
        proxy="http://proxy:8080",
        notes="Тестовый аккаунт"
    )
    print(f"Created account ID: {account.id}")
```

**Получить все аккаунты:**
```python
from backend.db import get_accounts, SessionLocal

with SessionLocal() as db:
    accounts = get_accounts(db, skip=0, limit=100)
    for acc in accounts:
        print(f"{acc.name} - {acc.status}")
```

**Обновить аккаунт:**
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

**Удалить аккаунт:**
```python
from backend.db import delete_account, SessionLocal

with SessionLocal() as db:
    success = delete_account(db, account_id=1)
    print(f"Deleted: {success}")
```

---

### Task операции

**Создать задачу:**
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

**Получить задачи:**
```python
from backend.db import get_tasks, SessionLocal

with SessionLocal() as db:
    tasks = get_tasks(db, skip=0, limit=50)
    for task in tasks:
        print(f"Task {task.id}: {task.status}")
```

**Обновить статус задачи:**
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

### FrequencyResult операции

**Через сервис (рекомендуемый способ):**

```python
from keyset.services import frequency as freq_service

# Добавить фразы в очередь
inserted = freq_service.enqueue_masks(
    masks=['купить iphone', 'купить samsung'],
    region=225
)

# Получить результаты
results = freq_service.list_results(
    status='ok',
    limit=100
)

# Обновить группу
freq_service.update_group(
    ids=[1, 2, 3],
    group='Мобильные телефоны'
)

# Удалить результаты
deleted = freq_service.delete_results(ids=[1, 2, 3])

# Очистить все
freq_service.clear_results()
```

---

### Proxy операции

**Создать прокси:**
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

**Получить прокси:**
```python
from backend.db import get_proxies, SessionLocal

with SessionLocal() as db:
    proxies = get_proxies(db)
    for proxy in proxies:
        print(f"{proxy.host}:{proxy.port} - {proxy.status}")
```

---

## Миграции

### Создание схемы

При первом запуске базы данных выполняется автоматическая инициализация:

```python
from backend.db import Base, engine

# Создать все таблицы
Base.metadata.create_all(bind=engine)
```

### Скрипт инициализации

```bash
# Запустить напрямую
python -m backend.db
```

Вывод:
```
✓ Database initialized at /path/to/backend/keyset.db
Database schema created successfully!
```

---

## Примеры использования

### 1. Создание аккаунта с прокси

```python
from keyset.services.accounts import create_account

account = create_account(
    name='test@yandex.ru',
    profile_path='/home/user/profiles/test',
    proxy='http://user:pass@proxy.com:8080',
    notes='Рабочий аккаунт для тестирования'
)

print(f"Account {account.name} created with ID {account.id}")
```

### 2. Добавление фраз в очередь парсинга

```python
from keyset.services import frequency as freq_service

phrases = [
    'купить iphone 15',
    'купить samsung galaxy',
    'купить xiaomi redmi'
]

inserted = freq_service.enqueue_masks(phrases, region=213)  # 213 = Москва
print(f"Добавлено фраз: {inserted}")
```

### 3. Получение результатов с фильтрацией

```python
from keyset.services import frequency as freq_service

# Все готовые результаты
results = freq_service.list_results(status='ok', limit=100)

for result in results:
    print(f"{result['mask']}: WS={result['freq_total']}")
```

### 4. Работа с группами

```python
from keyset.services import frequency as freq_service

# Получить все группы
groups = freq_service.get_all_groups()
print(f"Группы: {groups}")

# Переместить фразы в группу
freq_service.update_group(
    ids=[1, 2, 3, 4, 5],
    group='Товары > Телефоны'
)
```

### 5. Управление статусом аккаунта

```python
from keyset.services.accounts import mark_cooldown, mark_ok

# Поставить аккаунт в кулдаун на 10 минут
account = mark_cooldown(account_id=1, minutes=10)
print(f"Account in cooldown until {account.cooldown_until}")

# Вернуть в рабочее состояние
account = mark_ok(account_id=1)
print(f"Account status: {account.status}")
```

---

## Важные замечания

### Типы данных

- **datetime** — всегда в UTC без timezone
- **str | None** — nullable поля
- **JSON** — хранится как TEXT в SQLite
- **Mapped[type]** — SQLAlchemy 2.x typed columns

### Уникальность

- `Account.name` — уникален (email)
- `FrequencyResult (mask, region)` — уникальная пара
- `PhraseGroup (parent_id, name)` — уникальная пара

### Индексы

Автоматически создаются на:
- Primary keys (id)
- UNIQUE constraints
- Foreign keys

### Cascade delete

При удалении `Account` автоматически удаляются все связанные `Task` (cascade='all, delete-orphan')

### Текущее состояние (2025-01-17)

#### ✅ Реализовано:
- Модель `Account` с полной поддержкой аутентификации и прокси
- Модель `Task` для управления задачами парсинга
- Модель `FrequencyResult` для хранения результатов частотности
- Модель `PhraseGroup` для организации фраз в группы
- API endpoints для всех CRUD операций
- Автоматическое определение пути к БД (dev/production)
- Миграции через ensure_schema()

#### ⚠️ В разработке:
- Модель `Proxy` для централизованного управления прокси
- Расширенная система групп с древовидной структурой
- Система тегов для фраз
- История изменений для фраз

#### 🔄 Текущие роутеры:
- `/api/accounts` — управление аккаунтами
- `/api/data` — работа с фразами и группами
- `/api/wordstat` — парсинг Wordstat
- `/api/regions` — геолокация
- `/api/proxies` — управление прокси (legacy)

---

**Следующий раздел:** [02_AUTHENTICATION.md](./02_AUTHENTICATION.md) — Аутентификация и работа с куками
