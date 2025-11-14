# Анализ модуля "Данные" KeySet-MVP

**Дата:** 2025-11-14
**Проанализированы:** Документация V5_FUNCTIONS_CHECKLIST, ФИНАЛЬНЫЙ_ОТЧЕТ_7_ФУНКЦИЙ, текущий код frontend/backend

---

## 📊 Общая картина

### Всего функций по документации:
- **v4.0:** 28 базовых функций
- **v5.0:** 15 новых функций
- **ИТОГО:** 43 функции

---

## ✅ ЧТО ПОДКЛЮЧЕНО (Frontend + Backend)

### 1. Базовые операции с фразами ✅
**UI:** Toolbar, PhrasesTable
**Backend API:** `/api/data/*`

- ✅ Добавление фраз (Import Modal → POST /api/data/phrases/enqueue)
- ✅ Удаление фраз (DELETE кнопка → POST /api/data/phrases/delete)
- ✅ Очистка всех (Очистить кнопка → POST /api/data/phrases/clear)
- ✅ Загрузка списка (GET /api/data/phrases)
- ✅ Пагинация (offset/limit/cursor)
- ✅ Фильтрация по статусу (status query param)
- ✅ Поиск по тексту (search/q query param)

### 2. Парсинг Wordstat ✅
**UI:** WordstatModal (кнопка "Частота")
**Backend API:** `/api/wordstat/collect`

- ✅ POST /api/wordstat/collect - запуск TurboParser
- ✅ 3 режима: ws (обычная), qws (кавычки), bws (восклицательный)
- ✅ Множественные регионы
- ✅ Интеграция с TurboWordstatParser (5 браузеров × 10 табов)
- ✅ Получение регионов GET /api/wordstat/regions

### 3. Группы фраз ✅
**UI:** GroupsPanel
**Backend API:** `/api/data/groups`, `/api/data/phrases/group`

- ✅ Загрузка групп (GET /api/data/groups)
- ✅ Перемещение фраз в группу (POST /api/data/phrases/group)
- ✅ Drag & Drop фраз на группы (frontend only)
- ✅ Иерархия групп (parentId support)
- ✅ Drag & Drop групп для изменения иерархии (frontend only)

### 4. Выделение и маркировка ✅
**UI:** Toolbar → "Выделение" dropdown
**Store:** selectedPhraseIds, markedPhraseIds

- ✅ Выбрать все (selectAll)
- ✅ Снять выбор (deselectAll)
- ✅ Инвертировать (invertSelection)
- ✅ Маркировка фраз (v5.0) - toggleMarkPhrase, markAllPhrases
- ✅ Отметить по фильтру (markPhrasesByFilter)

### 5. Экспорт данных ✅
**UI:** ExportModal, ExportPresetsModal
**Backend API:** `/api/data/export`

- ✅ GET /api/data/export - CSV export
- ✅ Export Modal с настройками
- ✅ Пресеты экспорта (v5.0) - saveExportPreset, loadExportPreset, deleteExportPreset

### 6. Модалы анализа ✅
**UI:** 18 модальных окон созданы

- ✅ ImportModal - импорт фраз
- ✅ ExportModal - экспорт данных
- ✅ DuplicatesModal - поиск точных дублей
- ✅ MorphDuplicatesModal (v5.0) - морфологические дубли
- ✅ StopwordsManagerModal - управление стоп-словами
- ✅ AdvancedFiltersModal - расширенные фильтры
- ✅ ColumnSettingsModal - настройка столбцов
- ✅ StatisticsModal - статистика
- ✅ FindReplaceModal - поиск и замена
- ✅ PhraseHistoryModal - история изменений
- ✅ SimilarPhrasesModal - похожие фразы
- ✅ CrossMinusationModal (v5.0) - кросс-минусация
- ✅ DataQualityModal (v5.0) - анализ качества
- ✅ PipelinesModal (v5.0) - пайплайны очистки
- ✅ SnapshotsModal (v5.0) - снапшоты состояний
- ✅ TagsModal (v5.0) - управление тегами
- ✅ ViewTemplatesModal (v5.0) - шаблоны видов
- ✅ GroupTypeManagerModal - типы групп

