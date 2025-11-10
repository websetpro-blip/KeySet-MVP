// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  KeySetStoreV5,
  Phrase,
  Group,
  LogEntry,
  AppState,
  Stopword,
  Filter,
  ColumnVisibility
} from '../types';
import {
  fetchGroups,
  fetchPhrases,
  enqueuePhrases,
  deletePhrasesById,
  clearAllPhrases,
  updatePhraseGroup,
  type FrequencyRowDto,
  type GroupRowDto,
} from '../api/data';

// Интерфейс для снимка состояния
interface StateSnapshot {
  phrases: Phrase[];
  groups: Group[];
  stopwords: Stopword[];
  timestamp: number;
}

// Начальное состояние
const initialState: Omit<AppState, 'history'> = {
  phrases: [],
  groups: [],
  stopwords: [],
  filters: {},
  savedFilters: [],
  columnVisibility: {
    phrase: true,
    ws: true,
    qws: true,
    bws: true,
    status: true,
    dateAdded: false,
  },
  selectedPhraseIds: new Set(),
  selectedGroupId: null,
  activeGroupIds: new Set(),
  activityLog: [],
  processProgress: 0,
  processCurrent: 0,
  processTotal: 0,
  columnOrder: [],
  columnPinning: {},
  viewTemplates: [],
  searchMasks: [
    { id: '1', name: 'Google', url: 'https://www.google.com/search?q={QUERY}' },
    { id: '2', name: 'Yandex', url: 'https://yandex.ru/search/?text={QUERY}' },
  ],
  phraseColors: {},
  groupColors: {},
  pinnedPhraseIds: new Set(),
  footerStats: {},
  // Новые поля для v5.0
  markedPhraseIds: new Set(),
  pinnedGroupIds: new Set(),
  snapshots: [],
  exportPresets: [],
  phraseTags: [],
  version: 5,
  isDataLoaded: false,
  isDataLoading: false,
  dataError: null,
  phrasesCursor: null,
};

// История для undo/redo
let historyPast: StateSnapshot[] = [];
let historyFuture: StateSnapshot[] = [];
const MAX_HISTORY_SIZE = 50;
const KEYSET_STORAGE_KEY = 'keyset-store';

const createSafeStorage = () => ({
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('[KeySet][store] Failed to read from localStorage', error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('[KeySet][store] Failed to write to localStorage', error);
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('[KeySet][store] Failed to remove entry from localStorage', error);
    }
  },
});

const extractNumericId = (id: string | number | undefined | null): number | null => {
  if (id == null) {
    return null;
  }
  if (typeof id === 'number') {
    return id;
  }
  const match = String(id).match(/(\d+)$/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isNaN(value) ? null : value;
};

const pickNumber = (...values: Array<number | null | undefined>): number => {
  for (const value of values) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return 0;
};

const mapPhraseFromDto = (row: FrequencyRowDto): Phrase => {
  const timestamp = row.updatedAt ? Date.parse(row.updatedAt) : Date.now();
  const wsValue = pickNumber(row.ws, row.freq);
  const wsQuotesValue = pickNumber(row.wsQuotes, row.freqQuotes, row.qws);
  const wsExactValue = pickNumber(row.wsExact, row.freqExact, row.bws);

  const statusMap: Record<string, Phrase['status']> = {
    ok: 'success',
    ready: 'success',
    done: 'success',
    queued: 'pending',
    pending: 'pending',
    running: 'pending',
    error: 'error',
    failed: 'error',
  };

  return {
    id: `freq-${row.id}`,
    text: row.phrase ?? '',
    ws: wsValue,
    qws: wsQuotesValue,
    bws: wsExactValue,
    status: statusMap[(row.status || '').toLowerCase()] ?? 'done',
    groupId: row.group ?? null,
    createdAt: timestamp,
    dateAdded: timestamp,
    hasStopword: false,
    history: [],
    locked: false,
  };
};

const mapGroupFromDto = (row: GroupRowDto): Group => ({
  id: row.id,
  name: row.name,
  parentId: row.parentId,
  children: [],
  collapsed: false,
  type: (row.type as Group['type']) || 'normal',
  color: row.color || '#6366f1',
  locked: row.locked ?? false,
  comment: row.comment ?? undefined,
});

// Создать снимок текущего состояния
const createSnapshot = (state: any): StateSnapshot => {
  try {
    // Безопасное клонирование данных
    const safeClone = (obj: any) => {
      try {
        if (obj === null || typeof obj !== 'object') {
          return obj;
        }
        if (obj instanceof Set) {
          return Array.from(obj);
        }
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        
        // Проверка на циклические ссылки
        if (obj.__visited) {
          return null;
        }
        
        obj.__visited = true;
        
        if (Array.isArray(obj)) {
          return obj.map(safeClone).filter(item => item !== null);
        }
        
        const result: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && key !== '__visited') {
            result[key] = safeClone(obj[key]);
          }
        }
        
        // Удаляем маркер после обработки
        delete obj.__visited;
        
        return result;
      } catch (error) {
        console.warn('Ошибка клонирования объекта:', error);
        return null;
      }
    };
    
    return {
      phrases: safeClone(state.phrases) || [],
      groups: safeClone(state.groups) || [],
      stopwords: safeClone(state.stopwords) || [],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('Ошибка создания снапшота:', error);
    return {
      phrases: [],
      groups: [],
      stopwords: [],
      timestamp: Date.now(),
    };
  }
};

