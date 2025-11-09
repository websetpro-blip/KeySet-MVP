// Типы данных для KeySet приложения

export interface PhraseHistoryEntry {
  timestamp: number;
  action: 'created' | 'edited' | 'moved' | 'colored' | 'locked' | 'unlocked';
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface Phrase {
  id: string;
  text: string;
  ws: number; // базовая частота Wordstat
  qws: number; // частота в кавычках
  bws: number; // частота с "!"
  status: 'pending' | 'done' | 'error' | 'success';
  groupId: string | null;
  createdAt: number;
  color?: string;
  locked?: boolean;
  hasStopword?: boolean;
  dateAdded?: number;
  history?: PhraseHistoryEntry[];
  pinned?: boolean;
  linkedGroups?: string[];
  tags?: string[]; // v5.0 - теги фраз
  minusTerms?: string[]; // v5.0 - минус-слова для фразы
}

export interface Group {
  id: string;
  name: string;
  parentId: string | null;
  children?: Group[];
  collapsed?: boolean;
  type?: 'normal' | 'mask' | 'stopwords' | 'frequency';
  color?: string;
  locked?: boolean;
  comment?: string;
  phraseCount?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// Стоп-слова с типами вхождения
export interface Stopword {
  id: string;
  text: string;
  matchType: 'exact' | 'partial' | 'independent';
  useMorphology: boolean;
  category: 'ГЕО' | 'КОММЕРЧЕСКИЕ' | 'ИНФОРМАЦИОННЫЕ';
}

// Фильтры
export interface Filter {
  wsMin?: number;
  wsMax?: number;
  qwsMin?: number;
  qwsMax?: number;
  bwsMin?: number;
  bwsMax?: number;
  lengthMin?: number;
  lengthMax?: number;
  wordCountMin?: number;
  wordCountMax?: number;
  contains?: string;
  notContains?: string;
  startsWith?: string;
  endsWith?: string;
  showOnlyHighFreq?: boolean;
  showOnlyLowFreq?: boolean;
  showOnlyZeroFreq?: boolean;
  showOnlyDuplicates?: boolean;
  showOnlyWithStopwords?: boolean;
  showOnlySelected?: boolean;
}

// Сохранённые фильтры
export interface SavedFilter {
  id: string;
  name: string;
  filter: Filter;
}

// Видимость столбцов
export interface ColumnVisibility {
  phrase: boolean;
  ws: boolean;
  qws: boolean;
  bws: boolean;
  status: boolean;
  dateAdded: boolean;
}

// Шаблоны видов
export interface ViewTemplate {
  id: string;
  name: string;
  columnVisibility: ColumnVisibility;
  columnOrder: string[];
  columnPinning: { left?: string[]; right?: string[] };
  sorting: Array<{ id: string; desc: boolean }>;
}

// Маски поиска
export interface SearchMask {
  id: string;
  name: string;
  url: string; // {QUERY} будет заменен на запрос
}

export interface AppState {
  // Данные
  phrases: Phrase[];
  groups: Group[];
  stopwords: Stopword[];
  
  // Фильтры и настройки
  filters: Filter;
  savedFilters: SavedFilter[];
  columnVisibility: ColumnVisibility;
  
  // UI состояние
  selectedPhraseIds: Set<string>;
  selectedGroupId: string | null;
  activeGroupIds: Set<string>; // Мульти-группа
  activityLog: LogEntry[];
  
  // Прогресс операций
  processProgress: number;
  processCurrent: number;
  processTotal: number;
  
  // История для undo/redo
  history: {
    past: AppState[];
    present: AppState;
    future: AppState[];
  };
  
  // Новые настройки таблицы
  columnOrder: string[];
  columnPinning: { left?: string[]; right?: string[] };
  viewTemplates: ViewTemplate[];
  searchMasks: SearchMask[];
  
  // Цветовая маркировка
  phraseColors: Record<string, string>;
  groupColors: Record<string, string>;
  
  // Закрепленные строки
  pinnedPhraseIds: Set<string>;
  
  // Статистика футера
  footerStats: Record<string, { sum: number; avg: number; count: number }>;
  
  // Версия для миграций
  version: number;
  
  // v5.0 - Маркировка и закрепление групп
  markedPhraseIds: Set<string>;
  pinnedGroupIds: Set<string>;
  snapshots: Snapshot[];
  exportPresets: ExportPreset[];
  phraseTags: PhraseTag[];
}

// Действия для фраз
export interface PhraseActions {
  addPhrases: (phrases: Omit<Phrase, 'id' | 'createdAt'>[]) => void;
  updatePhrase: (id: string, updates: Partial<Phrase>) => void;
  deletePhrases: (ids: string[]) => void;
  clearPhrases: () => void;
  setPhrases: (phrases: Phrase[]) => void;
  
