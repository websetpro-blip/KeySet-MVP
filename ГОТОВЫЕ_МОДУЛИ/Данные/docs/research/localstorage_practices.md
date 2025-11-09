# Best Practices работы с localStorage для React SPA (2025)

## Executive Summary

Данное исследование предоставляет комплексный анализ современных практик работы с localStorage в React Single Page Applications, актуальный на октябрь 2025 года. Основные выводы включают использование Zustand persist middleware для централизованного управления персистентным состоянием, реализацию версионирования данных для безболезненных обновлений схемы, применение debouncing для оптимизации производительности при частых обновлениях, а также robustную обработку ошибок, включая QuotaExceededError. Для проекта KeySet (веб-версия парсера фраз) рекомендуется архитектура на базе Zustand с автосохранением данных (phrases, groups, stopwords), версионированием схемы и встроенной обработкой edge cases. При объеме данных менее 5MB localStorage остается оптимальным выбором, превосходя IndexedDB по простоте и производительности для key-value операций.

## 1. Введение

В современной веб-разработке персистентность клиентских данных является критически важным аспектом пользовательского опыта. localStorage API предоставляет простой синхронный интерфейс для хранения данных между сессиями, что делает его привлекательным выбором для Single Page Applications. Однако неправильное использование localStorage может привести к проблемам с производительностью, потере данных и уязвимостям безопасности. Это исследование фокусируется на best practices работы с localStorage в контексте React приложений 2025 года, с особым акцентом на практическую реализацию для проекта KeySet — веб-версии инструмента парсинга ключевых фраз.

### Контекст проекта KeySet

KeySet представляет собой веб-приложение на React + TypeScript + Zustand, предназначенное для анализа и управления ключевыми фразами. Приложение требует сохранения трех основных типов данных: коллекции фраз с метаданными (частота, источник, стоимость клика), иерархической структуры групп для организации фраз, а также списка стоп-слов для фильтрации результатов. Критические требования включают автосохранение при каждом изменении данных пользователем, поддержку версионирования для безболезненных обновлений структуры данных в будущих релизах, а также надежную обработку ошибок при переполнении квоты или корруптированных данных.

## 2. Технические характеристики localStorage (2025)

### 2.1. Лимиты хранилища

Согласно актуальной спецификации Storage API, localStorage имеет следующие ограничения по браузерам. В Chrome и Edge (Chromium-based) квота составляет **5 МБ на origin** (схема + хост + порт), с максимальным суммарным лимитом localStorage + sessionStorage в **10 МБ**. Firefox предоставляет аналогичные 5 МБ на origin для localStorage в best-effort режиме, с общим групповым лимитом до 10% от размера диска или 10 ГБ (меньшее значение) для всех данных домена eTLD+1. Safari на macOS и iOS 17+ выделяет примерно 60% от общего размера диска на каждый origin для WebKit-приложений браузера.

При превышении квоты браузеры выбрасывают исключение **DOMException** с именем **QuotaExceededError** (код 22 в большинстве браузеров, код 1014 в Firefox и имя NS_ERROR_DOM_QUOTA_REACHED). Важно отметить, что localStorage работает синхронно, что может блокировать главный поток при операциях с большими объемами данных.

### 2.2. Модель работы и ограничения

localStorage хранит данные в формате key-value пар, где и ключи, и значения должны быть строками. Данные сериализуются через `JSON.stringify()` при записи и десериализуются через `JSON.parse()` при чтении. Хранилище разделено по origin (протокол + домен + порт), что обеспечивает изоляцию данных между различными сайтами согласно политике same-origin. В отличие от cookies, данные localStorage никогда не отправляются на сервер автоматически и не имеют встроенного механизма expiration — данные персистентны до явного удаления.

Критические ограничения включают:
- Синхронную природу API (блокирует UI при частых операциях)
- Отсутствие поддержки транзакций или атомарных операций
- Уязвимость к XSS-атакам (полный доступ JavaScript-кода)
- Отсутствие индексации и оптимизации для запросов


## 3. Best Practices для React приложений (2025)

### 3.1. Использование state management с persist middleware

В 2025 году рекомендуемый подход для работы с localStorage в React заключается в использовании state management библиотеки с встроенной поддержкой персистентности, а не прямых вызовов localStorage API в компонентах. **Zustand с persist middleware** предоставляет элегантное решение, абстрагирующее сложность синхронизации состояния и хранилища. Middleware автоматически сериализует и десериализует состояние, поддерживает частичную персистентность через опцию `partialize`, версионирование с функцией `migrate`, а также обработку Server-Side Rendering через `skipHydration`.

**Базовая настройка Zustand store:**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Phrase {
  id: string;
  text: string;
  frequency: number;
  source: string;
  groupId: string | null;
}

interface AppState {
  phrases: Phrase[];
  groups: Group[];
  stopwords: string[];
}

interface AppActions {
  addPhrase: (phrase: Phrase) => void;
  updatePhrase: (id: string, updates: Partial<Phrase>) => void;
  deletePhrase: (id: string) => void;
}