// Сохранить снимок перед изменением
const saveSnapshot = (state: any): void => {
  const snapshot = createSnapshot(state);
  historyPast.push(snapshot);
  historyFuture = []; // Очистить future при новом действии
  
  // Ограничить размер истории
  if (historyPast.length > MAX_HISTORY_SIZE) {
    historyPast.shift();
  }
};

export const useStore = create<KeySetStoreV5>()(
  persist(
    (set, get) => ({
      ...initialState,
      history: {
        past: [],
        present: { ...initialState, history: { past: [], present: {} as AppState, future: [] } },
        future: [],
      },

      // ========== ФРАЗЫ ==========
      addPhrases: async (newPhrases) => {
        const normalized = Array.from(
          new Set(
            newPhrases
              .map((phrase) => (phrase.text || '').trim())
              .filter((text) => Boolean(text))
          )
        );

        if (normalized.length === 0) {
          get().addLog('warning', 'Не удалось добавить: список фраз пуст');
          return;
        }

        try {
          await enqueuePhrases({ phrases: normalized, region: 225 });
          get().addLog('info', `Фразы поставлены в очередь: ${normalized.length}`);
          await get().loadInitialData();
        } catch (error) {
          get().addLog('error', `Ошибка добавления фраз: ${(error as Error).message}`);
        }
      },

      updatePhrase: (id, updates) => {
        saveSnapshot(get()); // Сохранить снимок перед изменением
        
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
        
        get().addLog('info', `Фраза обновлена: ${id.substring(0, 8)}...`);
      },

      applyWordstatResults: (rows) => {
        if (!rows || rows.length === 0) {
          return;
        }
        saveSnapshot(get());
        
        const normalized = new Map();
        rows.forEach((row) => {
          const key = (row?.phrase || '').trim().toLowerCase();
          if (!key) {
            return;
          }
          normalized.set(key, {
            ws: typeof row.ws === 'number' ? row.ws : null,
            qws: typeof row.qws === 'number' ? row.qws : null,
            bws: typeof row.bws === 'number' ? row.bws : null,
            status: row.status || 'success',
          });
        });
        
        set((state) => ({
          phrases: state.phrases.map((phrase) => {
            const lookupKey = (phrase.text || '').trim().toLowerCase();
            const data = normalized.get(lookupKey);
            if (!data) {
              return phrase;
            }
            return {
              ...phrase,
              ws: typeof data.ws === 'number' ? data.ws : phrase.ws,
              qws: typeof data.qws === 'number' ? data.qws : phrase.qws,
              bws: typeof data.bws === 'number' ? data.bws : phrase.bws,
              status: data.status?.toLowerCase().includes('error') ? 'error' : 'success',
            };
          }),
        }));
        
        get().addLog('success', `Частотность обновлена: ${rows.length} строк`);
      },

      deletePhrases: async (ids) => {
        const numericIds = ids
          .map((id) => extractNumericId(id))
          .filter((value): value is number => value !== null);

        try {
          if (numericIds.length > 0) {
            await deletePhrasesById(numericIds);
          }

          saveSnapshot(get());
          set((state) => ({
            phrases: state.phrases.filter((phrase) => !ids.includes(phrase.id)),
            selectedPhraseIds: new Set(
              Array.from(state.selectedPhraseIds).filter((id) => !ids.includes(id))
            ),
          }));
          get().addLog('warning', `Удалено фраз: ${ids.length}`);
        } catch (error) {
          get().addLog('error', `Не удалось удалить фразы: ${(error as Error).message}`);
        }
      },

      clearPhrases: async () => {
        try {
          await clearAllPhrases();
          const count = get().phrases.length;
          set({ phrases: [], selectedPhraseIds: new Set() });
          get().addLog('warning', `Таблица очищена (${count} фраз)`);
        } catch (error) {
          get().addLog('error', `Не удалось очистить таблицу: ${(error as Error).message}`);
        }
      },

      setPhrases: (newPhrases) => {
        saveSnapshot(get());
        set({ phrases: newPhrases, selectedPhraseIds: new Set() });
        get().addLog('info', `Обновлено фраз: ${newPhrases.length}`);
      },

      // ========== ВЫДЕЛЕНИЕ ==========
      selectPhrase: (id, multi = false) => {
        set((state) => {
          const newSelected = new Set(multi ? state.selectedPhraseIds : []);
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          return { selectedPhraseIds: newSelected };
        });
      },

      selectAll: () => {
        set((state) => ({
          selectedPhraseIds: new Set(state.phrases.map(p => p.id)),
        }));
        get().addLog('info', `Выделено всех: ${get().phrases.length} фраз`);
      },

      deselectAll: () => {
        set({ selectedPhraseIds: new Set() });
      },

      invertSelection: () => {
        set((state) => {
          const allIds = new Set(state.phrases.map(p => p.id));
          const newSelected = new Set<string>();
          
          allIds.forEach(id => {
            if (!state.selectedPhraseIds.has(id)) {
              newSelected.add(id);
            }
          });
          
          return { selectedPhraseIds: newSelected };
        });
        
        get().addLog('info', `Выделение инвертировано`);
      },

      // ========== ГРУППЫ ==========
      addGroup: (name, parentId = null) => {
        saveSnapshot(get()); // Сохранить снимок перед изменением
        
        const newGroup: Group = {
          id: uuidv4(),
          name,
          parentId,
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
        
        get().addLog('success', `Группа создана: "${name}"`);
      },

      updateGroup: (id, updates) => {
        saveSnapshot(get()); // Сохранить снимок перед изменением
        
        set((state) => ({
          groups: state.groups.map(g => 
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
        
        if (updates.name) {
          get().addLog('info', `Группа переименована: "${updates.name}"`);
        }
      },

      deleteGroup: (id) => {
        saveSnapshot(get()); // Сохранить снимок перед изменением
        
        const group = get().groups.find(g => g.id === id);
        
        set((state) => ({
          groups: state.groups.filter(g => g.id !== id && g.parentId !== id),
          phrases: state.phrases.map(p => 
            p.groupId === id ? { ...p, groupId: null } : p
          ),
          selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
        }));
        
        if (group) {
          get().addLog('warning', `Группа удалена: "${group.name}"`);
        }
      },

      selectGroup: (id) => {
        set({ selectedGroupId: id });
        
        if (id) {
          const group = get().groups.find(g => g.id === id);
          if (group) {
            const count = get().phrases.filter(p => p.groupId === id).length;
            get().addLog('info', `Фильтр по группе: "${group.name}" (${count} фраз)`);
          }
        } else {
          get().addLog('info', `Фильтр снят - показаны все фразы`);
        }
      },

      movePhrases: (phraseIds, groupId) => {
        set((state) => ({
          phrases: state.phrases.map(p => 
            phraseIds.includes(p.id) ? { ...p, groupId } : p
          ),
        }));
        
        const group = groupId ? get().groups.find(g => g.id === groupId) : null;
        const groupName = group ? group.name : 'Без группы';
        get().addLog('info', `Фразы перемещены в "${groupName}": ${phraseIds.length} шт.`);
      },

      // ========== СТОП-СЛОВА ==========
      addStopwords: (words) => {
        const newStopwords: Stopword[] = words.map(word => ({
          id: uuidv4(),
          text: word,
          matchType: 'partial',
          useMorphology: false,
          category: 'ГЕО',
        }));
        
        set((state) => ({
          stopwords: [...state.stopwords, ...newStopwords],
        }));
        
        get().addLog('success', `Стоп-слова добавлены: ${words.length} шт.`);
      },

      removeStopword: (word) => {
        set((state) => ({
          stopwords: state.stopwords.filter(w => w.text !== word),
        }));
        
        get().addLog('info', `Стоп-слово удалено: "${word}"`);
      },

      clearStopwords: () => {
        const count = get().stopwords.length;
        set({ stopwords: [] });
        get().addLog('warning', `Все стоп-слова удалены (${count} шт.)`);
      },

      addStopword: (stopword) => {
        set((state) => ({
          stopwords: [...state.stopwords, stopword],
        }));
        get().addLog('success', `Стоп-слово добавлено: "${stopword.text}"`);
      },

      deleteStopword: (id) => {
        const stopword = get().stopwords.find(s => s.id === id);
        set((state) => ({
          stopwords: state.stopwords.filter(s => s.id !== id),
        }));
        if (stopword) {
          get().addLog('info', `Стоп-слово удалено: "${stopword.text}"`);
        }
      },

      updateStopword: (id, updates) => {
        set((state) => ({
          stopwords: state.stopwords.map(s => 
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      markStopwordPhrases: () => {
        const { phrases, stopwords } = get();
        const markedIds: string[] = [];
        
        const updated = phrases.map(p => {
          const hasStopword = stopwords.some(sw => p.text.includes(sw.text));
          if (hasStopword) markedIds.push(p.id);
          return { ...p, hasStopword };
        });
        
        set({ phrases: updated });
        get().addLog('info', `Найдено фраз со стоп-словами: ${markedIds.length}`);
        return markedIds;
      },

      deleteStopwordPhrases: () => {
        const before = get().phrases.length;
        set((state) => ({
          phrases: state.phrases.filter(p => !p.hasStopword),
        }));
        const deleted = before - get().phrases.length;
        get().addLog('warning', `Удалено фраз со стоп-словами: ${deleted}`);
        return deleted;
      },

      // ========== ЖУРНАЛ ==========
      addLog: (level, message) => {
        const log: LogEntry = {
          id: uuidv4(),
          timestamp: Date.now(),
          level,
          message,
        };
        
        set((state) => ({
          activityLog: [...state.activityLog.slice(-99), log], // храним последние 100
        }));
      },

      clearLog: () => {
        set({ activityLog: [] });
      },

      // ========== ФИЛЬТРЫ ==========
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
        get().addLog('info', 'Фильтры очищены');
      },

      saveCurrentFilter: (name) => {
        const savedFilter = {
          id: uuidv4(),
          name,
          filter: get().filters,
        };
        set((state) => ({
          savedFilters: [...state.savedFilters, savedFilter],
        }));
        get().addLog('success', `Фильтр сохранён: "${name}"`);
      },

      applyFilter: (id) => {
        const filter = get().savedFilters.find(f => f.id === id);
        if (filter) {
          set({ filters: filter.filter });
          get().addLog('info', `Применён фильтр: "${filter.name}"`);
        }
      },

      deleteSavedFilter: (id) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter(f => f.id !== id),
        }));
      },

      // ========== СТОЛБЦЫ ==========
      setColumnVisibility: (visibility) => {
        set((state) => ({
          columnVisibility: { ...state.columnVisibility, ...visibility },
        }));
      },

      // ========== ПРОГРЕСС ==========
      setProcessProgress: (progress, current, total) => {
        set({
          processProgress: progress,
          processCurrent: current,
          processTotal: total,
        });
      },

      resetProgress: () => {
        set({
          processProgress: 0,
          processCurrent: 0,
          processTotal: 0,
        });
      },

      // ========== РАСШИРЕННЫЕ ДЕЙСТВИЯ С ФРАЗАМИ ==========
      editPhrase: (id, text) => {
        saveSnapshot(get());
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === id ? { ...p, text } : p
          ),
        }));
        get().addLog('info', 'Фраза отредактирована');
      },

      markRowColor: (id, color) => {
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === id ? { ...p, color } : p
          ),
        }));
      },

      toggleRowLock: (id) => {
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === id ? { ...p, locked: !p.locked } : p
          ),
        }));
      },

      deleteSelectedPhrases: async (ids) => {
        await get().deletePhrases(ids);
      },

      movePhrasesToGroup: async (ids, groupId) => {
        const numericIds = ids
          .map((id) => extractNumericId(id))
          .filter((value): value is number => value !== null);

        try {
          if (numericIds.length > 0) {
            await updatePhraseGroup(numericIds, groupId);
          }
          saveSnapshot(get());
          set((state) => ({
            phrases: state.phrases.map((phrase) =>
              ids.includes(phrase.id) ? { ...phrase, groupId } : phrase
            ),
            selectedPhraseIds: new Set(),
          }));
          get().addLog('info', `Фразы перемещены: ${ids.length} шт.`);
        } catch (error) {
          get().addLog('error', `Не удалось переместить фразы: ${(error as Error).message}`);
        }
      },

      copyPhrasesToGroup: (ids, groupId) => {
        saveSnapshot(get());
        const phrasesToCopy = get().phrases.filter(p => ids.includes(p.id));
        const copies = phrasesToCopy.map(p => ({
          ...p,
          id: uuidv4(),
          groupId,
          createdAt: Date.now(),
        }));
        
        set((state) => ({
          phrases: [...state.phrases, ...copies],
        }));
        get().addLog('success', `Фразы скопированы: ${copies.length} шт.`);
      },

      // ========== UNDO/REDO ==========
      undo: () => {
        if (historyPast.length === 0) {
          get().addLog('warning', 'Нечего отменять');
          return;
        }
        
        // Сохранить текущее состояние в future
        const currentSnapshot = createSnapshot(get());
        historyFuture.push(currentSnapshot);
        
        // Восстановить предыдущее состояние
        const previousSnapshot = historyPast.pop()!;
        set({
          phrases: previousSnapshot.phrases,
          groups: previousSnapshot.groups,
          stopwords: previousSnapshot.stopwords,
        });
        
        get().addLog('info', 'Отменено последнее действие');
      },

      redo: () => {
        if (historyFuture.length === 0) {
          get().addLog('warning', 'Нечего повторять');
          return;
        }
        
        // Сохранить текущее состояние в past
        const currentSnapshot = createSnapshot(get());
        historyPast.push(currentSnapshot);
        
        // Восстановить следующее состояние
        const nextSnapshot = historyFuture.pop()!;
        set({
          phrases: nextSnapshot.phrases,
          groups: nextSnapshot.groups,
          stopwords: nextSnapshot.stopwords,
        });
        
        get().addLog('info', 'Повторено отмененное действие');
      },

      canUndo: () => historyPast.length > 0,
      canRedo: () => historyFuture.length > 0,

      // ========== МУЛЬТИ-ГРУППА ==========
      toggleActiveGroup: (groupId) => {
        set((state) => {
          const newSet = new Set(state.activeGroupIds);
          if (newSet.has(groupId)) {
            newSet.delete(groupId);
          } else {
            newSet.add(groupId);
          }
          return { activeGroupIds: newSet };
        });
      },

      clearActiveGroups: () => {
        set({ activeGroupIds: new Set() });
      },

      // ========== КОЛОНКИ ==========
      setColumnOrder: (order) => {
        set({ columnOrder: order });
        localStorage.setItem('columnOrder', JSON.stringify(order));
      },

      setColumnPinning: (pinning) => {
        set({ columnPinning: pinning });
        localStorage.setItem('columnPinning', JSON.stringify(pinning));
      },

      // ========== ШАБЛОНЫ ВИДОВ ==========
      saveViewTemplate: (name) => {
        const state = get();
        const template = {
          id: uuidv4(),
          name,
          columnVisibility: state.columnVisibility,
          columnOrder: state.columnOrder,
          columnPinning: state.columnPinning,
          sorting: [], // Будет добавлено позже
        };
        
        set((state) => ({
          viewTemplates: [...state.viewTemplates, template],
        }));
        
        localStorage.setItem('viewTemplates', JSON.stringify([...state.viewTemplates, template]));
        get().addLog('success', `Шаблон вида сохранен: "${name}"`);
      },

      loadViewTemplate: (templateId) => {
        const template = get().viewTemplates.find(t => t.id === templateId);
        if (template) {
          set({
            columnVisibility: template.columnVisibility,
            columnOrder: template.columnOrder,
            columnPinning: template.columnPinning,
          });
          get().addLog('info', `Шаблон вида загружен: "${template.name}"`);
        }
      },

      deleteViewTemplate: (templateId) => {
        const template = get().viewTemplates.find(t => t.id === templateId);
        set((state) => ({
          viewTemplates: state.viewTemplates.filter(t => t.id !== templateId),
        }));
        
        const newTemplates = get().viewTemplates;
        localStorage.setItem('viewTemplates', JSON.stringify(newTemplates));
        
        if (template) {
          get().addLog('warning', `Шаблон вида удален: "${template.name}"`);
        }
      },

      // ========== МАСКИ ПОИСКА ==========
      addSearchMask: (mask) => {
        set((state) => ({
          searchMasks: [...state.searchMasks, mask],
        }));
        get().addLog('success', `Маска поиска добавлена: "${mask.name}"`);
      },

      removeSearchMask: (maskId) => {
        const mask = get().searchMasks.find(m => m.id === maskId);
        set((state) => ({
          searchMasks: state.searchMasks.filter(m => m.id !== maskId),
        }));
        if (mask) {
          get().addLog('info', `Маска поиска удалена: "${mask.name}"`);
        }
      },

      // ========== ЦВЕТОВАЯ МАРКИРОВКА ==========
      markPhraseColor: (phraseId, color) => {
        set((state) => ({
          phraseColors: { ...state.phraseColors, [phraseId]: color },
        }));
        localStorage.setItem('phraseColors', JSON.stringify({ ...get().phraseColors, [phraseId]: color }));
      },

      setGroupColor: (groupId, color) => {
        set((state) => ({
          groupColors: { ...state.groupColors, [groupId]: color },
        }));
        localStorage.setItem('groupColors', JSON.stringify({ ...get().groupColors, [groupId]: color }));
      },

      // ========== ЗАКРЕПЛЕНИЕ ФРАЗ ==========
      togglePinPhrase: (phraseId) => {
        set((state) => {
          const newSet = new Set(state.pinnedPhraseIds);
          if (newSet.has(phraseId)) {
            newSet.delete(phraseId);
          } else {
            newSet.add(phraseId);
          }
          return { pinnedPhraseIds: newSet };
        });
        
        const pinnedIds = Array.from(get().pinnedPhraseIds);
        localStorage.setItem('pinnedPhraseIds', JSON.stringify(pinnedIds));
      },

      // ========== СТАТИСТИКА ФУТЕРА ==========
      updateFooterStats: (columnId, stats) => {
        set((state) => ({
          footerStats: { ...state.footerStats, [columnId]: stats },
        }));
      },

      // ========== МАРКИРОВКА ФРАЗ (v5.0) ==========
      toggleMarkPhrase: (phraseId) => {
        set((state) => {
          const newSet = new Set(state.markedPhraseIds);
          if (newSet.has(phraseId)) {
            newSet.delete(phraseId);
          } else {
            newSet.add(phraseId);
          }
          return { markedPhraseIds: newSet };
        });
      },

      markPhrasesByFilter: () => {
        saveSnapshot(get());
        const state = get();
        const newSet = new Set(state.markedPhraseIds);
        const filteredPhrases = state.phrases.filter(phrase => {
          // Применяем текущие фильтры из state.filters
          const { filters } = state;
          if (filters.wsMin && (phrase.ws || 0) < filters.wsMin) return false;
          if (filters.wsMax && (phrase.ws || 0) > filters.wsMax) return false;
          if (filters.contains && !phrase.text.toLowerCase().includes(filters.contains.toLowerCase())) return false;
          if (filters.notContains && phrase.text.toLowerCase().includes(filters.notContains.toLowerCase())) return false;
          return true;
        });

        filteredPhrases.forEach(phrase => {
          newSet.add(phrase.id);
        });

        set({ markedPhraseIds: newSet });
        get().addLog('success', `Отмечено по фильтру: ${filteredPhrases.length} фраз`);
      },

      invertMarkedPhrases: () => {
        set((state) => {
          const allIds = new Set(state.phrases.map(p => p.id));
          const newSet = new Set<string>();
          
          allIds.forEach(id => {
            if (!state.markedPhraseIds.has(id)) {
              newSet.add(id);
            }
          });
          
          return { markedPhraseIds: newSet };
        });
        get().addLog('info', 'Маркировка инвертирована');
      },

      clearAllMarks: () => {
        set({ markedPhraseIds: new Set() });
        get().addLog('info', 'Все маркировки сняты');
      },

      markAllPhrases: () => {
        set((state) => ({
          markedPhraseIds: new Set(state.phrases.map(p => p.id)),
        }));
        get().addLog('info', `Отмечено всех фраз: ${get().phrases.length}`);
      },

      unmarkAllPhrases: () => {
        set({ markedPhraseIds: new Set() });
        get().addLog('info', 'Все отметки сняты');
      },

      // ========== ЯРЛЫКИ ГРУПП (v5.0) ==========
      togglePinGroup: (groupId) => {
        set((state) => {
          const newSet = new Set(state.pinnedGroupIds);
          if (newSet.has(groupId)) {
            newSet.delete(groupId);
          } else {
            newSet.add(groupId);
          }
          return { pinnedGroupIds: newSet };
        });
      },

      copyGroupStructure: (sourceGroupId, targetGroupId) => {
        saveSnapshot(get());
        const sourceGroup = get().groups.find(g => g.id === sourceGroupId);
        if (!sourceGroup) return;

        const sourceChildren = get().groups.filter(g => g.parentId === sourceGroupId);
        const copies = sourceChildren.map(child => ({
          ...child,
          id: uuidv4(),
          parentId: targetGroupId,
        }));

        set((state) => ({
          groups: [...state.groups, ...copies],
        }));
        get().addLog('success', `Структура группы скопирована: ${copies.length} подгрупп`);
      },

      // ========== СНАПШОТЫ (v5.0) ==========
      createSnapshot: (name, description = '') => {
        const state = get();
        const snapshot = {
          id: uuidv4(),
          name,
          description,
          timestamp: Date.now(),
          data: {
            phrases: JSON.parse(JSON.stringify(state.phrases)),
            groups: JSON.parse(JSON.stringify(state.groups)),
            filters: { ...state.filters },
          },
        };

        set((state) => ({
          snapshots: [...state.snapshots, snapshot],
        }));

        get().addLog('success', `Снапшот создан: "${name}"`);
      },

      restoreSnapshot: (snapshotId) => {
        const snapshot = get().snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return;

        saveSnapshot(get());
        set({
          phrases: JSON.parse(JSON.stringify(snapshot.data.phrases)),
          groups: JSON.parse(JSON.stringify(snapshot.data.groups)),
          filters: { ...snapshot.data.filters },
          selectedPhraseIds: new Set(),
        });
        get().addLog('success', `Снапшот восстановлен: "${snapshot.name}"`);
      },

      deleteSnapshot: (snapshotId) => {
        const snapshot = get().snapshots.find(s => s.id === snapshotId);
        set((state) => ({
          snapshots: state.snapshots.filter(s => s.id !== snapshotId),
        }));
        if (snapshot) {
          get().addLog('warning', `Снапшот удален: "${snapshot.name}"`);
        }
      },

      // ========== ПРЕСЕТЫ ЭКСПОРТА (v5.0) ==========
      saveExportPreset: (preset) => {
        const newPreset = {
          ...preset,
          id: uuidv4(),
          created: Date.now(),
        };

        set((state) => ({
          exportPresets: [...state.exportPresets, newPreset],
        }));

        get().addLog('success', `Пресет экспорта сохранен: "${preset.name}"`);
      },

      loadExportPreset: (presetId) => {
        const preset = get().exportPresets.find(p => p.id === presetId);
        return preset;
      },

      deleteExportPreset: (presetId) => {
        const preset = get().exportPresets.find(p => p.id === presetId);
        set((state) => ({
          exportPresets: state.exportPresets.filter(p => p.id !== presetId),
        }));
        if (preset) {
          get().addLog('warning', `Пресет экспорта удален: "${preset.name}"`);
        }
      },

      // ========== ТЕГИ ФРАЗ (v5.0) ==========
      addPhraseTag: (name, color = '#6366f1') => {
        const newTag = {
          id: uuidv4(),
          name,
          color,
          created: Date.now(),
        };

        set((state) => ({
          phraseTags: [...state.phraseTags, newTag],
        }));

        get().addLog('success', `Тег добавлен: "${name}"`);
      },

      assignTagToPhrase: (phraseId, tagId) => {
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === phraseId 
              ? { ...p, tags: [...(p.tags || []), tagId] }
              : p
          ),
        }));
      },

      removeTagFromPhrase: (phraseId, tagId) => {
        set((state) => ({
          phrases: state.phrases.map(p => 
            p.id === phraseId 
              ? { ...p, tags: (p.tags || []).filter(t => t !== tagId) }
              : p
          ),
        }));
      },

      deletePhraseTag: (tagId) => {
        set((state) => ({
          phraseTags: state.phraseTags.filter(t => t.id !== tagId),
          phrases: state.phrases.map(p => ({
            ...p,
            tags: (p.tags || []).filter(t => t !== tagId),
          })),
        }));
        get().addLog('warning', 'Тег удален');
      },

      // ========== DnD ГРУПП (v5.0) ==========
      updateGroupParent: (groupId, parentId) => {
        saveSnapshot(get());
        
        set((state) => ({
          groups: state.groups.map(g => 
            g.id === groupId ? { ...g, parentId } : g
          ),
        }));
        
        const group = get().groups.find(g => g.id === groupId);
        const parent = parentId ? get().groups.find(g => g.id === parentId) : null;
        
        if (group) {
          const parentName = parent ? parent.name : 'Корень';
          get().addLog('success', `Группа "${group.name}" перемещена в "${parentName}"`);
        }
      },

      loadInitialData: async () => {
        const { isDataLoading } = get();
        if (isDataLoading) {
          return;
        }

        set({ isDataLoading: true, dataError: null });

        try {
          const [phraseResponse, groupRows] = await Promise.all([
            fetchPhrases({ limit: 1000 }),
            fetchGroups(),
          ]);

          const phraseItems = Array.isArray(phraseResponse?.items)
            ? phraseResponse.items
            : [];
          const nextCursor = phraseResponse?.nextCursor ?? null;

          set(() => ({
            phrases: phraseItems.map(mapPhraseFromDto),
            groups: groupRows.map(mapGroupFromDto),
            selectedPhraseIds: new Set(),
            activeGroupIds: new Set(),
            pinnedPhraseIds: new Set(),
            markedPhraseIds: new Set(),
            pinnedGroupIds: new Set(),
            isDataLoading: false,
            isDataLoaded: true,
            dataError: null,
            phrasesCursor: nextCursor,
          }));
        } catch (error) {
          set({
            isDataLoading: false,
            isDataLoaded: false,
            dataError: (error as Error).message || 'Не удалось загрузить данные',
            phrasesCursor: null,
          });
        }
      },

    }),
    {
      name: KEYSET_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      version: 1,
      partialize: (state) => ({
        stopwords: state.stopwords,
        filters: state.filters,
        savedFilters: state.savedFilters,
        columnVisibility: state.columnVisibility,
        columnOrder: state.columnOrder,
        columnPinning: state.columnPinning,
        viewTemplates: state.viewTemplates,
        searchMasks: state.searchMasks,
        phraseColors: state.phraseColors,
        groupColors: state.groupColors,
        // Новые поля для v5.0
        snapshots: state.snapshots,
        exportPresets: state.exportPresets,
        phraseTags: state.phraseTags,
        version: state.version,
        // Не сохраняем: selectedPhraseIds, selectedGroupId, activeGroupIds, activityLog, processProgress, pinnedPhraseIds, pinnedGroupIds, markedPhraseIds, footerStats
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[KeySet][store] Rehydration failed, clearing corrupted data', error);
          try {
            localStorage.removeItem(KEYSET_STORAGE_KEY);
          } catch (storageError) {
            console.error('[KeySet][store] Failed to remove corrupted store snapshot', storageError);
          }
          return;
        }
        if (state) {
          // Восстанавливаем Set из массива
          state.selectedPhraseIds = new Set();
          state.selectedGroupId = null;
          state.activeGroupIds = new Set();
          state.pinnedPhraseIds = new Set();
          state.markedPhraseIds = new Set(); // v5.0
          state.pinnedGroupIds = new Set(); // v5.0
          
          // Безопасная функция для восстановления данных
          const safeRestore = (key: string, fallback: any = null) => {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                return JSON.parse(data);
              }
            } catch (error) {
              console.warn(`Ошибка восстановления ${key}:`, error);
              localStorage.removeItem(key); // Очищаем поврежденные данные
            }
            return fallback;
          };
          
          // Восстанавливаем данные из localStorage если есть
          state.columnOrder = safeRestore('columnOrder', []);
          state.columnPinning = safeRestore('columnPinning', {});
          state.viewTemplates = safeRestore('viewTemplates', []);
          state.phraseColors = safeRestore('phraseColors', {});
          state.groupColors = safeRestore('groupColors', {});
          
          // Восстанавливаем Set из localStorage
          const safeRestoreSet = (key: string): Set<string> => {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const arr = JSON.parse(data);
                if (Array.isArray(arr)) {
                  return new Set(arr);
                }
              }
            } catch (error) {
              console.warn(`Ошибка восстановления Set ${key}:`, error);
              localStorage.removeItem(key);
            }
            return new Set();
          };
          
          state.pinnedPhraseIds = safeRestoreSet('pinnedPhraseIds');
          state.markedPhraseIds = safeRestoreSet('markedPhraseIds');
          state.pinnedGroupIds = safeRestoreSet('pinnedGroupIds');
          
          // Приветственное сообщение нужно откладывать, иначе React падает с error #185
          setTimeout(() => {
            if (state.addLog) {
              state.addLog('success', 'Данные загружены из localStorage');
            }
          }, 0);
        }
      },
    }
  )
);