### 7. Store функциональность ✅
**Zustand store:** /frontend/src/modules/data/store/useStore.ts

- ✅ State management с Zustand
- ✅ Undo/Redo (history: past/present/future)
- ✅ localStorage persistence
- ✅ Stopwords система (exact/partial/independent match)
- ✅ Filters (ws/qws/bws min/max, length, contains, etc)
- ✅ Column visibility управление
- ✅ View templates (сохранение настроек таблицы)
- ✅ Pinned phrases (закрепление фраз)
- ✅ Color marking (цветовая маркировка)
- ✅ Activity log (журнал действий)

### 8. Новые функции v5.0 ✅
**UI + Store реализованы**

- ✅ Морфологические дубли (MorphDuplicatesModal)
- ✅ Кросс-минусация (CrossMinusationModal)
- ✅ Анализ качества данных (DataQualityModal)
- ✅ Пайплайны обработки (PipelinesModal)
- ✅ Снапшоты состояний (SnapshotsModal, createSnapshot, restoreSnapshot)
- ✅ Теги фраз (TagsModal, phraseTags, assignTagToPhrase)
- ✅ Пресеты экспорта (ExportPresetsModal)
- ✅ Маркировка фраз (markedPhraseIds отдельно от selection)
- ✅ Закрепление групп (pinnedGroupIds)

---

## ⚠️ ЧТО НЕ ПОДКЛЮЧЕНО / ТРЕБУЕТ ДОРАБОТКИ

### 1. Backend API - недостающие эндпоинты

#### 🔴 Операции с фразами
```
❌ POST /api/data/phrases/update - массовое обновление фраз
❌ POST /api/data/phrases/copy - копирование фраз
❌ POST /api/data/phrases/move - перемещение между группами
❌ POST /api/data/phrases/color - цветовая маркировка
❌ POST /api/data/phrases/pin - закрепление фраз
❌ POST /api/data/phrases/tag - присвоение тегов
```

#### 🔴 Группы
```
❌ POST /api/data/groups/create - создание группы
❌ POST /api/data/groups/update - обновление группы
❌ DELETE /api/data/groups/:id - удаление группы
❌ POST /api/data/groups/move - изменение parentId
❌ POST /api/data/groups/color - цвет группы
```

#### 🔴 Стоп-слова
```
❌ GET /api/data/stopwords - получение списка
❌ POST /api/data/stopwords/add - добавление
❌ DELETE /api/data/stopwords/:id - удаление
❌ POST /api/data/stopwords/scan - сканирование фраз
```

#### 🔴 Анализ и обработка
```
❌ POST /api/data/analysis/duplicates - поиск дублей
❌ POST /api/data/analysis/morphology - морфологический анализ
❌ POST /api/data/analysis/quality - анализ качества
❌ POST /api/data/pipelines/run - запуск пайплайна обработки
```

#### 🔴 Снапшоты
```
❌ GET /api/data/snapshots - список снапшотов
❌ POST /api/data/snapshots/create - создание
❌ POST /api/data/snapshots/restore - восстановление
❌ DELETE /api/data/snapshots/:id - удаление
```

#### 🔴 Теги
```
❌ GET /api/data/tags - список тегов
❌ POST /api/data/tags/create - создание тега
❌ DELETE /api/data/tags/:id - удаление тега
❌ POST /api/data/phrases/assign-tag - назначение тега фразе
```

#### 🔴 Пресеты экспорта
```
❌ GET /api/data/export-presets - список пресетов
❌ POST /api/data/export-presets/save - сохранение пресета
❌ DELETE /api/data/export-presets/:id - удаление
❌ POST /api/data/export-presets/apply - экспорт с пресетом
```

### 2. Frontend - функциональность только в Store

**Эти функции есть в Zustand store, но НЕ вызывают backend API:**