export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // Initial state
      phrases: [],
      groups: [],
      stopwords: [],
      
      // Actions
      addPhrase: (phrase) => set((state) => ({ 
        phrases: [...state.phrases, phrase] 
      })),
      updatePhrase: (id, updates) => set((state) => ({
        phrases: state.phrases.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePhrase: (id) => set((state) => ({
        phrases: state.phrases.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'keyset-store', // уникальный ключ в localStorage
      version: 1, // текущая версия схемы
    }
  )
);
```

### 3.2. Структура ключей для KeySet проекта

Для проекта KeySet рекомендуется использовать префиксированную схему именования ключей, обеспечивающую уникальность и понятную организацию данных в localStorage:

**Рекомендуемая структура в localStorage:**

```json
{
  "keyset-store": {
    "state": {
      "metadata": {
        "version": 1,
        "lastUpdated": "2025-10-31T06:13:17Z",
        "installId": "uuid-v4-here"
      },
      "phrases": [
        {
          "id": "phrase-001",
          "text": "react best practices",
          "frequency": 1200,
          "source": "yandex-wordstat",
          "cpc": 45.50,
          "groupId": "group-001"
        }
      ],
      "groups": [
        {
          "id": "group-001",
          "name": "React разработка",
          "parentId": null,
          "children": ["group-002"]
        }
      ],
      "stopwords": {
        "words": ["бесплатно", "скачать", "free"],
        "caseSensitive": false
      }
    },
    "version": 1
  }
}
```

Такая структура обеспечивает:
- Атомарность обновлений всего состояния
- Упрощенное версионирование через единый ключ
- Метаданные для отладки и синхронизации

### 3.3. Partialize: частичная персистентность

В реальных приложениях не все состояние требует сохранения в localStorage. Zustand persist middleware предоставляет опцию `partialize` для выборочного сохранения частей состояния. Для KeySet проекта имеет смысл **не сохранять** UI-специфичное состояние:

```typescript
export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // ... state и actions ...
      
      // UI-специфичное состояние (НЕ сохраняется)
      selectedPhraseIds: [],
      searchQuery: '',
      isLoading: false,
    }),
    {
      name: 'keyset-store',
      version: 1,
      
      // Сохраняем только критичные данные
      partialize: (state) => ({
        phrases: state.phrases,
        groups: state.groups,
        stopwords: state.stopwords,
        userPreferences: state.userPreferences,
        // selectedPhraseIds, searchQuery, isLoading НЕ включены
      }),
    }
  )
);
```

**Преимущества partialize:**
- Уменьшение размера данных в localStorage
- Чистое состояние при перезагрузке (без остаточных UI-данных)
- Улучшенная производительность записи


## 4. Обработка ошибок

### 4.1. QuotaExceededError

Надежная обработка переполнения квоты является критически важным аспектом работы с localStorage. Браузеры выбрасывают **QuotaExceededError** при попытке сохранить данные, превышающие доступную квоту. Однако реализация этой ошибки варьируется между браузерами.

**Кроссбраузерная функция определения QuotaExceededError:**

```typescript
/**
 * Определяет, является ли ошибка QuotaExceededError
 * Работает во всех браузерах (Chrome, Firefox, Safari, Edge)
 */
function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (
      // Chrome, Safari, Edge
      err.code === 22 ||
      // Firefox
      err.code === 1014 ||
      // Проверка по имени (fallback)
      err.name === "QuotaExceededError" ||
      // Firefox альтернативное имя
      err.name === "NS_ERROR_DOM_QUOTA_REACHED"
    )
  );
}
```

**Применение в обработке сохранения:**

```typescript
interface AppActions {
  // ... другие actions ...
  
  handleSaveError: (error: unknown) => void;
}

export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // ... state ...
      
      handleSaveError: (error) => {
        if (isQuotaExceededError(error)) {
          console.error('localStorage переполнен! Текущие данные:', get());
          
          // Стратегии восстановления:
          // 1. Очистка старых данных
          // 2. Уведомление пользователя
          // 3. Предложение экспорта в файл
          
          // Пример: уведомление пользователя
          alert(
            'Хранилище браузера переполнено!\n' +
            'Рекомендуется экспортировать данные или удалить старые фразы.'
          );
        } else {
          console.error('Неизвестная ошибка сохранения:', error);
        }
      },
    }),
    {
      name: 'keyset-store',
      version: 1,
      
      // Обработчик ошибок регидратации
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Ошибка загрузки состояния из localStorage:', error);
          if (isQuotaExceededError(error)) {
            // Специальная обработка QuotaExceededError при загрузке
          }
        }
      },
    }
  )
);
```

### 4.2. Проверка поддержки localStorage

Не все окружения поддерживают localStorage. SSR-приложения (Next.js, Remix) не имеют доступа к `window` на сервере, приватный режим Safari блокирует запись в localStorage, а некоторые корпоративные политики полностью отключают localStorage.

**Robustная функция проверки поддержки:**

```typescript
function isStorageSupported(storageType: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
  try {
    // Проверка наличия window и storage
    if (typeof window === 'undefined' || !window[storageType]) {
      return false;
    }
    
    const storage = window[storageType];
    const testKey = '__storage_test__';
    
    // Попытка записи и чтения
    storage.setItem(testKey, 'test');
    const retrieved = storage.getItem(testKey);
    storage.removeItem(testKey);
    
    return retrieved === 'test';
  } catch (err) {
    // Обработка QuotaExceededError, если storage уже заполнено
    const isValidQuotaError = isQuotaExceededError(err) && (window[storageType]?.length ?? 0) > 0;
    return isValidQuotaError;
  }
}
```

**Использование в приложении:**

```typescript
// В App.tsx или main.tsx
function App() {
  const [storageAvailable, setStorageAvailable] = useState(true);
  
  useEffect(() => {
    if (!isStorageSupported('localStorage')) {
      setStorageAvailable(false);
      console.warn('localStorage недоступен. Данные будут храниться в памяти.');
    }
  }, []);
  
  if (!storageAvailable) {
    return (
      <div className="alert alert-warning">
        localStorage недоступен в вашем браузере.
        Данные не будут сохраняться между сессиями.
      </div>
    );
  }
  
  return <MainApp />;
}
```

### 4.3. Обработка корруптированных данных

localStorage может содержать корруптированные данные из-за незавершенной записи при сбое браузера, ручного редактирования пользователем через DevTools, или багов в предыдущих версиях приложения.

**Безопасная функция загрузки состояния:**

```typescript
interface StoredState {
  version: number;
  phrases: Phrase[];
  groups: Group[];
  // ... другие поля ...
}

