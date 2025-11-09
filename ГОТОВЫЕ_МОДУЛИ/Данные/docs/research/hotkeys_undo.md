# Исследование решений для горячих клавиш и Undo/Redo в React

> **Дата исследования**: 2025-10-31  
> **Проект**: KeySet - веб-версия парсера ключевых слов  
> **Цель**: Найти оптимальные решения для реализации горячих клавиш и функциональности Undo/Redo в React-приложении

---

## Краткое резюме

После детального исследования актуальных решений на 2025 год, рекомендуются следующие подходы:

**Для горячих клавиш**: `react-hotkeys-hook` (v5.2.1) — современная, активно поддерживаемая библиотека с минимальным размером (2.8 kB gzipped) и полной TypeScript поддержкой.

**Для Undo/Redo**: Command Pattern с использованием TypeScript — легковесное, масштабируемое решение, идеально подходящее для сложных операций (удаление фраз, создание/редактирование групп).

**Альтернатива для Undo/Redo**: Immer с patches для простых случаев с минимальной кастомной логикой.

---

## 1. Анализ решений для горячих клавиш

### 1.1. react-hotkeys-hook ⭐ РЕКОМЕНДУЕТСЯ

**Версия**: 5.2.1 (обновлено 17 дней назад от даты исследования)

#### Преимущества

Библиотека react-hotkeys-hook является лидером среди решений для горячих клавиш в React экосистеме. С более чем 1.5 миллионами еженедельных загрузок и активной поддержкой, она демонстрирует надежность и популярность в сообществе. Библиотека написана на TypeScript, что обеспечивает полную типизацию из коробки и улучшает опыт разработки. Размер bundle составляет всего 7.6 kB в минифицированном виде и 2.8 kB с gzip сжатием, что делает её одной из самых легковесных опций. Декларативный API на основе хуков идеально интегрируется с современным React. Библиотека поддерживает все необходимые модификаторы включая ctrl, cmd, alt, shift, а также специальные клавиши вроде F2 и Delete. Встроенная поддержка scopes позволяет группировать горячие клавиши и избегать конфликтов между разными частями приложения. Возможность включения горячих клавиш на элементах форм через опцию enableOnFormTags решает частую проблему блокировки хоткеев в input полях. Библиотека имеет нулевые зависимости, что минимизирует риски конфликтов и упрощает обслуживание.

#### Недостатки

Согласно исследованию 2025 года, все популярные JavaScript библиотеки для горячих клавиш имеют фундаментальные проблемы с обработкой клавиатурных событий. Библиотека react-hotkeys-hook использует как KeyboardEvent.code, так и KeyboardEvent.key, что приводит к избыточным срабатываниям хоткеев. Свойство code описывает физическое положение клавиши и не учитывает альтернативные раскладки клавиатуры типа DVORAK или международные раскладки. При использовании key возникают сложности с модификаторами Shift и Alt, которые изменяют символьное значение клавиши. На немецкой раскладке Shift+2 дает кавычку вместо @, а на macOS клавиша Option изменяет множество символов. Для полной кросс-браузерной и кросс-локальной совместимости требуется явное указание preventDefault для предотвращения стандартного поведения браузера.

#### Размер bundle

- **Minified**: 7.6 kB
- **Minified + Gzipped**: 2.8 kB
- **Зависимости**: 0
- **Время загрузки**: 55 ms (Slow 3G), 3 ms (Emerging 4G)

#### API и примеры использования

Основной хук useHotkeys принимает строку или массив комбинаций клавиш, функцию обратного вызова, объект опций и массив зависимостей для мемоизации. Для требуемых комбинаций в проекте KeySet можно реализовать следующие паттерны.

Для выделения всего контента с комбинацией Ctrl+A необходимо предотвращать стандартное поведение браузера, чтобы избежать выделения всего текста на странице. В обработчике вызывается event.preventDefault и реализуется кастомная логика выделения элементов таблицы.

```typescript
import { useHotkeys } from 'react-hotkeys-hook';

// Ctrl+A - Выделить все элементы
useHotkeys('ctrl+a', (event) => {
  event.preventDefault(); // Предотвращаем браузерное выделение
  handleSelectAll();
}, [handleSelectAll]);
```

Для удаления выделенных элементов клавишей Delete реализация проста, так как эта клавиша не имеет стандартного конфликтующего поведения в веб-приложениях.

```typescript
// Delete - Удалить выделенные
useHotkeys('delete', () => {
  handleDeleteSelected();
}, [handleDeleteSelected]);
```

Для отмены и повтора действий с Ctrl+Z и Ctrl+Y необходимо блокировать браузерную функциональность undo/redo, которая может конфликтовать с логикой приложения.

```typescript
// Ctrl+Z - Отмена
useHotkeys('ctrl+z', (event) => {
  event.preventDefault(); // Блокируем браузерный undo
  handleUndo();
}, [handleUndo]);

// Ctrl+Y - Повтор
useHotkeys('ctrl+y', (event) => {
  event.preventDefault(); // Блокируем браузерный redo
  handleRedo();
}, [handleRedo]);
```

Для фокусировки поля поиска с Ctrl+F требуется предотвратить открытие встроенного диалога поиска браузера и переключить фокус на элемент поиска приложения.

```typescript
// Ctrl+F - Фокус на поиск
useHotkeys('ctrl+f', (event) => {
  event.preventDefault(); // Блокируем встроенный поиск браузера
  searchInputRef.current?.focus();
}, []);
```

Для операций копирования и вставки с Ctrl+C и Ctrl+V браузерное поведение желательно сохранить для работы с текстом в полях ввода, но добавить дополнительную логику для работы с выделенными элементами таблицы.

```typescript
// Ctrl+C - Копировать выделенные
useHotkeys('ctrl+c', (event) => {
  // Проверяем, что фокус не на input/textarea
  if (!['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
    event.preventDefault();
    handleCopySelected();
  }
}, [handleCopySelected]);

// Ctrl+V - Вставить
useHotkeys('ctrl+v', (event) => {
  if (!['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
    event.preventDefault();
    handlePaste();
  }
}, [handlePaste]);
```