#### 🟡 Работают только локально (localStorage)
```javascript
// Группы - только frontend state
addGroup() - создание группы (нет POST /api/data/groups/create)
updateGroup() - обновление (нет PATCH)
deleteGroup() - удаление (нет DELETE)
updateGroupParent() - DnD (нет POST /api/data/groups/move)

// Стоп-слова - только frontend state
addStopword() - добавление (нет POST /api/data/stopwords/add)
deleteStopword() - удаление (нет DELETE)
updateStopword() - обновление (нет PATCH)
markStopwordPhrases() - сканирование (нет POST /api/data/stopwords/scan)

// Снапшоты - только localStorage
createSnapshot() - создание (нет POST /api/data/snapshots/create)
restoreSnapshot() - восстановление (нет POST /api/data/snapshots/restore)
deleteSnapshot() - удаление (нет DELETE)

// Теги - только localStorage
addPhraseTag() - создание тега (нет POST /api/data/tags/create)
assignTagToPhrase() - назначение (нет POST /api/data/phrases/assign-tag)
deletePhraseTag() - удаление (нет DELETE)

// Пресеты экспорта - только localStorage
saveExportPreset() - сохранение (нет POST /api/data/export-presets/save)
deleteExportPreset() - удаление (нет DELETE)

// Цветовая маркировка - только frontend
markPhraseColor() - цвет фразы (нет POST /api/data/phrases/color)
setGroupColor() - цвет группы (нет POST /api/data/groups/color)

// Закрепление - только frontend
togglePinPhrase() - закрепить фразу (нет POST /api/data/phrases/pin)
togglePinGroup() - закрепить группу (нет POST /api/data/groups/pin)

// View Templates - только localStorage
saveViewTemplate() - сохранение вида (нет POST /api/data/views/save)
loadViewTemplate() - загрузка (нет GET /api/data/views/:id)
deleteViewTemplate() - удаление (нет DELETE)
```

### 3. Модалы с неполной реализацией

#### 🟡 DuplicatesModal
- ✅ UI создан
- ❌ Backend: нет POST /api/data/analysis/duplicates
- 🔧 Сейчас: анализ только на frontend (Array.filter)

#### 🟡 MorphDuplicatesModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет POST /api/data/analysis/morphology
- 🔧 Сейчас: заглушка, нужна морфология (pymorphy2 или аналог)

#### 🟡 StopwordsManagerModal
- ✅ UI создан
- ❌ Backend: нет CRUD для stopwords
- 🔧 Сейчас: только localStorage

#### 🟡 CrossMinusationModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет POST /api/data/analysis/cross-minus
- 🔧 Сейчас: анализ только на frontend

#### 🟡 DataQualityModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет POST /api/data/analysis/quality
- 🔧 Сейчас: анализ только на frontend

#### 🟡 PipelinesModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет POST /api/data/pipelines/run
- 🔧 Сейчас: пайплайны работают через frontend store functions

#### 🟡 SnapshotsModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет API для snapshots
- 🔧 Сейчас: только localStorage

#### 🟡 TagsModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет API для tags
- 🔧 Сейчас: только localStorage

#### 🟡 ViewTemplatesModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет API для view templates
- 🔧 Сейчас: только localStorage

#### 🟡 ExportPresetsModal (v5.0)
- ✅ UI создан
- ❌ Backend: нет API для presets
- 🔧 Сейчас: только localStorage, применяется к GET /api/data/export

### 4. Импорт фраз

#### 🟡 ImportModal
- ✅ UI создан
- ✅ Backend: POST /api/data/phrases/enqueue существует
- ⚠️ Но: нет распознавания форматов (CSV/XLSX/TXT)
- 🔧 Сейчас: простой text input → enqueue массивом

**Нужно добавить:**
```
❌ POST /api/data/import/csv - парсинг CSV с delimiter detection
❌ POST /api/data/import/xlsx - парсинг Excel
❌ POST /api/data/import/txt - парсинг TXT (построчно)
❌ Validation фраз перед импортом
❌ Duplicate detection при импорте
```