function loadState(key: string): StoredState | null {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      return null;
    }
    
    // Парсинг JSON
    const parsed = JSON.parse(item);
    
    // Валидация структуры
    if (!parsed.state || typeof parsed.version !== 'number') {
      throw new Error('Невалидная структура данных');
    }
    
    // Проверка критических полей
    const state = parsed.state;
    if (!Array.isArray(state.phrases) || !Array.isArray(state.groups)) {
      throw new Error('Отсутствуют обязательные поля');
    }
    
    return state;
  } catch (error) {
    console.error('Ошибка загрузки состояния:', error);
    
    // Очистка корруптированных данных
    try {
      window.localStorage.removeItem(key);
    } catch (cleanupError) {
      console.error('Не удалось очистить корруптированные данные:', cleanupError);
    }
    
    return null;
  }
}
```

**Интеграция с Zustand:**

```typescript
export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // ... state и actions ...
    }),
    {
      name: 'keyset-store',
      version: 1,
      
      // Кастомная merge функция для обработки некорректных данных
      merge: (persistedState, currentState) => {
        try {
          // Попытка глубокого слияния с валидацией
          return {
            ...currentState,
            ...persistedState,
            // Гарантируем наличие массивов
            phrases: Array.isArray(persistedState.phrases) ? persistedState.phrases : currentState.phrases,
            groups: Array.isArray(persistedState.groups) ? persistedState.groups : currentState.groups,
          };
        } catch (error) {
          console.error('Ошибка merge состояния:', error);
          return currentState; // Возвращаем дефолтное состояние
        }
      },
    }
  )
);
```


## 5. Versioning и миграция данных

### 5.1. Стратегия версионирования

Структура данных приложения неизбежно эволюционирует со временем — добавляются новые поля, изменяются форматы, удаляются устаревшие свойства. Без механизма версионирования пользователи, обновляющие приложение с существующими данными в localStorage, столкнутся с ошибками из-за несоответствия схемы.

**Рекомендуемая стратегия:**
- Добавить поле `version` в корень сохраняемого состояния начиная с версии 1
- Инкрементировать `version` при каждом breaking change в структуре данных
- Определить объект `migrations` с функциями миграции для каждого перехода между версиями

**Zustand поддерживает версионирование нативно:**

```typescript
export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // ... state и actions ...
    }),
    {
      name: 'keyset-store',
      version: 2, // текущая версия схемы
      
      migrate: (persistedState: any, version: number) => {
        console.log(`Миграция с версии ${version} на ${2}`);
        
        // Обработка миграций последовательно
        if (version === 0) {
          // Миграция v0 -> v1
          persistedState = migrateV0ToV1(persistedState);
        }
        
        if (version <= 1) {
          // Миграция v1 -> v2
          persistedState = migrateV1ToV2(persistedState);
        }
        
        return persistedState;
      },
    }
  )
);
```

### 5.2. Пример миграции для KeySet

**Сценарий эволюции схемы:**
- **Версия 0 (начальная)**: фразы хранились с полями `id`, `text`, `frequency`
- **Версия 1**: добавлены поля `groupId` (ссылка на группу) и `metadata` (объект для расширяемых данных)
- **Версия 2**: поле `frequency` переименовано в `freq` для краткости, добавлено поле `cpc` (стоимость клика)

**Реализация миграций:**

```typescript
// Миграция v0 -> v1: добавление groupId и metadata
function migrateV0ToV1(state: any) {
  return {
    ...state,
    phrases: state.phrases.map((phrase: any) => ({
      ...phrase,
      groupId: null, // дефолтное значение
      metadata: {}, // пустой объект для будущих данных
    })),
    // Добавление структуры групп
    groups: state.groups || [],
  };
}