Для переименования группы клавишей F2 конфликтов с браузером нет, но рекомендуется добавить preventDefault для консистентности.

```typescript
// F2 - Переименовать выделенную группу
useHotkeys('f2', (event) => {
  event.preventDefault();
  handleRenameSelectedGroup();
}, [handleRenameSelectedGroup]);
```

Для глобального управления горячими клавишами в приложении можно использовать scopes для группировки и условного включения наборов хоткеев.

```typescript
// Компонент с множественными хоткеями
const KeysetHotkeys = () => {
  const { selectedRows } = useTableState();
  
  // Хоткеи активны только когда есть выделенные элементы
  useHotkeys('delete', handleDelete, {
    enabled: selectedRows.length > 0,
    scopes: 'table',
  });
  
  useHotkeys('ctrl+c', handleCopy, {
    enabled: selectedRows.length > 0,
    scopes: 'table',
    enableOnFormTags: false, // Отключаем на формах
  });
  
  // Глобальные хоткеи (всегда активны)
  useHotkeys('ctrl+f', handleSearch, {
    scopes: '*',
  });
  
  return null;
};
```

#### Управление конфликтами с браузерными хоткеями

Для надежной работы приложения критически важно правильно обрабатывать конфликты с встроенными комбинациями браузера. Комбинация Ctrl+A выделяет весь текст на странице во всех браузерах, Ctrl+F открывает диалог поиска, Ctrl+Z/Y выполняют undo/redo в полях ввода, а Ctrl+C/V управляют буфером обмена. Для всех этих комбинаций необходимо вызывать event.preventDefault только когда фокус не находится на элементах ввода текста. Клавиши Delete и F2 не имеют стандартного поведения в контексте веб-приложений, но preventDefault рекомендуется использовать для консистентности.

#### Рекомендации по безопасному использованию

Для максимальной кросс-браузерной и кросс-локальной совместимости следует придерживаться нескольких правил. Используйте только латинские буквы A-Z и цифры 0-9 в комбинациях клавиш. Избегайте использования Alt/Option в качестве модификатора, так как на разных раскладках эта клавиша изменяет символы непредсказуемо. Используйте Shift только с буквами, избегая его с цифрами и символами. Всегда явно вызывайте preventDefault для комбинаций, конфликтующих с браузером. Проверяйте target элемента события, чтобы не блокировать стандартное поведение в полях ввода. Используйте scopes для изоляции горячих клавиш разных частей приложения.

---

### 1.2. react-hotkeys (greena13) ⚠️ НЕ РЕКОМЕНДУЕТСЯ

**Версия**: 2.0.0 (последнее обновление 6 лет назад)

#### Оценка

Библиотека react-hotkeys от greena13 является устаревшим решением, которое не получает обновлений с 2019 года. Несмотря на всё ещё значительное количество еженедельных загрузок (502 тысячи), это объясняется наследственными проектами, а не активным использованием в новых разработках. Библиотека имеет 281 зависимость от неё в NPM экосистеме, но это в основном старые проекты. Размер пакета составляет 1.24 MB в распакованном виде, что значительно больше современных альтернатив. API основан на Higher-Order Components и JSX декларациях, что не соответствует современным паттернам разработки с хуками. Библиотека зависит от устаревшего пакета prop-types и использует устаревшие свойства KeyboardEvent. Отсутствие поддержки и обновлений создаёт риски безопасности и совместимости с новыми версиями React.

#### Причины отказа

Последний коммит был сделан более 6 лет назад, что делает библиотеку морально устаревшей. API не совместим с современными React Hooks паттернами и требует использования HoC или компонентов-обёрток. Размер bundle избыточен по сравнению с react-hotkeys-hook. Библиотека использует устаревшие методы обработки клавиатурных событий. Отсутствует поддержка TypeScript из коробки. Нет активного community и багфиксов. Документация не обновлялась и не отражает современные best practices.

---

### 1.3. Нативные обработчики (useEffect + addEventListener)

#### Оценка

Реализация горячих клавиш через нативные обработчики событий с использованием useEffect и addEventListener технически возможна, но требует значительно больше кода для достижения того же функционала. Разработчику необходимо вручную управлять подпиской и отписанием от событий, реализовывать логику комбинаций клавиш с модификаторами, обрабатывать edge cases с фокусом на элементах форм, управлять конфликтами между разными частями приложения и поддерживать кросс-браузерную совместимость. Код становится менее читаемым и сложнее в поддержке по сравнению с декларативным подходом библиотек.

#### Пример базовой реализации

```typescript
import { useEffect, useCallback } from 'react';

const useNativeHotkey = (
  key: string,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean },
  callback: () => void
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== key.toLowerCase()) return;
    
    if (modifiers.ctrl && !event.ctrlKey) return;
    if (modifiers.shift && !event.shiftKey) return;
    if (modifiers.alt && !event.altKey) return;
    
    event.preventDefault();
    callback();
  }, [key, modifiers, callback]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Использование
useNativeHotkey('a', { ctrl: true }, handleSelectAll);
```

#### Недостатки подхода

Необходимо писать существенно больше boilerplate кода для базового функционала. Обработка множественных комбинаций требует дублирования логики или создания сложных абстракций. Отсутствует встроенная поддержка scopes для изоляции конфликтующих хоткеев. Требуется ручная реализация проверок для элементов форм. Нет встроенной типизации и автокомплита для комбинаций клавиш. Сложнее тестировать из-за зависимости от DOM событий. Легко допустить ошибки в логике проверки модификаторов. Нет централизованного управления всеми горячими клавишами приложения.

#### Когда использовать

Этот подход может быть оправдан только в очень специфичных случаях: когда требуется всего 1-2 простые комбинации и нет смысла добавлять библиотеку; когда нужен абсолютный контроль над каждым аспектом обработки событий; когда критичен каждый килобайт bundle size и недопустимы внешние зависимости.

**Для проекта KeySet**: Не рекомендуется, так как требуется обработка множества комбинаций (8+), а react-hotkeys-hook добавляет всего 2.8 kB gzipped.

