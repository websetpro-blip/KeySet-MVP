# 03. Аккаунты и Chrome профили

> **Управление аккаунтами Яндекс, профилями Chrome и статусами**

## 📋 Содержание

- [Обзор](#обзор)
- [Структура аккаунта](#структура-аккаунта)
- [Статусы аккаунта](#статусы-аккаунта)
- [Работа с профилями](#работа-с-профилями)
- [Менеджмент аккаунтов](#менеджмент-аккаунтов)
- [API уровня backend](#api-уровня-backend)
- [Интеграция с фронтендом](#интеграция-с-фронтендом)
- [Примеры использования](#примеры-использования)

---

## Обзор

Модуль аккаунтов KeySet-MVP отвечает за:

1. **Хранение данных аккаунта** в БД (`accounts` таблица)
2. **Управление Chrome профилями** (пути, нормализация, запуск)
3. **Назначение и ротацию прокси**
4. **Отслеживание статуса аккаунта** (ok/cooldown/captcha/...)
5. **Интеграцию с фронтендом** через REST API `/api/accounts`

Основной код расположен в:
- `backend/db.py` — CRUD операции для таблицы `accounts`
- `keyset/core/models.py` — ORM модель аккаунта
- `keyset/services/accounts.py` — бизнес-логика и утилиты
- `keyset/services/chrome_launcher.py` — работа с профилями
- `backend/routers/accounts.py` — REST API для фронтенда

---

## Структура аккаунта

**Модель:** `keyset/core/models.py`

```python
class Account(Base):
    __tablename__ = 'accounts'

    id: Mapped[int]
    name: Mapped[str]               # Email аккаунта (уникальный идентификатор)
    profile_path: Mapped[str]       # Папка профиля Chrome
    proxy: Mapped[str | None]       # URI прокси: http://user:pass@host:port
    proxy_id: Mapped[str | None]    # ID в ProxyManager (config/proxies.json)
    proxy_strategy: Mapped[str]     # Стратегия: fixed / rotate
    captcha_key: Mapped[str | None] # Ключ антикапчи (опционально)
    cookies: Mapped[str | None]     # JSON с куками (см. Authentication)

    status: Mapped[str]             # Текущий статус (см. ниже)
    captcha_tries: Mapped[int]      # Количество попыток решения капчи
    cooldown_until: Mapped[datetime | None]

    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    last_used_at: Mapped[datetime | None]

    notes: Mapped[str | None]
    tasks: Mapped[list['Task']]
```

---

## Статусы аккаунта

### Enum `ACCOUNT_STATUSES`

```python
ACCOUNT_STATUSES = (
    'ok',        # Аккаунт в рабочем состоянии
    'cooldown',  # Временный кулдаун (пауза)
    'captcha',   # Требуется решение капчи
    'banned',    # Аккаунт заблокирован
    'disabled',  # Отключен пользователем
    'error',     # Ошибка при последней операции
)
```

### Отображение статусов во фронтенде

**Файл:** `backend/routers/accounts.py`

```python
def _map_status(raw_status: str | None) -> tuple[str, str]:
    """Вернуть (frontend_status, human_label)."""
    status = (raw_status or "ok").lower()
    if status in {"ok"}:
        return "active", "Авторизован"
    if status in {"cooldown"}:
        return "working", "В работе"
    if status in {"captcha"}:
        return "needs_login", "Требуется капча"
    if status in {"banned", "disabled"}:
        return "error", "Заблокирован"
    if status in {"error"}:
        return "error", "Ошибка"
    return "needs_login", "Неизвестно"
```

**UI статус** хранится отдельно от внутреннего `status` для удобства визуализации.

### Управление статусами

**Файл:** `keyset/services/accounts.py`

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

**Шорткаты:** `mark_captcha`, `mark_cooldown`, `mark_error`, `mark_ok`.

---

## Работа с профилями

### Нормализация пути профиля

```python
profile_dir = ChromeLauncher._normalise_profile_path(profile_path, account.name)
```

Логика:
1. Поддерживает старые пути из «legacy» версий (`C:/AI/yandex/`)
2. Создаёт профиль в `.profiles/{email}` если путь не указан
3. Проверяет наличие каталога и создаёт при необходимости

### ChromeLauncher

**Файл:** `keyset/services/chrome_launcher.py`

Возможности:
- Поиск установленного Chrome (`_resolve_chrome_executable`)
- Управление процессами Chrome (запуск/терминация)
- Прокси через флаги `--proxy-server`
- Генерация расширений для прокси с авторизацией

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

## Менеджмент аккаунтов

### Сервис управления

**Файл:** `keyset/services/accounts.py`

Основные функции:

- `list_accounts()` — все аккаунты с авто-обновлением статусов
- `create_account()` — создание нового аккаунта
- `upsert_account()` — создать или обновить по email
- `update_account()` — обновление полей
- `set_account_proxy()` — назначение прокси
- `delete_account()` — удаление
- `get_account_by_email()` — получить словарь по email
- `get_cookies_status()` — оценка свежести куков
- `autologin_account()` — запуск Playwright автологина

### Автообновление кулдаунов

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

Функция вызывается при каждом `list_accounts()`.

### Санация данных

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

Используется для исправления кодировки (mojibake) и подтягивания прокси по ID.

---

## API уровня backend

**Файл:** `backend/routers/accounts.py`

### Endpoint: `GET /api/accounts`

Возвращает список аккаунтов с сериализацией под фронтенд:

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

**`AccountPayload` структура:**

```python
class AccountPayload(BaseModel):
    id: int
    email: str
    password: str              # всегда пустая строка (пароли не храним)
    secretAnswer: str          # переносится notes
    profilePath: str           # путь к профилю
    status: str                # frontend статус (active/working/...)
    proxy: str                 # host:port
    proxyUsername: str
    proxyPassword: str
    proxyType: str             # http/https/socks5
    fingerprint: str           # "no_spoofing" (заглушка)
    lastLaunch: str            # humanized ("10 мин назад")
    authStatus: str            # "Авторизован", "В работе" ...
    lastLogin: str             # дата в формате YYYY-MM-DD HH:MM
    profileSize: str           # placeholder "—"
```

**Форматирование дат**:

```python
def _format_relative(value: datetime | None) -> str:
    if not value:
        return "—"
    now = datetime.utcnow()
    delta = now - value
    if delta < timedelta(minutes=1):
        return "только что"
    if delta < timedelta(hours=1):
        return f"{delta.seconds // 60} мин назад"
    if delta < timedelta(days=1):
        return f"{delta.seconds // 3600} ч назад"
    if delta < timedelta(days=30):
        return f"{delta.days} дн назад"
    return value.strftime("%Y-%m-%d %H:%M")
```

На текущий момент API **читает данные** из легаси сервиса (`keyset.services.accounts`), а операции create/update/delete выполняются через них напрямую.

---

## Интеграция с фронтендом

### Файл: `frontend/src/modules/accounts`

- `index.tsx` — главный модуль вкладки аккаунтов
- `api.ts` — функции, обращающиеся к `/api/accounts`
- `types.ts` — типы данных фронтенда
- `mockData.ts` — моки для разработки без backend
- `utils.ts` — форматирование и вспомогательные функции

#### Пример использования API на фронтенде

```typescript
// frontend/src/modules/accounts/api.ts
export async function fetchAccounts(): Promise<AccountPayload[]> {
  const response = await fetch("/api/accounts");
  if (!response.ok) {
    throw new Error("Не удалось загрузить аккаунты");
  }
  return response.json();
}
```

### Структура UI

- Таблица с аккаунтами (email, статус, прокси, последние действия)
- Модалка добавления/редактирования аккаунта
- Привязка прокси и управление стратегией
- Метки свежести профиля (на основе `get_cookies_status`)

---

## Примеры использования

### 1. Создание или обновление аккаунта

```python
from keyset.services.accounts import upsert_account

account = upsert_account(
    name='user@yandex.ru',
    profile_path='C:/AI/yandex/.profiles/user',
    proxy='http://user:pass@proxy.example.com:8080',
    notes='Основной аккаунт',
    proxy_strategy='rotate'
)
print(f"Account ID: {account.id}, proxy: {account.proxy}")
```

### 2. Назначение прокси по ID

```python
from keyset.services.accounts import set_account_proxy

account = set_account_proxy(
    account_id=1,
    proxy_id='proxy_us_1',
    strategy='rotate'
)
print(account.proxy)  # => http://user:pass@us.proxy.net:9000
```

### 3. Пометка аккаунта как «captcha»

```python
from keyset.services.accounts import mark_captcha

account = mark_captcha(account_id=3, minutes=45)
print(account.status)         # captcha
print(account.cooldown_until) # время выхода из карантина
```

### 4. Получение статуса куков

```python
from keyset.services.accounts import get_cookies_status
from keyset.services.accounts import list_accounts

accounts = list_accounts()
for account in accounts:
    print(account.name, get_cookies_status(account))
# Вывод: user@yandex.ru 18.2KB Chrome (Fresh)
```

### 5. Удаление аккаунта

```python
from keyset.services.accounts import delete_account

delete_account(account_id=2)
```

---

## Важные замечания

1. **Пароли не хранятся** — поле `password` в API всегда пустое
2. **Proxy стратегия** — влияет на ротацию (используется в парсере)
3. **Notes → secretAnswer** — исторически поле называется так во фронтенде
4. **Profile path** — должен указывать на существующую папку с профилем
5. **Cookies** — синхронизируются через модуль аутентификации

---

**Следующий раздел:** [04_PROXY_CONNECTIONS.md](./04_PROXY_CONNECTIONS.md) — Прокси система и ротация