// Миграция v1 -> v2: переименование frequency -> freq, добавление cpc
function migrateV1ToV2(state: any) {
  return {
    ...state,
    phrases: state.phrases.map((phrase: any) => {
      const { frequency, ...rest } = phrase;
      return {
        ...rest,
        freq: frequency, // переименование
        cpc: 0, // дефолтное значение для новой метрики
      };
    }),
    // Добавление секции stopwords
    stopwords: state.stopwords || {
      words: [],
      caseSensitive: false,
    },
  };
}

// Главная функция миграции с рекурсивным подходом
function migrate(persistedState: any, version: number): AppState {
  let state = { ...persistedState };
  
  // Рекурсивная миграция через все версии
  if (version < 1) {
    state = migrateV0ToV1(state);
    version = 1;
  }
  
  if (version < 2) {
    state = migrateV1ToV2(state);
    version = 2;
  }
  
  // Можно добавлять новые миграции здесь
  // if (version < 3) { ... }
  
  return state;
}
```

**Полная интеграция с Zustand:**

```typescript
const CURRENT_VERSION = 2;

export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // State
      phrases: [],
      groups: [],
      stopwords: { words: [], caseSensitive: false },
      
      // Actions
      addPhrase: (phrase) => set((state) => ({ 
        phrases: [...state.phrases, phrase] 
      })),
      // ... другие actions ...
    }),
    {
      name: 'keyset-store',
      version: CURRENT_VERSION,
      
      migrate: (persistedState: any, version: number) => {
        console.log(`[Migration] Обнаружена версия ${version}, миграция до ${CURRENT_VERSION}`);
        
        try {
          const migrated = migrate(persistedState, version);
          console.log('[Migration] Успешно мигрировано:', migrated);
          return migrated;
        } catch (error) {
          console.error('[Migration] Ошибка миграции:', error);
          // Возвращаем дефолтное состояние при ошибке
          return {
            phrases: [],
            groups: [],
            stopwords: { words: [], caseSensitive: false },
          };
        }
      },
    }
  )
);
```

### 5.3. Best practices версионирования

При проектировании системы миграции следует придерживаться следующих принципов:

**1. Идемпотентность миграций**
Каждая функция миграции должна быть безопасной для повторного вызова:

```typescript
// ❌ ПЛОХО: не идемпотентная миграция
function badMigration(state: any) {
  state.newField = (state.newField || 0) + 1; // будет инкрементироваться при повторных вызовах
  return state;
}

// ✅ ХОРОШО: идемпотентная миграция
function goodMigration(state: any) {
  return {
    ...state,
    newField: state.newField ?? 0, // устанавливается только если отсутствует
  };
}
```

**2. Никогда не удаляйте старые миграции**
Пользователи могут возвращаться после длительного перерыва:

```typescript
// Сохраняйте все исторические миграции
function migrate(state: any, version: number) {
  // v0 -> v1 (выпущена 01.2025)
  if (version < 1) { state = migrateV0ToV1(state); }
  
  // v1 -> v2 (выпущена 03.2025)
  if (version < 2) { state = migrateV1ToV2(state); }
  
  // v2 -> v3 (выпущена 06.2025)
  if (version < 3) { state = migrateV2ToV3(state); }
  
  // Не удаляйте старые миграции даже через год!
  return state;
}
```

**3. Всегда предоставляйте дефолтные значения**
Избегайте `undefined` для новых полей:

```typescript
function migrateWithDefaults(state: any) {
  return {
    ...state,
    phrases: state.phrases.map((p: any) => ({
      ...p,
      // Явные дефолты для новых полей
      groupId: p.groupId ?? null,
      cpc: p.cpc ?? 0,
      metadata: p.metadata ?? {},
      tags: p.tags ?? [],
    })),
  };
}
```

**4. Логирование миграций**
Мониторьте процент пользователей на старых версиях:

```typescript
migrate: (persistedState: any, version: number) => {
  // Отправка аналитики (опционально)
  analytics.track('storage_migration', {
    fromVersion: version,
    toVersion: CURRENT_VERSION,
    timestamp: new Date().toISOString(),
  });
  
  return migrate(persistedState, version);
}
```

**5. Тестирование всех путей миграции**
Создайте тесты для каждого возможного пути обновления:

```typescript
// tests/migrations.test.ts
describe('Storage Migrations', () => {
  it('should migrate from v0 to current', () => {
    const v0State = { phrases: [{ id: '1', text: 'test', frequency: 10 }] };
    const migrated = migrate(v0State, 0);
    
    expect(migrated.phrases[0]).toHaveProperty('groupId');
    expect(migrated.phrases[0]).toHaveProperty('freq'); // переименовано
    expect(migrated.phrases[0]).not.toHaveProperty('frequency'); // старое удалено
  });
  
  it('should be idempotent', () => {
    const state = { phrases: [] };
    const once = migrate(state, 0);
    const twice = migrate(once, CURRENT_VERSION);
    
    expect(once).toEqual(twice); // повторная миграция не меняет данные
  });
});
```


## 6. Оптимизация производительности

### 6.1. Проблема: синхронные операции

localStorage использует синхронный API, что означает блокировку главного потока JavaScript при выполнении операций чтения и записи. Для небольших объемов данных (несколько КБ) это незаметно, но при сохранении больших состояний (сотни КБ сериализованного JSON) или очень частых обновлениях (десятки раз в секунду) пользователи могут ощутить замедление интерфейса. В контексте KeySet проекта это особенно актуально при массовом редактировании фраз, когда пользователь быстро изменяет множество значений в таблице, или при drag-and-drop реорганизации групп.

**Симптомы проблемы:**
- Заметные задержки при быстром вводе текста
- "Зависание" UI при drag-and-drop операциях
- Пропуск кадров анимации (frame drops)

### 6.2. Решение: debouncing обновлений

Debouncing — это техника задержки выполнения функции до момента, когда прекратятся новые вызовы в течение определенного времени. В контексте localStorage это означает откладывание операции записи, пока пользователь не прекратит активные изменения данных.

**Подход 1: Custom debounced storage adapter**

```typescript
import { StateStorage } from 'zustand/middleware';