---

## 2. Анализ решений для Undo/Redo

### 2.1. Command Pattern ⭐ РЕКОМЕНДУЕТСЯ

#### Описание

Command Pattern является классическим решением из паттернов проектирования для реализации отменяемых операций. Этот подход инкапсулирует каждое действие как объект команды с методами execute, undo и redo. Паттерн обеспечивает чёткое разделение между объектом, инициирующим команду (Invoker), и объектом, её выполняющим (Receiver). Для React приложений паттерн легко адаптируется с использованием TypeScript для строгой типизации и хуков для интеграции с состоянием компонентов.

#### Преимущества

Command Pattern предоставляет ряд критических преимуществ для сложных приложений. Паттерн легковесен по памяти, так как хранит только команды и ссылки на объекты, а не полные снимки состояния. Это особенно важно для приложений с большими объемами данных и длинной историей изменений. Паттерн идеально подходит для сложных операций типа создание/удаление групп, перемещение фраз между группами или массовое редактирование. Каждый тип операции инкапсулирован в отдельном классе команды, что упрощает поддержку и тестирование. TypeScript обеспечивает строгую типизацию для всех команд и их параметров, предотвращая ошибки на этапе компиляции. Паттерн легко расширяется для добавления новых типов отменяемых операций без изменения существующего кода. Независимость от конкретных библиотек управления состоянием позволяет использовать паттерн с любым state management решением. История команд может логироваться для отладки и аналитики. Возможна реализация redo с бесконечным повтором для некоторых типов команд.

#### Недостатки

Основной недостаток Command Pattern заключается в необходимости большего количества кода по сравнению с готовыми библиотеками. Для каждого типа отменяемой операции требуется создать отдельный класс команды, что увеличивает базу кода. Требуется начальная инвестиция времени на проектирование архитектуры команд и фабрик. Для простых операций типа изменения одного значения паттерн может быть избыточным. Необходимо тщательно продумывать какие операции должны быть отменяемыми, чтобы не раздуть систему лишними командами.

#### Архитектура для проекта KeySet

Для приложения KeySet предлагается следующая архитектура команд, разделённая на несколько уровней.

Базовые интерфейсы определяют контракты для всех команд в системе:

```typescript
// types/commands.ts

export interface CommandResult {
  success: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface Command {
  execute(): CommandResult;
  undo(): CommandResult;
  redo(): CommandResult;
}
```

История команд управляет стеками отмены и повтора:

```typescript
// lib/UndoHistory.ts

export class UndoHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistorySize = 50; // Лимит для производительности
  
  push(command: Command): void {
    this.undoStack.push(command);
    this.redoStack = []; // Очищаем redo при новой команде
    
    // Ограничиваем размер истории
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }
  }
  
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  popUndo(): Command | undefined {
    const command = this.undoStack.pop();
    if (command) {
      this.redoStack.push(command);
    }
    return command;
  }
  
  popRedo(): Command | undefined {
    const command = this.redoStack.pop();
    if (command) {
      this.undoStack.push(command);
    }
    return command;
  }
  
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

Command Handler управляет выполнением команд и взаимодействием с историей:

```typescript
// lib/CommandHandler.ts

export interface CommandHandlerResult extends CommandResult {
  canUndo: boolean;
  canRedo: boolean;
}

export class CommandHandler {
  private history: UndoHistory;
  
  constructor() {
    this.history = new UndoHistory();
  }
  