  // Выделение
  selectPhrase: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
}

// Действия для групп
export interface GroupActions {
  addGroup: (name: string, parentId?: string | null) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  selectGroup: (id: string | null) => void;
  movePhrases: (phraseIds: string[], groupId: string | null) => void;
}

// Действия для стоп-слов
export interface StopwordActions {
  addStopwords: (words: string[]) => void;
  removeStopword: (word: string) => void;
  clearStopwords: () => void;
  addStopword: (stopword: Stopword) => void;
  deleteStopword: (id: string) => void;
  updateStopword: (id: string, updates: Partial<Stopword>) => void;
  markStopwordPhrases: () => string[];
  deleteStopwordPhrases: () => number;
}

// Действия для фильтров
export interface FilterActions {
  setFilters: (filters: Partial<Filter>) => void;
  clearFilters: () => void;
  saveCurrentFilter: (name: string) => void;
  applyFilter: (id: string) => void;
  deleteSavedFilter: (id: string) => void;
}

// Действия для столбцов
export interface ColumnActions {
  setColumnVisibility: (visibility: Partial<ColumnVisibility>) => void;
}

// Действия для прогресса
export interface ProcessActions {
  setProcessProgress: (progress: number, current: number, total: number) => void;
  resetProgress: () => void;
}

// Расширенные действия для фраз
export interface ExtendedPhraseActions {
  editPhrase: (id: string, text: string) => void;
  markRowColor: (id: string, color: string) => void;
  toggleRowLock: (id: string) => void;
  deleteSelectedPhrases: (ids: string[]) => void;
  movePhrasesToGroup: (ids: string[], groupId: string) => void;
  copyPhrasesToGroup: (ids: string[], groupId: string) => void;
}

// Действия для журнала
export interface LogActions {
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLog: () => void;
}

// Undo/Redo
export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Экспорт/импорт
export interface ExportFormat {
  type: 'csv' | 'xlsx' | 'txt';
  scope: 'all' | 'selected' | 'group';
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
}

// Поиск дублей
export interface DuplicateGroup {
  original: Phrase;
  duplicates: Phrase[];
  type: 'exact' | 'fuzzy';
}

// Дополнительные действия для новых функций
export interface ExtendedTableActions {
  // Мульти-группа
  toggleActiveGroup: (groupId: string) => void;
  clearActiveGroups: () => void;
  
  // Колонки
  setColumnOrder: (order: string[]) => void;
  setColumnPinning: (pinning: { left?: string[]; right?: string[] }) => void;
  
  // Шаблоны видов
  saveViewTemplate: (name: string) => void;
  loadViewTemplate: (templateId: string) => void;
  deleteViewTemplate: (templateId: string) => void;
  
  // Маски поиска
  addSearchMask: (mask: SearchMask) => void;
  removeSearchMask: (maskId: string) => void;
  
  // Цветовая маркировка
  markPhraseColor: (phraseId: string, color: string) => void;
  setGroupColor: (groupId: string, color: string) => void;
  
  // Закрепление фраз
  togglePinPhrase: (phraseId: string) => void;
  
  // Статистика футера
  updateFooterStats: (columnId: string, stats: { sum: number; avg: number; count: number }) => void;
}

// Комбинированный тип Store
export type KeySetStore = AppState & 
  PhraseActions & 
  GroupActions & 
  StopwordActions & 
  LogActions & 
  HistoryActions &
  FilterActions &
  ColumnActions &
  ProcessActions &
  ExtendedPhraseActions &
  ExtendedTableActions;


// ========== V5.0 НОВЫЕ ТИПЫ ==========

// Снапшот состояния
export interface Snapshot {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  data: {
    phrases: Phrase[];
    groups: Group[];
    filters: Filter;
  };
}

// Пресет экспорта
export interface ExportPreset {
  id: string;
  name: string;
  columns: string[];
  includeGroupPath: boolean;
  csvDelimiter: ';' | ',' | '\t';
  encoding: 'utf-8' | 'windows-1251';
  created?: number;
}

// Теги для фраз
export interface PhraseTag {
  id: string;
  name: string;
  color: string;
  created: number;
}

// Действия для v5.0
export interface V5Actions {
  // Маркировка фраз (отдельно от выделения)
  toggleMarkPhrase: (phraseId: string) => void;
  markAllPhrases: () => void;
  unmarkAllPhrases: () => void;
  invertMarkedPhrases: () => void;
  markPhrasesByFilter: () => void;
  
  // Закрепление групп (ярлыки)
  togglePinGroup: (groupId: string) => void;
  
  // DnD групп
  updateGroupParent: (groupId: string, parentId: string | null) => void;
  copyGroupStructure: (groupId: string, targetGroupId: string) => void;
  
  // Снапшоты
  createSnapshot: (name: string, description?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  
  // Пресеты экспорта
  saveExportPreset: (preset: Omit<ExportPreset, 'id' | 'created'>) => void;
  loadExportPreset: (presetId: string) => ExportPreset | undefined;
  deleteExportPreset: (presetId: string) => void;
  
  // Теги фраз
  addPhraseTag: (name: string, color?: string) => void;
  assignTagToPhrase: (phraseId: string, tagId: string) => void;
  removeTagFromPhrase: (phraseId: string, tagId: string) => void;
  deletePhraseTag: (tagId: string) => void;
}

// Обновляем KeySetStore
export type KeySetStoreV5 = AppState & 
  PhraseActions & 
  GroupActions & 
  StopwordActions & 
  LogActions & 
  HistoryActions &
  FilterActions &
  ColumnActions &
  ProcessActions &
  ExtendedPhraseActions &
  ExtendedTableActions &
  V5Actions;