function createDebouncedStorage(delay: number = 1000): StateStorage {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingState: string | null = null;
  
  return {
    // Чтение всегда синхронное для корректной гидратации
    getItem: (name: string): string | null => {
      return window.localStorage.getItem(name);
    },
    
    // Запись дебаунсится
    setItem: (name: string, value: string): void => {
      pendingState = value;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (pendingState) {
          try {
            window.localStorage.setItem(name, pendingState);
            console.log(`[Storage] Сохранено ${(pendingState.length / 1024).toFixed(2)} KB`);
          } catch (error) {
            console.error('[Storage] Ошибка сохранения:', error);
          }
          pendingState = null;
        }
      }, delay);
    },
    
    removeItem: (name: string): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.localStorage.removeItem(name);
    },
  };
}

// Использование в Zustand
export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set) => ({ /* ... state и actions ... */ }),
    {
      name: 'keyset-store',
      version: 1,
      storage: createJSONStorage(() => createDebouncedStorage(1000)), // 1 секунда задержки
    }
  )
);
```

**Подход 2: useEffect с debounced значением**

```typescript
import { useState, useEffect } from 'react';

// Custom hook для debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Использование в компоненте
function PhraseEditor({ phrase }: { phrase: Phrase }) {
  const updatePhrase = useKeySetStore((state) => state.updatePhrase);
  const [localText, setLocalText] = useState(phrase.text);
  
  // Debounced версия текста
  const debouncedText = useDebounce(localText, 500);
  
  // Обновление store только после завершения ввода
  useEffect(() => {
    if (debouncedText !== phrase.text) {
      updatePhrase(phrase.id, { text: debouncedText });
    }
  }, [debouncedText, phrase.id, phrase.text, updatePhrase]);
  
  return (
    <input
      value={localText}
      onChange={(e) => setLocalText(e.target.value)}
      placeholder="Введите фразу..."
    />
  );
}
```

**Подход 3: Manual trigger для критичных операций**

Для операций, где пользователь явно инициирует сохранение (кнопка "Сохранить"):

```typescript
interface AppState {
  // ... другие поля ...
  hasUnsavedChanges: boolean;
}

interface AppActions {
  // ... другие actions ...
  markAsChanged: () => void;
  forceSave: () => Promise<void>;
}

export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      phrases: [],
      hasUnsavedChanges: false,
      
      updatePhrase: (id, updates) => {
        set((state) => ({
          phrases: state.phrases.map(p => p.id === id ? { ...p, ...updates } : p),
          hasUnsavedChanges: true, // маркируем как измененное
        }));
      },
      
      forceSave: async () => {
        const state = get();
        try {
          // Явное сохранение в localStorage
          const serialized = JSON.stringify({ state, version: 1 });
          window.localStorage.setItem('keyset-store', serialized);
          
          set({ hasUnsavedChanges: false });
          console.log('[Storage] Сохранено вручную');
        } catch (error) {
          console.error('[Storage] Ошибка ручного сохранения:', error);
          throw error;
        }
      },
    }),
    {
      name: 'keyset-store',
      version: 1,
      skipHydration: false,
    }
  )
);