  execute(command: Command): CommandHandlerResult {
    const result = command.execute();
    
    if (result.success && result.canUndo !== false) {
      this.history.push(command);
    }
    
    return {
      ...result,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
  }
  
  undo(): CommandHandlerResult {
    const command = this.history.popUndo();
    
    if (!command) {
      return {
        success: false,
        canUndo: false,
        canRedo: this.history.canRedo(),
      };
    }
    
    const result = command.undo();
    
    return {
      ...result,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
  }
  
  redo(): CommandHandlerResult {
    const command = this.history.popRedo();
    
    if (!command) {
      return {
        success: false,
        canUndo: this.history.canUndo(),
        canRedo: false,
      };
    }
    
    const result = command.redo();
    
    return {
      ...result,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    };
  }
  
  clear(): void {
    this.history.clear();
  }
}
```

Теперь реализуем конкретные команды для операций KeySet приложения.

Команда для удаления фраз из таблицы:

```typescript
// commands/DeletePhrasesCommand.ts

import { Command, CommandResult } from '@/types/commands';

export interface Phrase {
  id: string;
  text: string;
  groupId: string | null;
  // ... другие поля
}

export class DeletePhrasesCommand implements Command {
  private phrases: Phrase[];
  private deletedPhrases: Phrase[] = [];
  private phrasesStore: Phrase[]; // Ссылка на массив фраз в state
  
  constructor(phrasesToDelete: Phrase[], phrasesStore: Phrase[]) {
    this.phrases = phrasesToDelete;
    this.phrasesStore = phrasesStore;
  }
  
  execute(): CommandResult {
    this.deletedPhrases = [...this.phrases];
    
    // Удаляем фразы из store
    const idsToDelete = new Set(this.phrases.map(p => p.id));
    const newPhrases = this.phrasesStore.filter(p => !idsToDelete.has(p.id));
    
    this.phrasesStore.length = 0;
    this.phrasesStore.push(...newPhrases);
    
    return { success: true, canUndo: true };
  }
  
  undo(): CommandResult {
    // Восстанавливаем удалённые фразы
    this.phrasesStore.push(...this.deletedPhrases);
    
    return { success: true, canRedo: true };
  }
  
  redo(): CommandResult {
    return this.execute();
  }
}
```

Команда для создания новой группы:

```typescript
// commands/CreateGroupCommand.ts

import { Command, CommandResult } from '@/types/commands';

export interface Group {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export class CreateGroupCommand implements Command {
  private group: Group;
  private groupsStore: Group[];
  private wasCreated = false;
  
  constructor(groupData: Omit<Group, 'id' | 'createdAt'>, groupsStore: Group[]) {
    this.group = {
      ...groupData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.groupsStore = groupsStore;
  }
  
  execute(): CommandResult {
    if (!this.wasCreated) {
      this.groupsStore.push(this.group);
      this.wasCreated = true;
    }
    
    return { success: true, canUndo: true };
  }
  
  undo(): CommandResult {
    const index = this.groupsStore.findIndex(g => g.id === this.group.id);
    
    if (index !== -1) {
      this.groupsStore.splice(index, 1);
    }
    
    return { success: true, canRedo: true };
  }
  
  redo(): CommandResult {
    this.groupsStore.push(this.group);
    return { success: true, canUndo: true };
  }
}
```

Команда для переименования группы:

```typescript
// commands/RenameGroupCommand.ts

import { Command, CommandResult } from '@/types/commands';
import { Group } from './CreateGroupCommand';

export class RenameGroupCommand implements Command {
  private groupId: string;
  private oldName: string;
  private newName: string;
  private groupsStore: Group[];
  
  constructor(groupId: string, newName: string, groupsStore: Group[]) {
    this.groupId = groupId;
    this.newName = newName;
    this.groupsStore = groupsStore;
    
    const group = groupsStore.find(g => g.id === groupId);
    this.oldName = group?.name || '';
  }
  
  execute(): CommandResult {
    const group = this.groupsStore.find(g => g.id === this.groupId);
    
    if (!group) {
      return { success: false };
    }
    
    group.name = this.newName;
    return { success: true, canUndo: true };
  }
  
  undo(): CommandResult {
    const group = this.groupsStore.find(g => g.id === this.groupId);
    
    if (!group) {
      return { success: false };
    }
    
    group.name = this.oldName;
    return { success: true, canRedo: true };
  }
  
  redo(): CommandResult {
    return this.execute();
  }
}
```

Команда для перемещения фраз между группами:

```typescript
// commands/MovePhrasesCommand.ts

import { Command, CommandResult } from '@/types/commands';
import { Phrase } from './DeletePhrasesCommand';

export class MovePhrasesCommand implements Command {
  private phraseIds: string[];
  private targetGroupId: string | null;
  private previousGroupIds: Map<string, string | null> = new Map();
  private phrasesStore: Phrase[];
  
  constructor(
    phraseIds: string[],
    targetGroupId: string | null,
    phrasesStore: Phrase[]
  ) {
    this.phraseIds = phraseIds;
    this.targetGroupId = targetGroupId;
    this.phrasesStore = phrasesStore;
  }
  
  execute(): CommandResult {
    // Сохраняем предыдущие группы
    this.phraseIds.forEach(id => {
      const phrase = this.phrasesStore.find(p => p.id === id);
      if (phrase) {
        this.previousGroupIds.set(id, phrase.groupId);
        phrase.groupId = this.targetGroupId;
      }
    });
    
    return { success: true, canUndo: true };
  }
  
  undo(): CommandResult {
    // Восстанавливаем предыдущие группы
    this.phraseIds.forEach(id => {
      const phrase = this.phrasesStore.find(p => p.id === id);
      const previousGroupId = this.previousGroupIds.get(id);
      
      if (phrase && previousGroupId !== undefined) {
        phrase.groupId = previousGroupId;
      }
    });
    
    return { success: true, canRedo: true };
  }
  
  redo(): CommandResult {
    return this.execute();
  }
}
```

Команда для массового редактирования свойств фраз:

```typescript
// commands/UpdatePhrasePropertiesCommand.ts

import { Command, CommandResult } from '@/types/commands';
import { Phrase } from './DeletePhrasesCommand';

type PhraseProperty = keyof Phrase;

export class UpdatePhrasePropertiesCommand implements Command {
  private phraseIds: string[];
  private property: PhraseProperty;
  private newValue: any;
  private oldValues: Map<string, any> = new Map();
  private phrasesStore: Phrase[];
  
  constructor(
    phraseIds: string[],
    property: PhraseProperty,
    newValue: any,
    phrasesStore: Phrase[]
  ) {
    this.phraseIds = phraseIds;
    this.property = property;
    this.newValue = newValue;
    this.phrasesStore = phrasesStore;
  }
  
  execute(): CommandResult {
    this.phraseIds.forEach(id => {
      const phrase = this.phrasesStore.find(p => p.id === id);
      if (phrase) {
        this.oldValues.set(id, phrase[this.property]);
        (phrase as any)[this.property] = this.newValue;
      }
    });
    
    return { success: true, canUndo: true };
  }
  
  undo(): CommandResult {
    this.phraseIds.forEach(id => {
      const phrase = this.phrasesStore.find(p => p.id === id);
      const oldValue = this.oldValues.get(id);
      
      if (phrase && oldValue !== undefined) {
        (phrase as any)[this.property] = oldValue;
      }
    });
    
    return { success: true, canRedo: true };
  }
  
  redo(): CommandResult {
    return this.execute();
  }
}
```

#### Интеграция с React

Для интеграции Command Pattern с React создаём кастомный хук:

```typescript
// hooks/useCommandHandler.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { CommandHandler } from '@/lib/CommandHandler';
import { Command } from '@/types/commands';

export const useCommandHandler = () => {
  const handlerRef = useRef(new CommandHandler());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const updateState = useCallback((result: { canUndo: boolean; canRedo: boolean }) => {
    setCanUndo(result.canUndo);
    setCanRedo(result.canRedo);
  }, []);
  
  const execute = useCallback((command: Command) => {
    const result = handlerRef.current.execute(command);
    updateState(result);
    return result;
  }, [updateState]);
  
  const undo = useCallback(() => {
    const result = handlerRef.current.undo();
    updateState(result);
    return result;
  }, [updateState]);
  
  const redo = useCallback(() => {
    const result = handlerRef.current.redo();
    updateState(result);
    return result;
  }, [updateState]);
  
  const clear = useCallback(() => {
    handlerRef.current.clear();
    setCanUndo(false);
    setCanRedo(false);
  }, []);
  
  return {
    execute,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  };
};
```

Использование в компоненте:

```typescript
// components/KeysetTable.tsx

import { useCommandHandler } from '@/hooks/useCommandHandler';
import { DeletePhrasesCommand } from '@/commands/DeletePhrasesCommand';
import { CreateGroupCommand } from '@/commands/CreateGroupCommand';

export const KeysetTable = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPhrases, setSelectedPhrases] = useState<Phrase[]>([]);
  
  const { execute, undo, redo, canUndo, canRedo } = useCommandHandler();
  
  // Привязываем Ctrl+Z / Ctrl+Y
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo) undo();
  }, [canUndo, undo]);
  
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    if (canRedo) redo();
  }, [canRedo, redo]);
  
  const handleDeleteSelected = useCallback(() => {
    if (selectedPhrases.length === 0) return;
    
    const command = new DeletePhrasesCommand(selectedPhrases, phrases);
    const result = execute(command);
    
    if (result.success) {
      setPhrases([...phrases]); // Триггерим ре-рендер
      setSelectedPhrases([]);
    }
  }, [selectedPhrases, phrases, execute]);
  
  const handleCreateGroup = useCallback((name: string, parentId: string | null) => {
    const command = new CreateGroupCommand({ name, parentId }, groups);
    const result = execute(command);
    
    if (result.success) {
      setGroups([...groups]); // Триггерим ре-рендер
    }
  }, [groups, execute]);
  
  return (
    <div>
      {/* UI компонента */}
      <button onClick={undo} disabled={!canUndo}>Отменить</button>
      <button onClick={redo} disabled={!canRedo}>Повторить</button>
    </div>
  );
};
```

#### Оптимизация производительности

Для больших объёмов данных следует учитывать несколько аспектов производительности. Ограничивайте размер истории до 50-100 команд, старые команды автоматически удаляются. Для команд, работающих с большими массивами, храните только ID объектов, а не полные копии. При undo/redo используйте batch updates для минимизации ре-рендеров. Рассмотрите использование immer для иммутабельных обновлений внутри команд. Для очень больших операций реализуйте chunk-based undo с разбиением на части.

---

### 2.2. Immer с patches

#### Описание

Immer - это популярная библиотека для работы с иммутабельным состоянием, которая позволяет писать код будто бы изменяя объекты напрямую, при этом создавая иммутабельные копии. Начиная с версии 6, Immer поддерживает систему patches аналогичную RFC-6902 JSON Patch стандарту. Patches записывают изменения в структурированном формате и могут быть применены или отменены с помощью inverse patches.

#### Преимущества

Immer широко используется в React экосистеме (Redux Toolkit, Zustand) и имеет отличную поддержку сообщества. Patches автоматически генерируются для любых изменений состояния, не требуя ручного кода для отмены. Прост в интеграции с существующими системами управления состоянием. Минимальный boilerplate код для базовых операций. Встроенная поддержка сложных вложенных структур данных. TypeScript типизация из коробки.

#### Недостатки

Patches не оптимальны по размеру - Immer не гарантирует минимальный набор изменений. Для больших объектов и длинной истории может потребоваться больше памяти чем Command Pattern. Сложнее контролировать какие изменения попадают в историю. Требуется явное включение функциональности через enablePatches. Patches описывают низкоуровневые изменения, а не бизнес-операции. Для сложных многоэтапных операций патчи могут быть избыточными.

#### Реализация

Базовая настройка Immer с patches:

```typescript
// lib/ImmerUndoRedo.ts

