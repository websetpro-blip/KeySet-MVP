# Индекс архитектуры KeySet-MVP

> **Полная документация архитектуры системы KeySet-MVP**  
> Версия: 1.0  
> Дата: 2024  
> Язык: Русский

## 📋 Содержание документации

### 🗄️ Базовые компоненты

1. **[01_DATABASE.md](./01_DATABASE.md)** — База данных
   - SQLite структура и модели данных
   - Таблицы: accounts, tasks, freq_results, proxies, groups
   - Relationships и constraints
   - Миграции и инициализация
   - CRUD операции

2. **[02_AUTHENTICATION.md](./02_AUTHENTICATION.md)** — Аутентификация
   - Работа с куками Yandex
   - Chrome profile management
   - Сессии и storage_state
   - Автологин механизм
   - Декодирование куков v10/v11

3. **[03_ACCOUNTS_PROFILES.md](./03_ACCOUNTS_PROFILES.md)** — Аккаунты и профили
   - Управление аккаунтами Yandex
   - Chrome профили и их структура
   - Статусы аккаунтов (ok/cooldown/captcha/banned)
   - Связь account ↔ proxy ↔ cookies
   - Функции создания, обновления, удаления

### 🌐 Сетевая инфраструктура

4. **[04_PROXY_CONNECTIONS.md](./04_PROXY_CONNECTIONS.md)** — Прокси система
   - ProxyManager singleton
   - Типы прокси (http/https/socks5)
   - Стратегии: fixed/rotate
   - Проверка прокси и IP detection
   - Интеграция с Playwright и Chrome
   - Настройка и хранение (proxies.json)

5. **[06_GEO_SYSTEM.md](./06_GEO_SYSTEM.md)** — Географическая система
   - Дерево регионов (4414+ гео)
   - Структура regions.json
   - GeoSelector виджет
   - Подстановка region_id в API запросы
   - CDP-патчинг lr/region параметров

### 🔧 Парсинг и обработка

5. **[05_PARSING.md](./05_PARSING.md)** — Парсер системы
   - TurboParser архитектура
   - 10 параллельных вкладок на аккаунт
   - CDP (Chrome DevTools Protocol) перехват
   - Playwright + Chrome integration
   - Алгоритм распределения фраз
   - Обработка ошибок и retry логика
   - MultiParsingWorker для N аккаунтов
   - Производительность: ~526 фраз/мин

### 🎨 Frontend архитектура

7. **[07_FRONTEND_STRUCTURE.md](./07_FRONTEND_STRUCTURE.md)** — Структура фронтенда
   - React 18 + TypeScript
   - Vite build system
   - Структура модулей (accounts, data, masks, analytics)
   - Routing (React Router)
   - Zustand state management
   - Компоненты и layout
   - Theme system (Ant Design)

8. **[08_TABS_OVERVIEW.md](./08_TABS_OVERVIEW.md)** — Обзор вкладок
   - **Аккаунты** — управление профилями Yandex
   - **Данные** — таблица фраз, группы, фильтрация
   - **Маски** — генерация ключевых слов
   - **Аналитика** — статистика и отчеты
   - Функционал каждой вкладки
   - UI компоненты и взаимодействие

### 🔌 API и интеграции

9. **[09_API_INTEGRATION.md](./09_API_INTEGRATION.md)** — API интеграция
   - FastAPI backend endpoints
   - `/api/accounts` — работа с аккаунтами
   - `/api/data` — фразы и группы
   - `/api/wordstat` — запуск парсинга
   - Yandex Wordstat API интеграция
   - Supabase (если используется)
   - WebSocket для real-time обновлений

### 🛠️ Утилиты и сервисы

10. **[10_UTILS_SERVICES.md](./10_UTILS_SERVICES.md)** — Утилиты и сервисы
    - Services: accounts, proxy_manager, multiparser_manager
    - Utils: proxy, text_fix, cookie декодирование
    - ChromeLauncher
    - BrowserFactory
    - Логирование и error handling
    - Helpers и common functions

### 📊 Потоки данных

