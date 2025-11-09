# ЗАДАЧА ДЛЯ CTO: Интеграция готовых модулей в KeySet-MVP

## КРИТИЧНО: ЧТО УЖЕ СДЕЛАНО И НЕЛЬЗЯ ТРОГАТЬ

**НЕ ТРОГАЙ ЭТИ ФАЙЛЫ** - они уже правильно настроены:

1. **`frontend/src/components/layout/AppLayout.tsx`** - верхняя панель с вкладками (Аккаунты, Маски, Данные, Аналитика)
2. **`frontend/src/index.css`** - глобальные стили, кнопки управления окном (свернуть/развернуть/закрыть)
3. **`launcher.py`** - PyWebView лаунчер с frameless окном
4. **`backend/main.py`** - FastAPI сервер
5. **`frontend/package.json`** - все зависимости уже установлены
6. **Роутинг в `frontend/src/App.tsx`** - уже настроен

## ПРОБЛЕМА

Модули в `frontend/src/modules/*` были **переписаны вручную** вместо того чтобы **скопировать готовые из папки ГОТОВЫЕ_МОДУЛИ**. В результате:

- ❌ Функции работают не 1:1 с оригиналом
- ❌ Не все элементы UI перенесены
- ❌ Потеряна часть функциональности

## ЗАДАЧА

**Заменить содержимое модулей на ГОТОВЫЕ из папки `ГОТОВЫЕ_МОДУЛИ` БЕЗ изменения основной структуры приложения.**

## ЧТО НУЖНО СДЕЛАТЬ

### 1. Модуль ДАННЫЕ (приоритет #1)

**Источник:** `ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/*`

**Цель:** `frontend/src/modules/data/`

**Действия:**
```bash
# УДАЛИТЬ текущее содержимое модуля (кроме index.tsx)
rm -rf frontend/src/modules/data/components
rm -rf frontend/src/modules/data/store
rm -rf frontend/src/modules/data/utils
rm -rf frontend/src/modules/data/types
rm -rf frontend/src/modules/data/services
rm -rf frontend/src/modules/data/hooks
rm -rf frontend/src/modules/data/lib
rm frontend/src/modules/data/App.tsx
rm frontend/src/modules/data/App.css
rm frontend/src/modules/data/main.tsx
rm frontend/src/modules/data/vite-env.d.ts

# СКОПИРОВАТЬ готовые файлы 1:1
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/components" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/store" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/utils" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/types" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/services" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/hooks" frontend/src/modules/data/
cp -r "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/lib" frontend/src/modules/data/
cp "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/App.tsx" frontend/src/modules/data/
cp "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/App.css" frontend/src/modules/data/
cp "ГОТОВЫЕ_МОДУЛИ/Данные/старые/src/index.css" frontend/src/modules/data/
```

**Изменить ТОЛЬКО `frontend/src/modules/data/index.tsx`:**
```tsx
import DataApp from "./App";
import "./index.css";

export default function DataModule() {
  return <DataApp />;
}
```

### 2. Модуль МАСКИ (приоритет #2)

**Источник:** `ГОТОВЫЕ_МОДУЛИ/Маски/src/*`

**Цель:** `frontend/src/modules/masks/`

**Действия:**
```bash
# УДАЛИТЬ текущее содержимое
rm -rf frontend/src/modules/masks/components
rm -rf frontend/src/modules/masks/lib
rm -rf frontend/src/modules/masks/hooks
rm frontend/src/modules/masks/App.tsx
rm frontend/src/modules/masks/App.css
rm frontend/src/modules/masks/main.tsx
rm frontend/src/modules/masks/vite-env.d.ts

# СКОПИРОВАТЬ готовые файлы 1:1
cp -r "ГОТОВЫЕ_МОДУЛИ/Маски/src/components" frontend/src/modules/masks/
cp -r "ГОТОВЫЕ_МОДУЛИ/Маски/src/lib" frontend/src/modules/masks/
cp -r "ГОТОВЫЕ_МОДУЛИ/Маски/src/hooks" frontend/src/modules/masks/
cp "ГОТОВЫЕ_МОДУЛИ/Маски/src/App.tsx" frontend/src/modules/masks/
cp "ГОТОВЫЕ_МОДУЛИ/Маски/src/App.css" frontend/src/modules/masks/
cp "ГОТОВЫЕ_МОДУЛИ/Маски/src/index.css" frontend/src/modules/masks/
```