import { enablePatches, produceWithPatches, Patch, applyPatches } from 'immer';

// Включаем поддержку patches (вызвать один раз при старте приложения)
enablePatches();

interface HistoryState<T> {
  past: Array<{ patches: Patch[]; inversePatches: Patch[] }>;
  present: T;
  future: Array<{ patches: Patch[]; inversePatches: Patch[] }>;
}

export class ImmerUndoRedo<T> {
  private state: HistoryState<T>;
  private maxHistorySize = 50;
  
  constructor(initialState: T) {
    this.state = {
      past: [],
      present: initialState,
      future: [],
    };
  }
  
  getState(): T {
    return this.state.present;
  }
  
  canUndo(): boolean {
    return this.state.past.length > 0;
  }
  
  canRedo(): boolean {
    return this.state.future.length > 0;
  }
  
  execute(producer: (draft: T) => void): T {
    const [nextState, patches, inversePatches] = produceWithPatches(
      this.state.present,
      producer
    );
    
    // Сохраняем в историю
    this.state.past.push({ patches, inversePatches });
    this.state.future = []; // Очищаем redo
    
    // Ограничиваем размер истории
    if (this.state.past.length > this.maxHistorySize) {
      this.state.past.shift();
    }
    
    this.state.present = nextState;
    return nextState;
  }
  
  undo(): T {
    if (!this.canUndo()) return this.state.present;
    
    const { inversePatches, patches } = this.state.past.pop()!;
    
    // Применяем inverse patches
    this.state.present = applyPatches(this.state.present, inversePatches);
    
    // Перемещаем в future
    this.state.future.push({ patches, inversePatches });
    
    return this.state.present;
  }
  
  redo(): T {
    if (!this.canRedo()) return this.state.present;
    
    const { patches, inversePatches } = this.state.future.pop()!;
    
    // Применяем patches
    this.state.present = applyPatches(this.state.present, patches);
    
    // Перемещаем в past
    this.state.past.push({ patches, inversePatches });
    
    return this.state.present;
  }
  
  clear(): void {
    this.state.past = [];
    this.state.future = [];
  }
}
```

React хук для Immer Undo/Redo:

```typescript
// hooks/useImmerUndoRedo.ts

import { useState, useCallback, useRef } from 'react';
import { ImmerUndoRedo } from '@/lib/ImmerUndoRedo';

