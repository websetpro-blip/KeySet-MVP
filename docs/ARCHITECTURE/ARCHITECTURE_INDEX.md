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

### 🔧 Парсинг и обработка

5. **[05_DATA_TAB_REHABILITATION.md](./05_DATA_TAB_REHABILITATION.md)** — Реабилитация вкладки «Данные»
   - Перестрочка Data Tab: таблица фраз, фильтры, экспорт CSV/Excel
   - Синхронизация Zustand store с API и real-time обновлениями

6. **[06_PARSING.md](./06_PARSING.md)** — Парсинг системы
   - TurboParser архитектура с 10 параллельными вкладками
   - CDP (Chrome DevTools Protocol) перехват запросов
   - MultiParsingWorker для N аккаунтов одновременно
   - Алгоритм распределения фраз между вкладками
   - Retry логика и обработка ошибок
   - Производительность: ~526 фраз/минуту

7. **[07_GEO_SYSTEM.md](./07_GEO_SYSTEM.md)** — Географическая система
   - Дерево из 4414+ регионов Yandex
   - Структура regions.json и загрузка данных
   - GeoSelector UI виджет для выбора региона
   - CDP-патчинг lr/region параметров в API запросы
   - Интеграция с парсером для подстановки region_id

### 🎨 Frontend архитектура

8. **[08_FRONTEND_STRUCTURE.md](./08_FRONTEND_STRUCTURE.md)** — Структура фронтенда
   - React 19 + TypeScript + Vite
   - React Router v7 для маршрутизации
   - Zustand state management
   - Модульная архитектура (accounts, data, masks, analytics)
   - Radix UI компоненты + Tailwind CSS
   - Интеграция с backend API

9. **[09_TABS_OVERVIEW.md](./09_TABS_OVERVIEW.md)** — Обзор вкладок UI
   - Аккаунты: управление Yandex профилями и авто-логин
   - Данные: таблица фраз, группировка, экспорт CSV/Excel
   - Маски: генератор ключевых слов по шаблонам
   - Аналитика: графики, статистика, отчёты
   - Навигация и взаимодействие между модулями

### 🔌 API и интеграции

10. **[10_API_INTEGRATION.md](./10_API_INTEGRATION.md)** — API интеграция
    - FastAPI REST endpoints (accounts, data, wordstat)
    - WebSocket для real-time обновлений статуса
    - Интеграция с Yandex Wordstat API через CDP
    - Pydantic валидация request/response
    - CORS настройка и error handling

### 📊 Потоки данных и архитектура

11. **[11_DATA_FLOW.md](./11_DATA_FLOW.md)** — Потоки данных
    - Жизненный цикл задачи: UI → API → Parser → DB → UI
    - Диаграммы последовательности операций
    - State management flow через Zustand
    - Real-time обновления через WebSocket
    - Интеграция компонентов системы

### 🚀 Production и Deployment

12. **[12_PRODUCTION_WINDOWS_BUILD.md](./12_PRODUCTION_WINDOWS_BUILD.md)** — Production сборка
    - Сборка standalone Windows приложения
    - PyInstaller для Python backend
    - Vite build для frontend static files
    - Launcher скрипт и инсталлятор
    - Deployment и distribution стратегия

### 🔒 Безопасность и Мониторинг

13. **[13_SECURITY_NOTES.md](./13_SECURITY_NOTES.md)** — Безопасность
    - Защита cookies и аутентификационных данных
    - Контроль доступа к БД и конфигурации
    - Безопасное хранение proxy credentials
    - Маскирование чувствительных данных в логах
    - Security best practices и checklist

14. **[14_LOGGING_OBSERVABILITY.md](./14_LOGGING_OBSERVABILITY.md)** — Логирование
    - Структурированное логирование через Python logging
    - Уровни логов (DEBUG/INFO/WARNING/ERROR/CRITICAL)
    - Rotation и архивация логов
    - Metrics сбор и мониторинг производительности
    - Debugging парсера и анализ ошибок

### 🗄️ База данных

15. **[15_MIGRATIONS_AND_SCHEMA_VERSIONING.md](./15_MIGRATIONS_AND_SCHEMA_VERSIONING.md)** — Миграции БД
    - Alembic для версионирования схемы
    - Создание и применение миграций
    - Rollback стратегия и backward compatibility
    - Data migrations и schema changes
    - Production deployment миграций

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