**Изменить ТОЛЬКО `frontend/src/modules/masks/index.tsx`:**
```tsx
import MasksApp from "./App";
import "./index.css";

export default function MasksModule() {
  return <MasksApp />;
}
```

### 3. Модуль АНАЛИТИКА (приоритет #3)

**Источник:** `ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/*`

**Цель:** `frontend/src/modules/analytics/`

**Действия:**
```bash
# УДАЛИТЬ текущее содержимое
rm -rf frontend/src/modules/analytics/components
rm -rf frontend/src/modules/analytics/lib
rm -rf frontend/src/modules/analytics/hooks
rm frontend/src/modules/analytics/App.tsx
rm frontend/src/modules/analytics/App.css
rm frontend/src/modules/analytics/main.tsx
rm frontend/src/modules/analytics/vite-env.d.ts

# СКОПИРОВАТЬ готовые файлы 1:1
cp -r "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/components" frontend/src/modules/analytics/
cp -r "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/lib" frontend/src/modules/analytics/
cp -r "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/hooks" frontend/src/modules/analytics/
cp "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/App.tsx" frontend/src/modules/analytics/
cp "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/App.css" frontend/src/modules/analytics/
cp "ГОТОВЫЕ_МОДУЛИ/Аналитика/yandex-direct-analytics/src/index.css" frontend/src/modules/analytics/
```

**Изменить ТОЛЬКО `frontend/src/modules/analytics/index.tsx`:**
```tsx
import AnalyticsApp from "./App";
import "./index.css";

export default function AnalyticsModule() {
  return <AnalyticsApp />;
}
```

### 4. Модуль АККАУНТЫ (приоритет #4)

**Этот модуль уже частично правильный, НО нужно добавить недостающие стили из оригинала.**

**Источник:** `ГОТОВЫЕ_МОДУЛИ/аккаунты/keyset-v2-fixed/styles.css`

**Действия:**

1. Открой `ГОТОВЫЕ_МОДУЛИ/аккаунты/keyset-v2-fixed/styles.css`
2. Найди стили для:
   - `.password-field` (поле пароля с кнопкой показа)
   - `.advanced-options` (чекбоксы для спуфинга)
   - `.proxy-section` (секции в менеджере прокси)
   - `.proxy-sources` (список источников прокси)
   - `.proxy-parse-options` (опции парсинга)
   - `.captcha-info` (информация о капче)
   - `.action-buttons` (кнопки действий)
3. Скопируй эти стили в `frontend/src/modules/accounts/legacy/styles.css`

**Проверь что есть все эти классы в styles.css.**

## ПРОВЕРКА ПОСЛЕ ЗАМЕНЫ

```bash
# 1. Пересобрать frontend
cd frontend
npm run build

# 2. Запустить приложение
cd ..
python launcher.py

# 3. Проверить все вкладки:
# - Данные: должна быть таблица с фразами, группы слева, toolbar сверху
# - Маски: должен быть генератор с полями ввода
# - Аналитика: должны быть графики и дашборд
# - Аккаунты: должна быть таблица, правое меню с 5 вкладками
```

## ВАЖНЫЕ ПРАВИЛА

1. **НЕ МЕНЯЙ** структуру папок верхнего уровня
2. **НЕ МЕНЯЙ** `frontend/src/App.tsx` (роутинг)
3. **НЕ МЕНЯЙ** `frontend/src/components/layout/AppLayout.tsx` (верхняя панель)
4. **НЕ МЕНЯЙ** `frontend/src/index.css` (глобальные стили)
5. **НЕ МЕНЯЙ** `launcher.py` и `backend/main.py`
6. **КОПИРУЙ** файлы из ГОТОВЫЕ_МОДУЛИ 1:1, НЕ переписывай
7. **МЕНЯЙ ТОЛЬКО** `index.tsx` в каждом модуле для интеграции

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После выполнения задачи:

✅ Все функции работают 1:1 с оригиналом из ГОТОВЫЕ_МОДУЛИ
✅ Верхняя панель с вкладками остается без изменений
✅ Приложение собирается и запускается без ошибок
✅ Все 4 модуля полностью функциональны

## ЕСЛИ ЧТО-ТО СЛОМАЛОСЬ

1. Проверь что не изменил файлы из списка "НЕ ТРОГАЙ"
2. Проверь что скопировал ВСЕ папки из ГОТОВЫЕ_МОДУЛИ (components, lib, store и т.д.)
3. Проверь что `index.tsx` в каждом модуле правильно экспортирует компонент
4. Запусти `npm install` в frontend/ если появились ошибки зависимостей