export const useImmerUndoRedo = <T,>(initialState: T) => {
  const managerRef = useRef(new ImmerUndoRedo(initialState));
  const [state, setState] = useState(initialState);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const updateFlags = useCallback(() => {
    setCanUndo(managerRef.current.canUndo());
    setCanRedo(managerRef.current.canRedo());
  }, []);
  
  const execute = useCallback((producer: (draft: T) => void) => {
    const nextState = managerRef.current.execute(producer);
    setState(nextState);
    updateFlags();
  }, [updateFlags]);
  
  const undo = useCallback(() => {
    const nextState = managerRef.current.undo();
    setState(nextState);
    updateFlags();
  }, [updateFlags]);
  
  const redo = useCallback(() => {
    const nextState = managerRef.current.redo();
    setState(nextState);
    updateFlags();
  }, [updateFlags]);
  
  const clear = useCallback(() => {
    managerRef.current.clear();
    updateFlags();
  }, [updateFlags]);
  
  return {
    state,
    execute,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  };
};
```

Использование в компоненте:

```typescript
// components/PhrasesManager.tsx

import { useImmerUndoRedo } from '@/hooks/useImmerUndoRedo';

interface AppState {
  phrases: Phrase[];
  groups: Group[];
}

export const PhrasesManager = () => {
  const { state, execute, undo, redo, canUndo, canRedo } = useImmerUndoRedo<AppState>({
    phrases: [],
    groups: [],
  });
  
  // Привязка хоткеев
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo) undo();
  }, [canUndo, undo]);
  
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    if (canRedo) redo();
  }, [canRedo, redo]);
  
  const handleDeletePhrases = useCallback((idsToDelete: string[]) => {
    execute((draft) => {
      const idsSet = new Set(idsToDelete);
      draft.phrases = draft.phrases.filter(p => !idsSet.has(p.id));
    });
  }, [execute]);
  
  const handleCreateGroup = useCallback((name: string, parentId: string | null) => {
    execute((draft) => {
      draft.groups.push({
        id: crypto.randomUUID(),
        name,
        parentId,
        createdAt: new Date(),
      });
    });
  }, [execute]);
  
  const handleRenameGroup = useCallback((groupId: string, newName: string) => {
    execute((draft) => {
      const group = draft.groups.find(g => g.id === groupId);
      if (group) {
        group.name = newName;
      }
    });
  }, [execute]);
  
  return (
    <div>
      {/* UI */}
      <button onClick={undo} disabled={!canUndo}>Отменить</button>
      <button onClick={redo} disabled={!canRedo}>Повторить</button>
    </div>
  );
};
```

#### Когда использовать Immer

Immer подходит для следующих сценариев: простые операции с состоянием без сложной бизнес-логики; приложение уже использует Immer в других частях; нужна быстрая реализация базового undo/redo без архитектурных инвестиций; большинство операций - это простые изменения свойств объектов; не требуется детальный контроль над гранулярностью отмены.

**Для проекта KeySet**: Может использоваться как промежуточное решение или для простых операций, но Command Pattern предпочтительнее для сложных многоэтапных действий.

---

### 2.3. use-undo ⚠️ ЧАСТИЧНО УСТАРЕЛА

#### Оценка

Библиотека use-undo предоставляет готовый хук для undo/redo функциональности на основе стека состояний. Последнее обновление было 3 года назад (2022), что поднимает вопросы о долгосрочной поддержке. Библиотека имеет 9679 еженедельных загрузок, что значительно меньше чем у react-hotkeys-hook. Размер 22.7 kB в распакованном виде является приемлемым. API простой и интуитивный, основан на useState-подобном интерфейсе.

#### Преимущества

Нулевая настройка, работает из коробки. Простой API напоминающий useState. Поддержка ручных checkpoints для группировки изменений. Лёгкий в понимании для начинающих разработчиков.

#### Недостатки

Отсутствие обновлений более 3 лет вызывает опасения о поддержке. Использует Memento Pattern (хранение полных снимков состояния), что неэффективно по памяти для больших объемов данных. Для длинной истории (50+ шагов) с большими объектами будет значительное потребление памяти. Нет встроенной интеграции с популярными state management решениями. Отсутствует гибкость для сложных операций. Простая замена useState может быть недостаточной для enterprise приложений.

#### Пример использования

```typescript
import useUndo from 'use-undo';

const [phrasesState, {
  set: setPhrases,
  undo,
  redo,
  canUndo,
  canRedo,
  reset,
}] = useUndo<Phrase[]>([]);

const { present: phrases, past, future } = phrasesState;

// Использование
const handleDeletePhrases = (idsToDelete: string[]) => {
  const idsSet = new Set(idsToDelete);
  setPhrases(phrases.filter(p => !idsSet.has(p.id)));
};

// С checkpoints для группировки
const [countState, {
  set: setCount,
  undo,
  redo,
}] = useUndo(0, { useCheckpoints: true });

// Создаст checkpoint
setCount(count + 1, true);

// Не создаст checkpoint (промежуточное изменение)
setCount(count + 1, false);
```

#### Рекомендация для KeySet

Не рекомендуется для production использования из-за отсутствия поддержки и неэффективности для больших объёмов данных. Может рассматриваться только для прототипирования или MVP с ограниченной функциональностью.

---

## 3. Итоговые рекомендации

### Для горячих клавиш

**Выбор**: `react-hotkeys-hook` v5.2.1

**Обоснование**: Современная, активно поддерживаемая библиотека с минимальным footprint (2.8 kB gzipped), полной TypeScript поддержкой и 1.5M+ еженедельных загрузок. Декларативный API идеально интегрируется с React хуками. Встроенная поддержка scopes решает проблемы конфликтов между частями приложения.

**План имплементации**:

1. Установить: `npm install react-hotkeys-hook`
2. Создать централизованный хук `useKeysetHotkeys` для управления всеми комбинациями
3. Использовать scopes для изоляции хоткеев таблицы, групп и глобальных
4. Всегда вызывать `preventDefault` для комбинаций, конфликтующих с браузером
5. Проверять `event.target` для Ctrl+C/V, чтобы не блокировать работу в полях ввода
6. Ограничиться латинскими буквами A-Z и цифрами 0-9 для кросс-локальной совместимости
7. Избегать использования Alt в качестве модификатора

**Bundle impact**: +2.8 kB gzipped - минимальное влияние на размер приложения.

### Для Undo/Redo

**Выбор**: Command Pattern + TypeScript

**Обоснование**: Обеспечивает максимальную гибкость, эффективность по памяти и контроль над отменяемыми операциями. Идеален для сложных многоэтапных действий типа создание/удаление/перемещение групп. Независим от конкретных библиотек, полностью типизирован, легко тестируется и расширяется.

**План имплементации**:

1. Создать базовую инфраструктуру: `Command`, `CommandResult`, `UndoHistory`, `CommandHandler`
2. Реализовать команды для всех отменяемых операций:
   - `DeletePhrasesCommand` - удаление фраз
   - `CreateGroupCommand` - создание группы
   - `DeleteGroupCommand` - удаление группы
   - `RenameGroupCommand` - переименование группы
   - `MovePhrasesCommand` - перемещение фраз между группами
   - `UpdatePhrasePropertiesCommand` - массовое редактирование свойств
3. Создать React хук `useCommandHandler` для интеграции с компонентами
4. Интегрировать с `react-hotkeys-hook` для Ctrl+Z / Ctrl+Y
5. Добавить UI индикаторы состояния canUndo/canRedo
6. Установить лимит истории в 50 команд для баланса функциональности и памяти
7. Логировать выполнение команд для отладки и аналитики

**Bundle impact**: ~5-7 kB кастомного кода (без зависимостей).

**Альтернатива для простых случаев**: Immer с patches - может использоваться для быстрого прототипирования или операций без сложной бизнес-логики. Требует `npm install immer` (+14 kB gzipped).

### Интеграция обоих решений

Для полной интеграции горячих клавиш с системой Undo/Redo:

```typescript
// hooks/useKeysetHotkeys.ts