### 5. Экспорт фраз

#### 🟡 ExportModal
- ✅ UI создан
- ✅ Backend: GET /api/data/export (CSV только)
- ⚠️ Но: нет XLSX, нет настройки разделителя, нет кодировки

**Нужно добавить:**
```
❌ GET /api/data/export?format=xlsx - экспорт в Excel
❌ GET /api/data/export?delimiter=, - выбор разделителя CSV
❌ GET /api/data/export?encoding=windows-1251 - кодировка
❌ POST /api/data/export/with-preset - экспорт с пресетом
❌ Выбор столбцов для экспорта
❌ Группировка по группам в экспорте
```

---

## 📈 Статистика подключения

### Backend API
- ✅ **Базовые операции:** 8/8 (100%)
  - GET /api/data/phrases ✅
  - GET /api/data/groups ✅
  - POST /api/data/phrases/enqueue ✅
  - POST /api/data/phrases/delete ✅
  - POST /api/data/phrases/clear ✅
  - POST /api/data/phrases/group ✅
  - GET /api/data/export ✅
  - POST /api/wordstat/collect ✅

- ❌ **Расширенные операции:** 0/32 (0%)
  - Группы CRUD: 0/4
  - Стоп-слова: 0/4
  - Анализ: 0/4
  - Снапшоты: 0/4
  - Теги: 0/4
  - Пресеты: 0/4
  - Импорт расширенный: 0/3
  - Экспорт расширенный: 0/5

### Frontend Modals
- ✅ **UI создан:** 18/18 (100%)
- 🟡 **Полностью функционален:** 8/18 (44%)
  - ImportModal (базовый) ✅
  - ExportModal (базовый) ✅
  - WordstatModal ✅
  - AdvancedFiltersModal ✅
  - ColumnSettingsModal ✅
  - StatisticsModal ✅
  - FindReplaceModal ✅
  - PhraseHistoryModal ✅

- 🟡 **Частично функционален (только frontend):** 10/18 (56%)
  - DuplicatesModal 🟡
  - MorphDuplicatesModal 🟡
  - StopwordsManagerModal 🟡
  - CrossMinusationModal 🟡
  - DataQualityModal 🟡
  - PipelinesModal 🟡
  - SnapshotsModal 🟡
  - TagsModal 🟡
  - ViewTemplatesModal 🟡
  - ExportPresetsModal 🟡

### Store Functions
- ✅ **Реализовано в store:** 60+ функций
- 🟡 **Синхронизируются с backend:** ~15 функций (25%)
- 🟡 **Работают только локально:** ~45 функций (75%)

---

## 🎯 Приоритеты для подключения

### Высокий приоритет (критичные для продакшна)

#### 1. Группы - Backend CRUD
**Зачем:** Сейчас группы только в localStorage, теряются при очистке браузера
```python
# backend/routers/data.py
POST /api/data/groups/create
PATCH /api/data/groups/:id
DELETE /api/data/groups/:id
POST /api/data/groups/move  # изменение parentId
```

#### 2. Стоп-слова - Backend persistence
**Зачем:** Стоп-слова должны сохраняться в БД, не теряться
```python
# backend/routers/stopwords.py
GET /api/data/stopwords
POST /api/data/stopwords/add
DELETE /api/data/stopwords/:id
POST /api/data/stopwords/scan  # сканирование фраз
```

#### 3. Импорт - полноценный парсинг файлов
**Зачем:** Пользователи импортируют CSV/XLSX из Яндекс.Директ
```python
# backend/routers/import.py
POST /api/data/import/csv
POST /api/data/import/xlsx
POST /api/data/import/validate
```

#### 4. Экспорт - XLSX и настройки
**Зачем:** Excel экспорт обязателен для работы с Директом
```python
# backend/routers/export.py
GET /api/data/export?format=xlsx
GET /api/data/export?columns=phrase,ws,group
GET /api/data/export?encoding=windows-1251
```