11. **[11_DATA_FLOW.md](./11_DATA_FLOW.md)** — Потоки данных
    - Диаграммы архитектуры
    - Жизненный цикл задачи парсинга
    - Поток данных: UI → API → Parser → DB
    - State management flow (Zustand)
    - Real-time обновления
    - Взаимодействие компонентов

---

## 🎯 Общая архитектура системы

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TS)                     │
│  ┌────────────┬────────────┬────────────┬──────────────┐         │
│  │  Accounts  │    Data    │   Masks    │  Analytics   │         │
│  │   Module   │   Module   │   Module   │    Module    │         │
│  └─────┬──────┴─────┬──────┴─────┬──────┴──────┬───────┘         │
│        │            │            │             │                 │
│        └────────────┴────────────┴─────────────┘                 │
│                          │                                        │
│                    Zustand Store                                 │
│                          │                                        │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                      HTTP / WS
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  ┌────────────┬────────────┬────────────┬──────────────┐        │
│  │  accounts  │    data    │  wordstat  │  devtools    │        │
│  │   router   │   router   │   router   │    router    │        │
│  └─────┬──────┴─────┬──────┴─────┬──────┴──────┬───────┘        │
│        │            │            │             │                │
└────────┼────────────┼────────────┼─────────────┼────────────────┘
         │            │            │             │
         └────────────┴────────────┴─────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼────────┐      ┌─────────▼────────┐
│  SQLite DB      │      │  Keyset Services │
│  - accounts     │      │  - accounts.py   │
│  - tasks        │      │  - proxy_mgr.py  │
│  - freq_results │      │  - multiparser   │
│  - proxies      │      │  - chrome        │
│  - groups       │      └─────────┬────────┘
└─────────────────┘                │
                         ┌─────────▼────────┐
                         │  TurboParser     │
                         │  (Playwright +   │
                         │   Chrome CDP)    │
                         └─────────┬────────┘
                                   │
                         ┌─────────▼────────┐
                         │ Yandex Wordstat  │
                         │      API         │
                         └──────────────────┘
```

## 🚀 Основные технологии

### Backend
- **Python 3.11+** — основной язык
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM для работы с БД
- **SQLite** — база данных
- **Playwright** — автоматизация браузера
- **aiohttp** — async HTTP клиент

### Frontend
- **React 18** — UI библиотека
- **TypeScript** — типизированный JS
- **Vite** — build tool
- **Zustand** — state management
- **Ant Design** — UI компоненты
- **React Router** — маршрутизация

### Парсинг
- **Chrome/Chromium** — браузер
- **CDP (Chrome DevTools Protocol)** — перехват запросов
- **Playwright** — управление браузером
- **10 параллельных вкладок** — на аккаунт
- **N аккаунтов** — параллельно

## 📈 Производительность

- **~526 фраз/минуту** при 5 аккаунтах × 10 вкладок
- **4414+ регионов** поддерживается
- **До 100 параллельных потоков** (10 аккаунтов × 10 вкладок)
- **Real-time обновления** через WebSocket

## 🔑 Ключевые особенности

1. **Массовый парсинг** — тысячи фраз параллельно
2. **Множественные аккаунты** — автоматическое управление
3. **Тысячи геолокаций** — автоподмена региона
4. **CDP перехват** — модификация API запросов на лету
5. **Прокси ротация** — поддержка различных стратегий
6. **Cookie management** — автоматическое сохранение сессий
7. **Retry логика** — обработка ошибок и повторы
8. **Real-time UI** — live обновления статуса

## 📚 Как пользоваться документацией

1. **Начните с [11_DATA_FLOW.md](./11_DATA_FLOW.md)** — чтобы понять общую картину
2. **Изучите [01_DATABASE.md](./01_DATABASE.md)** — структуру данных
3. **Прочитайте [05_PARSING.md](./05_PARSING.md)** — ядро системы
4. **Погрузитесь в нужный модуль** — по необходимости

## 🔄 Обновления

Документация актуальна на момент создания и будет обновляться по мере развития проекта.

---

**Следующий шаг:** [01_DATABASE.md](./01_DATABASE.md) — Структура базы данных