import { useHotkeys } from 'react-hotkeys-hook';
import { useCommandHandler } from './useCommandHandler';

export const useKeysetHotkeys = (
  handlers: {
    onSelectAll?: () => void;
    onDelete?: () => void;
    onSearch?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onRename?: () => void;
  },
  options?: {
    enabled?: boolean;
    scope?: string;
  }
) => {
  const { undo, redo, canUndo, canRedo } = useCommandHandler();
  
  // Undo/Redo
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo) undo();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || '*' }, [canUndo, undo]);
  
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    if (canRedo) redo();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || '*' }, [canRedo, redo]);
  
  // Другие хоткеи
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault();
    handlers.onSelectAll?.();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || 'table' }, [handlers.onSelectAll]);
  
  useHotkeys('delete', () => {
    handlers.onDelete?.();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || 'table' }, [handlers.onDelete]);
  
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    handlers.onSearch?.();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || '*' }, [handlers.onSearch]);
  
  useHotkeys('ctrl+c', (e) => {
    if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      handlers.onCopy?.();
    }
  }, { enabled: options?.enabled !== false, scopes: options?.scope || 'table' }, [handlers.onCopy]);
  
  useHotkeys('ctrl+v', (e) => {
    if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      handlers.onPaste?.();
    }
  }, { enabled: options?.enabled !== false, scopes: options?.scope || 'table' }, [handlers.onPaste]);
  
  useHotkeys('f2', (e) => {
    e.preventDefault();
    handlers.onRename?.();
  }, { enabled: options?.enabled !== false, scopes: options?.scope || 'groups' }, [handlers.onRename]);
  
  return { canUndo, canRedo };
};
```

Использование:

```typescript
// components/KeysetApp.tsx

const KeysetApp = () => {
  const { execute } = useCommandHandler();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { canUndo, canRedo } = useKeysetHotkeys({
    onSelectAll: handleSelectAll,
    onDelete: handleDelete,
    onSearch: () => searchInputRef.current?.focus(),
    onCopy: handleCopy,
    onPaste: handlePaste,
    onRename: handleRename,
  }, {
    enabled: true,
  });
  
  const handleDelete = useCallback(() => {
    if (selectedPhrases.length === 0) return;
    
    const command = new DeletePhrasesCommand(selectedPhrases, phrases);
    execute(command);
    setPhrases([...phrases]);
  }, [selectedPhrases, phrases, execute]);
  
  return (
    <div>
      {/* UI */}
      <div className="toolbar">
        <button onClick={() => execute()} disabled={!canUndo}>
          ↶ Отменить (Ctrl+Z)
        </button>
        <button onClick={() => execute()} disabled={!canRedo}>
          ↷ Повторить (Ctrl+Y)
        </button>
      </div>
    </div>
  );
};
```

---

## 4. Сравнительные таблицы

### 4.1. Сравнение решений для горячих клавиш

| Критерий | react-hotkeys-hook | react-hotkeys | Нативные обработчики |
|----------|-------------------|---------------|---------------------|
| **Актуальность (2025)** | ✅ Активно (обновлено 17 дней назад) | ❌ Устарела (6 лет без обновлений) | ✅ Всегда актуально |
| **Bundle Size** | 2.8 kB gzipped | ~30-40 kB gzipped | 0 kB |
| **TypeScript** | ✅ Полная поддержка | ⚠️ Через @types | ✅ Ручная типизация |
| **API стиль** | Хуки (современный) | HoC/JSX (устаревший) | Ручная реализация |
| **Простота использования** | ⭐⭐⭐⭐⭐ Отлично | ⭐⭐⭐ Удовлетворительно | ⭐⭐ Требует кода |
| **Scopes/Изоляция** | ✅ Встроенная | ✅ Есть | ❌ Ручная реализация |
| **Поддержка форм** | ✅ enableOnFormTags | ✅ Есть | ❌ Ручная проверка |
| **Зависимости** | 0 | 1 (prop-types) | 0 |
| **Еженедельные загрузки** | 1.5M+ | 502K | - |
| **Проблемы с key/code** | ⚠️ Использует оба | ⚠️ Использует which | ⚠️ Зависит от реализации |
| **Кросс-локальность** | ⚠️ Ограниченная | ⚠️ Ограниченная | ⚠️ Зависит от реализации |
| **Рекомендация** | ✅ **РЕКОМЕНДУЕТСЯ** | ❌ Не использовать | ⚠️ Только для 1-2 хоткеев |

### 4.2. Сравнение решений для Undo/Redo

| Критерий | Command Pattern | Immer + patches | use-undo |
|----------|----------------|-----------------|----------|
| **Актуальность** | ✅ Паттерн актуален всегда | ✅ Immer активно поддерживается | ⚠️ 3 года без обновлений |
| **Эффективность памяти** | ⭐⭐⭐⭐⭐ Отлично (только ссылки) | ⭐⭐⭐⭐ Хорошо (patches) | ⭐⭐ Плохо (полные снимки) |
| **Для больших данных** | ✅ Идеально | ✅ Хорошо | ❌ Неэффективно |
| **Простота реализации** | ⭐⭐⭐ Требует кода | ⭐⭐⭐⭐ Проще | ⭐⭐⭐⭐⭐ Очень просто |
| **Контроль операций** | ⭐⭐⭐⭐⭐ Полный | ⭐⭐⭐ Ограниченный | ⭐⭐ Базовый |
| **Сложные операции** | ✅ Идеально | ⚠️ Возможно | ❌ Сложно |
| **TypeScript** | ✅ Полная типизация | ✅ Полная типизация | ⚠️ Базовая |
| **Расширяемость** | ⭐⭐⭐⭐⭐ Отлично | ⭐⭐⭐ Хорошо | ⭐⭐ Ограничено |
| **Bundle impact** | ~5-7 kB (кастомный код) | +14 kB gzipped (Immer) | +5 kB |
| **Интеграция с state** | ✅ Любой | ✅ Любой (особенно Redux) | ⚠️ Ограниченная |
| **Тестируемость** | ⭐⭐⭐⭐⭐ Отлично | ⭐⭐⭐⭐ Хорошо | ⭐⭐⭐ Удовлетворительно |
| **Логирование/Отладка** | ✅ Полное | ⚠️ Низкоуровневое (patches) | ❌ Ограниченное |
| **Рекомендация** | ✅ **РЕКОМЕНДУЕТСЯ** | ⚠️ Для простых случаев | ❌ Не использовать |

---

## 5. Потенциальные проблемы и их решения

### 5.1. Конфликты горячих клавиш

**Проблема**: Хоткеи срабатывают в неожиданных контекстах (например, в модальных окнах).

**Решение**: Использовать scopes для изоляции контекстов:

```typescript
// В модальном окне
const { enableScope, disableScope } = useHotkeysContext();