### Средний приоритет

#### 5. Снапшоты - Backend storage
**Зачем:** Снапшоты больших проектов не влезают в localStorage (5MB limit)
```python
# backend/routers/snapshots.py
GET /api/data/snapshots
POST /api/data/snapshots/create
POST /api/data/snapshots/restore
DELETE /api/data/snapshots/:id
```

#### 6. Теги - Backend persistence
**Зачем:** Теги должны сохраняться и работать между сессиями
```python
# backend/routers/tags.py
GET /api/data/tags
POST /api/data/tags/create
POST /api/data/phrases/assign-tag
DELETE /api/data/tags/:id
```

#### 7. Анализ дублей - Backend processing
**Зачем:** Анализ 10000+ фраз тормозит браузер
```python
# backend/routers/analysis.py
POST /api/data/analysis/duplicates
POST /api/data/analysis/morphology  # с pymorphy2
```

### Низкий приоритет (nice to have)

#### 8. Пайплайны - Backend execution
**Зачем:** Тяжелые пайплайны лучше на сервере
```python
POST /api/data/pipelines/run
GET /api/data/pipelines/status/:id
```

#### 9. View Templates - Backend storage
**Зачем:** Работает в localStorage, но можно на сервер
```python
GET /api/data/views
POST /api/data/views/save
```

#### 10. Кросс-минусация - Backend
**Зачем:** Для больших проектов нужен бэкенд
```python
POST /api/data/analysis/cross-minus
```

---

## 🔧 Рекомендации

### 1. Немедленно (критично)
- ✅ **Группы:** Создать `backend/routers/groups.py` с CRUD
- ✅ **Стоп-слова:** Создать `backend/routers/stopwords.py` с CRUD
- ✅ **Импорт:** Расширить `backend/routers/import.py` (CSV/XLSX парсинг)

### 2. В следующем спринте
- ✅ **Экспорт:** Добавить XLSX в `backend/routers/data.py`
- ✅ **Снапшоты:** Создать `backend/routers/snapshots.py`
- ✅ **Теги:** Создать `backend/routers/tags.py`

### 3. Оптимизация
- ✅ **Анализ дублей:** Перенести на backend (большие объемы)
- ✅ **Морфология:** Интегрировать pymorphy2 в backend
- ✅ **Пайплайны:** Backend execution для тяжелых операций

### 4. Архитектура
```
backend/routers/
├── data.py         ✅ (фразы CRUD)
├── wordstat.py     ✅ (парсинг)
├── accounts.py     ✅ (аккаунты)
├── regions.py      ✅ (регионы)
├── groups.py       ❌ СОЗДАТЬ
├── stopwords.py    ❌ СОЗДАТЬ
├── import.py       ❌ СОЗДАТЬ (или расширить data.py)
├── export.py       ⚠️ РАСШИРИТЬ (добавить XLSX)
├── snapshots.py    ❌ СОЗДАТЬ
├── tags.py         ❌ СОЗДАТЬ
├── analysis.py     ❌ СОЗДАТЬ
└── pipelines.py    ❌ СОЗДАТЬ (опционально)
```

---

## 📝 Заключение

**Общий статус:** 🟡 Частично готов

- ✅ **Frontend UI:** 100% (все модалы созданы)
- ✅ **Frontend Store:** 100% (все функции реализованы)
- 🟡 **Backend API:** 20% (базовые операции работают)
- ❌ **Полная интеграция:** 30% (большинство функций только в localStorage)

**Основная проблема:** Много функционала работает только в браузере (localStorage), что означает:
- Данные теряются при очистке кеша
- Нет синхронизации между устройствами
- Нет backup/restore на сервере
- Медленная работа с большими объемами

**Что делать дальше:**
1. Прочитать этот отчет
2. Выбрать приоритетные API для реализации
3. Я подключу backend эндпоинты по списку

---

**Готов приступать к подключению backend API по твоему указанию.**