// В компоненте
function SaveIndicator() {
  const hasUnsavedChanges = useKeySetStore((state) => state.hasUnsavedChanges);
  const forceSave = useKeySetStore((state) => state.forceSave);
  
  return (
    <div>
      {hasUnsavedChanges && (
        <button onClick={forceSave} className="btn btn-primary">
          Сохранить изменения
        </button>
      )}
      {!hasUnsavedChanges && <span>✓ Все сохранено</span>}
    </div>
  );
}
```

### 6.3. Рекомендации по выбору delay

Оптимальное время задержки debouncing зависит от контекста использования:

| Сценарий | Рекомендуемый delay | Обоснование |
|----------|---------------------|-------------|
| **Поисковые поля** | 300-500мс | Быстрый отклик после завершения ввода |
| **Form inputs** | 500-1000мс | Позволяет завершить редактирование поля |
| **Bulk operations** (массовое редактирование, drag-and-drop) | 1000-2000мс | Агрегирует множественные быстрые изменения |
| **Non-critical данные** (UI preferences, scroll position) | 3000-5000мс | Минимальная нагрузка на localStorage |
| **Critical данные** (документы, фразы) | 1000мс + auto-save on blur | Баланс между производительностью и надежностью |

**Adaptive debouncing** (продвинутый подход):

```typescript
function createAdaptiveDebouncedStorage() {
  let lastSaveSize = 0;
  
  return {
    getItem: (name: string) => window.localStorage.getItem(name),
    
    setItem: (name: string, value: string) => {
      // Адаптивная задержка на основе размера данных
      const sizeKB = value.length / 1024;
      let delay = 1000; // базовая задержка
      
      if (sizeKB > 500) {
        delay = 3000; // большие данные - большая задержка
      } else if (sizeKB < 50) {
        delay = 500; // маленькие данные - быстрее
      }
      
      // Логирование для мониторинга
      if (Math.abs(sizeKB - lastSaveSize) > 100) {
        console.log(`[Storage] Размер изменился: ${lastSaveSize.toFixed(2)} -> ${sizeKB.toFixed(2)} KB`);
      }
      lastSaveSize = sizeKB;
      
      // ... debounced запись с адаптивной задержкой ...
    },
    
    removeItem: (name: string) => window.localStorage.removeItem(name),
  };
}
```

### 6.4. Мониторинг размера данных

Для предотвращения переполнения квоты рекомендуется мониторить размер данных в localStorage:

```typescript
function getStorageSize(key: string): number {
  const item = window.localStorage.getItem(key);
  if (!item) return 0;
  
  // Размер в байтах (каждый символ = 2 байта в UTF-16)
  return item.length * 2;
}