useEffect(() => {
  enableScope('modal');
  return () => disableScope('modal');
}, []);

// Хоткей только для модального окна
useHotkeys('escape', closeModal, { scopes: 'modal' });

// Хоткей для таблицы (отключается в модальном окне)
useHotkeys('delete', handleDelete, { scopes: 'table' });
```

### 5.2. Производительность при длинной истории Undo/Redo

**Проблема**: При большом количестве команд может увеличиться потребление памяти.

**Решение**: Ограничить размер истории и использовать референсы вместо копий:

```typescript
class UndoHistory {
  private maxHistorySize = 50; // Лимит команд
  
  push(command: Command): void {
    this.undoStack.push(command);
    
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift(); // Удаляем самую старую
    }
  }
}
```

### 5.3. Ре-рендеры при выполнении команд

**Проблема**: Каждая команда вызывает ре-рендер всего приложения.

**Решение**: Использовать batch updates или разделение state:

```typescript
import { unstable_batchedUpdates } from 'react-dom';

const executeCommand = (command: Command) => {
  const result = handler.execute(command);
  
  unstable_batchedUpdates(() => {
    setPhrases([...phrases]);
    setGroups([...groups]);
    updateUndoState(result);
  });
};
```

### 5.4. Международные раскладки клавиатуры

**Проблема**: Хоткеи не работают на DVORAK или других раскладках.

**Решение**: Ограничиться A-Z и 0-9, избегать символов:

```typescript
// ✅ Хорошо - работает на всех раскладках
useHotkeys('ctrl+a', handler);
useHotkeys('ctrl+1', handler);

// ❌ Плохо - зависит от раскладки
useHotkeys('ctrl+[', handler);
useHotkeys('alt+c', handler); // Alt изменяет символы
```

---

## 6. Источники

[1] [react-hotkeys-hook - NPM](https://www.npmjs.com/package/react-hotkeys-hook) - Высокая надёжность - Официальный пакет, активно поддерживается, 1.5M+ загрузок в неделю

[2] [react-hotkeys-hook Documentation](https://react-hotkeys-hook.vercel.app/) - Высокая надёжность - Официальная документация библиотеки

[3] [react-hotkeys-hook Bundle Size - Bundlephobia](https://bundlephobia.com/package/react-hotkeys-hook) - Высокая надёжность - Независимый сервис анализа размера пакетов

[4] [react-hotkeys - NPM](https://www.npmjs.com/package/react-hotkeys) - Высокая надёжность - Официальный пакет (устаревший)

[5] [use-undo - NPM](https://www.npmjs.com/package/use-undo) - Средняя надёжность - Официальный пакет, но не обновляется

[6] [Immer Patches Documentation](https://immerjs.github.io/immer/patches/) - Высокая надёжность - Официальная документация Immer

[7] [All Javascript Keyboard Shortcut Libraries Are Broken](https://blog.duvallj.pw/posts/2025-01-10-all-javascript-keyboard-shortcut-libraries-are-broken.html) - Высокая надёжность - Детальный технический анализ проблем библиотек (январь 2025)

[8] [Command Pattern in TypeScript - sbcode.net](https://sbcode.net/typescript/command/) - Высокая надёжность - Образовательный ресурс с примерами паттернов

[9] [Designing a Lightweight Undo History with TypeScript - JitBlox](https://www.jitblox.com/blog/designing-a-lightweight-undo-history-with-typescript) - Высокая надёжность - Детальный гайд по реализации undo/redo

[10] [NPM Trends - Keyboard Shortcuts Libraries](https://npmtrends.com/react-hot-keys-vs-react-hotkeys-vs-react-hotkeys-hook) - Высокая надёжность - Независимый сервис сравнения популярности пакетов

---

**Дата создания отчёта**: 2025-10-31  
**Автор**: MiniMax Agent