function getStorageSizeFormatted(key: string): string {
  const bytes = getStorageSize(key);
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Компонент для отображения статистики
function StorageStats() {
  const [size, setSize] = useState('0 B');
  const [percentage, setPercentage] = useState(0);
  
  useEffect(() => {
    const updateStats = () => {
      const bytes = getStorageSize('keyset-store');
      setSize(getStorageSizeFormatted('keyset-store'));
      
      // 5 MB квота в большинстве браузеров
      const quotaMB = 5;
      const usedMB = bytes / (1024 * 1024);
      setPercentage((usedMB / quotaMB) * 100);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000); // обновление каждые 5 сек
    
    return () => clearInterval(interval);
  }, []);
  
  const isNearLimit = percentage > 80;
  
  return (
    <div className={`storage-stats ${isNearLimit ? 'warning' : ''}`}>
      <span>Использовано: {size} ({percentage.toFixed(1)}%)</span>
      {isNearLimit && (
        <span className="warning-text">
          ⚠ Приближение к лимиту! Рекомендуется экспортировать или очистить данные.
        </span>
      )}
    </div>
  );
}
```


## 7. Альтернативы localStorage

### 7.1. Когда localStorage достаточно

Для проекта KeySet с предполагаемым объемом данных до 1-2 МБ (тысячи фраз, сотни групп) localStorage является оптимальным выбором благодаря:
- Простому синхронному API
- Нулевой сложности настройки
- Универсальной поддержке всеми современными браузерами
- Отличной производительности для key-value операций

localStorage показывает лучшую производительность чем IndexedDB для простых операций чтения/записи из-за отсутствия overhead транзакций и асинхронной обработки.

### 7.2. IndexedDB: когда необходим переход

IndexedDB становится предпочтительным выбором в следующих сценариях:

**1. Размер данных превышает 5 МБ**
IndexedDB предоставляет минимум 50 МБ квоты с динамическим увеличением до сотен МБ или даже ГБ.

**2. Необходимость структурированных запросов**
IndexedDB поддерживает индексы, курсоры, диапазоны и сложные queries.

**3. Хранение бинарных данных**
IndexedDB нативно поддерживает Blob и ArrayBuffer.

**4. Необходимость транзакций**
IndexedDB предоставляет ACID-гарантии для консистентных многошаговых операций.

### 7.3. Библиотеки-обертки для IndexedDB

| Библиотека | Размер | Использование | Рекомендация |
|------------|--------|---------------|--------------|
| **localForage** | ~8KB | 176k проектов | Legacy проекты, поддержка старых браузеров |
| **idb-keyval** | <1KB | 34k проектов | Простое key-value хранилище |
| **idb** | ~3KB | 168k проектов | Полная мощь IndexedDB |

**LocalForage** - подходит для legacy проектов с автоматическим fallback на WebSQL или localStorage.

**IDB-keyval** - оптимален для простого key-value хранилища, идеален как drop-in замена localStorage при превышении квоты.

**IDB** - рекомендуется для проектов, требующих полной мощи IndexedDB с современным API на промисах.

## 8. Security Considerations

### 8.1. Что НЕ хранить в localStorage

В 2025 году сообщество разработчиков пришло к консенсусу о том, что определенные типы данных никогда не должны храниться в localStorage:

**❌ НИКОГДА не храните:**
- Authentication tokens (JWT, session tokens) → используйте HttpOnly cookies
- Sensitive user data (номера кредитных карт, паспортные данные)
- API keys и secrets → используйте backend proxy
- Personal Identifiable Information (PII) → минимизируйте на клиенте

### 8.2. Что безопасно хранить

**✅ БЕЗОПАСНО хранить:**
- User preferences (тема, язык, размер таблицы)
- Application state (UI состояние, фильтры)
- Draft content (несохраненные изменения в формах)
- Non-sensitive cached data (публичные справочники)

### 8.3. Защита от XSS

Меры снижения рисков:
- Применяйте Content Security Policy (CSP) headers
- Sanitize user input перед рендерингом
- Используйте современные React паттерны (JSX escaping)
- Регулярно обновляйте зависимости
- Проводите security audits


## 9. Практическая реализация для KeySet

### 9.1. Полный пример Zustand store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
interface Phrase {
  id: string;
  text: string;
  freq: number; // переименовано из frequency
  source: string;
  cpc: number;
  groupId: string | null;
  metadata: Record<string, any>;
}

interface Group {
  id: string;
  name: string;
  parentId: string | null;
  children: string[];
}

interface StopwordsConfig {
  words: string[];
  caseSensitive: boolean;
}

interface AppState {
  phrases: Phrase[];
  groups: Group[];
  stopwords: StopwordsConfig;
  userPreferences: {
    theme: 'light' | 'dark';
    language: 'ru' | 'en';
  };
}

interface AppActions {
  addPhrase: (phrase: Phrase) => void;
  updatePhrase: (id: string, updates: Partial<Phrase>) => void;
  deletePhrase: (id: string) => void;
  addGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  importState: (newState: Partial<AppState>) => void;
}

const CURRENT_VERSION = 2;

export const useKeySetStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Initial state
      phrases: [],
      groups: [],
      stopwords: { words: [], caseSensitive: false },
      userPreferences: { theme: 'light', language: 'ru' },
      
      // Actions
      addPhrase: (phrase) => set((state) => ({ 
        phrases: [...state.phrases, phrase] 
      })),
      
      updatePhrase: (id, updates) => set((state) => ({
        phrases: state.phrases.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      deletePhrase: (id) => set((state) => ({
        phrases: state.phrases.filter(p => p.id !== id)
      })),
      
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group]
      })),
      
      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id),
        phrases: state.phrases.map(p => 
          p.groupId === id ? { ...p, groupId: null } : p
        ),
      })),
      
      importState: (newState) => set((state) => ({
        ...state,
        ...newState,
      })),
    }),
    {
      name: 'keyset-store',
      version: CURRENT_VERSION,
      
      // Частичная персистентность
      partialize: (state) => ({
        phrases: state.phrases,
        groups: state.groups,
        stopwords: state.stopwords,
        userPreferences: state.userPreferences,
        // UI-состояние исключено
      }),
      
      // Миграции
      migrate: (persistedState: any, version: number) => {
        console.log(`[Migration] v${version} -> v${CURRENT_VERSION}`);
        
        let state = { ...persistedState };
        
        // v0 -> v1
        if (version < 1) {
          state.phrases = state.phrases.map((p: any) => ({
            ...p,
            groupId: p.groupId ?? null,
            metadata: p.metadata ?? {},
          }));
          state.groups = state.groups || [];
        }
        
        // v1 -> v2
        if (version < 2) {
          state.phrases = state.phrases.map((p: any) => {
            const { frequency, ...rest } = p;
            return {
              ...rest,
              freq: frequency ?? 0,
              cpc: p.cpc ?? 0,
            };
          });
          state.stopwords = state.stopwords || { words: [], caseSensitive: false };
        }
        
        return state;
      },
      
      // Обработка ошибок регидратации
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Storage] Ошибка загрузки:', error);
          if (isQuotaExceededError(error)) {
            alert('Хранилище переполнено! Экспортируйте данные.');
          }
        } else {
          console.log('[Storage] Успешно загружено из localStorage');
        }
      },
    }
  )
);

// Utility function
function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.code === 22 || err.code === 1014 ||
     err.name === "QuotaExceededError" ||
     err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
```

### 9.2. Интеграция в React компоненты

```typescript
// Компонент для отображения и редактирования фраз
function PhraseTable() {
  const phrases = useKeySetStore((state) => state.phrases);
  const updatePhrase = useKeySetStore((state) => state.updatePhrase);
  const deletePhrase = useKeySetStore((state) => state.deletePhrase);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Фраза</th>
          <th>Частота</th>
          <th>CPC</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {phrases.map((phrase) => (
          <tr key={phrase.id}>
            <td>{phrase.text}</td>
            <td>{phrase.freq}</td>
            <td>{phrase.cpc} ₽</td>
            <td>
              <button onClick={() => deletePhrase(phrase.id)}>
                Удалить
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 9.3. Export/Import функциональность

```typescript
// Export данных в JSON файл
function exportData() {
  const state = useKeySetStore.getState();
  
  const exportData = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      phrases: state.phrases,
      groups: state.groups,
      stopwords: state.stopwords,
    },
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `keyset-backup-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Import данных из JSON файла
function importData(file: File) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target?.result as string);
      
      // Валидация структуры
      if (!imported.data || !Array.isArray(imported.data.phrases)) {
        throw new Error('Невалидный формат файла');
      }
      
      // Миграция если нужно
      let data = imported.data;
      if (imported.version < CURRENT_VERSION) {
        data = migrateImportedData(data, imported.version);
      }
      
      // Импорт в store
      useKeySetStore.getState().importState(data);
      
      alert('Данные успешно импортированы!');
    } catch (error) {
      console.error('Ошибка импорта:', error);
      alert('Не удалось импортировать данные. Проверьте формат файла.');
    }
  };
  
  reader.readAsText(file);
}

// Компонент для UI
function ImportExportButtons() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="import-export">
      <button onClick={exportData}>
        📥 Экспорт данных
      </button>
      
      <button onClick={() => fileInputRef.current?.click()}>
        📤 Импорт данных
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importData(file);
        }}
      />
    </div>
  );
}
```


## 10. Заключение и рекомендации

### 10.1. Ключевые выводы

Для React SPA проектов в 2025 году localStorage остается надежным и эффективным решением для персистентности клиентских данных объемом до 5 МБ, что покрывает подавляющее большинство use cases, включая проект KeySet. Использование state management решений (Zustand, Redux Toolkit) с persist middleware значительно упрощает работу с localStorage, абстрагируя boilerplate код и предоставляя продвинутые возможности версионирования и миграции. Robustная обработка ошибок, включая QuotaExceededError и проверку поддержки API, является обязательной для production-ready приложений. Debouncing операций записи критичен для производительности при частых обновлениях состояния. Версионирование данных с первого релиза предотвращает проблемы при будущих изменениях схемы.

### 10.2. Чек-лист для KeySet проекта

**Обязательные шаги реализации:**

- [ ] Установить zustand и настроить store с persist middleware
- [ ] Определить типы для всех сущностей (Phrase, Group, StopWord)
- [ ] Реализовать partialize для исключения UI-состояния из сохранения
- [ ] Добавить version: 1 и заглушку функции migrate
- [ ] Интегрировать isStorageSupported проверку при инициализации
- [ ] Обернуть критические операции в try-catch с обработкой QuotaExceededError
- [ ] Внедрить debounced storage adapter или useEffect с debounce
- [ ] Разработать UI для export/import данных
- [ ] Добавить мониторинг размера данных с предупреждением при 80% квоты
- [ ] Написать unit тесты для функций миграции и обработки ошибок
- [ ] Документировать структуру данных и версионирование

### 10.3. Когда рассмотреть альтернативы

Переход с localStorage на IndexedDB следует рассматривать в следующих сценариях:

**Критерии для миграции на IndexedDB:**
- Размер данных стабильно превышает 3-4 МБ (80% квоты)
- Требования к complex queries или filtering с индексированием
- Необходимость хранения binary data (изображения, файлы)
- Планирование offline-first функциональности с синхронизацией
- Потребность в транзакционной модели для консистентности

**Рекомендуемые библиотеки при миграции:**
- **idb-keyval** - для минимального рефакторинга (drop-in замена localStorage)
- **idb** - для полного контроля над базой данных с современным Promise API

## 11. Источники

[1] [Storage quotas and eviction criteria - Web APIs](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - **High Reliability** - Официальная документация MDN о квотах и лимитах хранилищ с актуальными данными для всех браузеров 2025

[2] [Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - **High Reliability** - Подробное руководство Josh Comeau по созданию custom React hooks для localStorage с best practices

[3] [Handling localStorage errors (such as quota exceeded errors)](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/) - **High Reliability** - Технический анализ обработки ошибок localStorage с кроссбраузерными примерами кода

[4] [persist - Zustand Middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - **High Reliability** - Официальная документация Zustand persist middleware с TypeScript примерами

[5] [How to migrate Zustand local storage store to a new version](https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp) - **Medium Reliability** - Практическое руководство по версионированию и миграции данных в Zustand

[6] [Simple frontend data migration](https://janmonschke.com/simple-frontend-data-migration/) - **Medium Reliability** - Стратегии версионирования локальных данных с рекурсивным подходом к миграциям

[7] [Practical Patterns for React Custom Hooks](https://leapcell.io/blog/practical-patterns-for-react-custom-hooks) - **Medium Reliability** - Паттерны useDebounce и useLocalStorage с детальными примерами реализации

[8] [Master Browser Storage in 2025: The Ultimate Guide](https://medium.com/@osamajavaid/master-browser-storage-in-2025-the-ultimate-guide-for-front-end-developers-7b2735b4cc13) - **Medium Reliability** - Актуальное сравнение всех типов браузерных хранилищ с use cases и ограничениями

[9] [Say Goodbye To localStorage In 2025](https://javascript.plainenglish.io/say-goodbye-to-localstorage-in-2025-4c2ec4746e66) - **Medium Reliability** - Критический анализ уязвимостей localStorage и рекомендации по безопасности

[10] [Best library for IndexedDB: localForage, IDB-Keyval, or IDB](https://www.paultman.com/posts/best-library-for-indexeddb-localforage-idb-keyval-or-idb/) - **Medium Reliability** - Детальное сравнение библиотек-оберток IndexedDB с оценкой популярности и сценариев использования

---

**Дата исследования:** 31 октября 2025  
**Актуальность данных:** Октябрь 2025  
**Целевой проект:** KeySet - веб-версия парсера ключевых фраз  
**Технологический стек:** React + TypeScript + Zustand

