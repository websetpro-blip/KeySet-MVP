// РўРёРїС‹ РґР°РЅРЅС‹С… РґР»СЏ KeySet РїСЂРёР»РѕР¶РµРЅРёСЏ

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
  ws: number; // Р±Р°Р·РѕРІР°СЏ С‡Р°СЃС‚РѕС‚Р° Wordstat
  qws: number; // С‡Р°СЃС‚РѕС‚Р° РІ РєР°РІС‹С‡РєР°С…
  bws: number; // С‡Р°СЃС‚РѕС‚Р° СЃ "!"
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
  tags?: string[]; // v5.0 - С‚РµРіРё С„СЂР°Р·
  minusTerms?: string[]; // v5.0 - РјРёРЅСѓСЃ-СЃР»РѕРІР° РґР»СЏ С„СЂР°Р·С‹
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

// РЎС‚РѕРї-СЃР»РѕРІР° СЃ С‚РёРїР°РјРё РІС…РѕР¶РґРµРЅРёСЏ
export interface Stopword {
  id: string;
  text: string;
  matchType: 'exact' | 'partial' | 'independent';
  useMorphology: boolean;
  category: 'ГЕО' | 'КОММЕРЧЕСКИЕ' | 'ИНФОРМАЦИОННЫЕ';
}

// Р¤РёР»СЊС‚СЂС‹
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

// РЎРѕС…СЂР°РЅС‘РЅРЅС‹Рµ С„РёР»СЊС‚СЂС‹
export interface SavedFilter {
  id: string;
  name: string;
  filter: Filter;
}

// Р’РёРґРёРјРѕСЃС‚СЊ СЃС‚РѕР»Р±С†РѕРІ
export interface ColumnVisibility {
  phrase: boolean;
  ws: boolean;
  qws: boolean;
  bws: boolean;
  status: boolean;
  dateAdded: boolean;
}

// РЁР°Р±Р»РѕРЅС‹ РІРёРґРѕРІ
export interface ViewTemplate {
  id: string;
  name: string;
  columnVisibility: ColumnVisibility;
  columnOrder: string[];
  columnPinning: { left?: string[]; right?: string[] };
  sorting: Array<{ id: string; desc: boolean }>;
}

// РњР°СЃРєРё РїРѕРёСЃРєР°
export interface SearchMask {
  id: string;
  name: string;
  url: string; // {QUERY} Р±СѓРґРµС‚ Р·Р°РјРµРЅРµРЅ РЅР° Р·Р°РїСЂРѕСЃ
}

export interface AppState {
  // Р”Р°РЅРЅС‹Рµ
  phrases: Phrase[];
  groups: Group[];
  stopwords: Stopword[];
  isDataLoaded: boolean;
  isDataLoading: boolean;
  dataError: string | null;
  phrasesCursor: number | null;
  
  // Р¤РёР»СЊС‚СЂС‹ Рё РЅР°СЃС‚СЂРѕР№РєРё
  filters: Filter;
  savedFilters: SavedFilter[];
  columnVisibility: ColumnVisibility;
  
  // UI СЃРѕСЃС‚РѕСЏРЅРёРµ
  selectedPhraseIds: Set<string>;
  selectedGroupId: string | null;
  activeGroupIds: Set<string>; // РњСѓР»СЊС‚Рё-РіСЂСѓРїРїР°
  activityLog: LogEntry[];
  
  // РџСЂРѕРіСЂРµСЃСЃ РѕРїРµСЂР°С†РёР№
  processProgress: number;
  processCurrent: number;
  processTotal: number;
  
  // РСЃС‚РѕСЂРёСЏ РґР»СЏ undo/redo
  history: {
    past: AppState[];
    present: AppState;
    future: AppState[];
  };
  
  // РќРѕРІС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё С‚Р°Р±Р»РёС†С‹
  columnOrder: string[];
  columnPinning: { left?: string[]; right?: string[] };
  viewTemplates: ViewTemplate[];
  searchMasks: SearchMask[];
  
  // Р¦РІРµС‚РѕРІР°СЏ РјР°СЂРєРёСЂРѕРІРєР°
  phraseColors: Record<string, string>;
  groupColors: Record<string, string>;
  
  // Р—Р°РєСЂРµРїР»РµРЅРЅС‹Рµ СЃС‚СЂРѕРєРё
  pinnedPhraseIds: Set<string>;
  
  // РЎС‚Р°С‚РёСЃС‚РёРєР° С„СѓС‚РµСЂР°
  footerStats: Record<string, { sum: number; avg: number; count: number }>;
  
  // Р’РµСЂСЃРёСЏ РґР»СЏ РјРёРіСЂР°С†РёР№
  version: number;
  
  // v5.0 - РњР°СЂРєРёСЂРѕРІРєР° Рё Р·Р°РєСЂРµРїР»РµРЅРёРµ РіСЂСѓРїРї
  markedPhraseIds: Set<string>;
  pinnedGroupIds: Set<string>;
  snapshots: Snapshot[];
  exportPresets: ExportPreset[];
  phraseTags: PhraseTag[];
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ С„СЂР°Р·
export interface PhraseActions {
  addPhrases: (phrases: Omit<Phrase, 'id' | 'createdAt'>[]) => Promise<void> | void;
  updatePhrase: (id: string, updates: Partial<Phrase>) => void;
  deletePhrases: (ids: string[]) => Promise<void> | void;
  clearPhrases: () => Promise<void> | void;
  setPhrases: (phrases: Phrase[]) => void;
  
  // Р’С‹РґРµР»РµРЅРёРµ
  selectPhrase: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ РіСЂСѓРїРї
export interface GroupActions {
  addGroup: (name: string, parentId?: string | null) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  selectGroup: (id: string | null) => void;
  movePhrases: (phraseIds: string[], groupId: string | null) => void;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ СЃС‚РѕРї-СЃР»РѕРІ
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

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ С„РёР»СЊС‚СЂРѕРІ
export interface FilterActions {
  setFilters: (filters: Partial<Filter>) => void;
  clearFilters: () => void;
  saveCurrentFilter: (name: string) => void;
  applyFilter: (id: string) => void;
  deleteSavedFilter: (id: string) => void;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ СЃС‚РѕР»Р±С†РѕРІ
export interface ColumnActions {
  setColumnVisibility: (visibility: Partial<ColumnVisibility>) => void;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ РїСЂРѕРіСЂРµСЃСЃР°
export interface ProcessActions {
  setProcessProgress: (progress: number, current: number, total: number) => void;
  resetProgress: () => void;
}

// Р Р°СЃС€РёСЂРµРЅРЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РґР»СЏ С„СЂР°Р·
export interface ExtendedPhraseActions {
  editPhrase: (id: string, text: string) => void;
  markRowColor: (id: string, color: string) => void;
  toggleRowLock: (id: string) => void;
  deleteSelectedPhrases: (ids: string[]) => Promise<void> | void;
  movePhrasesToGroup: (ids: string[], groupId: string | null) => Promise<void> | void;
  copyPhrasesToGroup: (ids: string[], groupId: string) => void;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ Р¶СѓСЂРЅР°Р»Р°
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

// Р­РєСЃРїРѕСЂС‚/РёРјРїРѕСЂС‚
export interface ExportFormat {
  type: 'csv' | 'xlsx' | 'txt';
  scope: 'all' | 'selected' | 'group';
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
}

// РџРѕРёСЃРє РґСѓР±Р»РµР№
export interface DuplicateGroup {
  original: Phrase;
  duplicates: Phrase[];
  type: 'exact' | 'fuzzy';
}

// Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РґР»СЏ РЅРѕРІС‹С… С„СѓРЅРєС†РёР№
export interface ExtendedTableActions {
  // РњСѓР»СЊС‚Рё-РіСЂСѓРїРїР°
  toggleActiveGroup: (groupId: string) => void;
  clearActiveGroups: () => void;
  
  // РљРѕР»РѕРЅРєРё
  setColumnOrder: (order: string[]) => void;
  setColumnPinning: (pinning: { left?: string[]; right?: string[] }) => void;
  
  // РЁР°Р±Р»РѕРЅС‹ РІРёРґРѕРІ
  saveViewTemplate: (name: string) => void;
  loadViewTemplate: (templateId: string) => void;
  deleteViewTemplate: (templateId: string) => void;
  
  // РњР°СЃРєРё РїРѕРёСЃРєР°
  addSearchMask: (mask: SearchMask) => void;
  removeSearchMask: (maskId: string) => void;
  
  // Р¦РІРµС‚РѕРІР°СЏ РјР°СЂРєРёСЂРѕРІРєР°
  markPhraseColor: (phraseId: string, color: string) => void;
  setGroupColor: (groupId: string, color: string) => void;
  
  // Р—Р°РєСЂРµРїР»РµРЅРёРµ С„СЂР°Р·
  togglePinPhrase: (phraseId: string) => void;
  
  // РЎС‚Р°С‚РёСЃС‚РёРєР° С„СѓС‚РµСЂР°
  updateFooterStats: (columnId: string, stats: { sum: number; avg: number; count: number }) => void;
}

export interface WordstatResult {
  phrase: string;
  ws?: number | null;
  qws?: number | null;
  bws?: number | null;
  status?: string;
  region?: number | null;
}

export interface WordstatActions {
  applyWordstatResults: (rows: WordstatResult[]) => void;
}

export interface DataActions {
  loadInitialData: () => Promise<void>;
}

// РљРѕРјР±РёРЅРёСЂРѕРІР°РЅРЅС‹Р№ С‚РёРї Store
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
  ExtendedTableActions &
  WordstatActions &
  DataActions;


// ========== V5.0 РќРћР’Р«Р• РўРРџР« ==========

// РЎРЅР°РїС€РѕС‚ СЃРѕСЃС‚РѕСЏРЅРёСЏ
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

// РџСЂРµСЃРµС‚ СЌРєСЃРїРѕСЂС‚Р°
export interface ExportPreset {
  id: string;
  name: string;
  columns: string[];
  includeGroupPath: boolean;
  csvDelimiter: ';' | ',' | '\t';
  encoding: 'utf-8' | 'windows-1251';
  created?: number;
}

// РўРµРіРё РґР»СЏ С„СЂР°Р·
export interface PhraseTag {
  id: string;
  name: string;
  color: string;
  created: number;
}

// Р”РµР№СЃС‚РІРёСЏ РґР»СЏ v5.0
export interface V5Actions {
  // РњР°СЂРєРёСЂРѕРІРєР° С„СЂР°Р· (РѕС‚РґРµР»СЊРЅРѕ РѕС‚ РІС‹РґРµР»РµРЅРёСЏ)
  toggleMarkPhrase: (phraseId: string) => void;
  markAllPhrases: () => void;
  unmarkAllPhrases: () => void;
  invertMarkedPhrases: () => void;
  markPhrasesByFilter: () => void;
  
  // Р—Р°РєСЂРµРїР»РµРЅРёРµ РіСЂСѓРїРї (СЏСЂР»С‹РєРё)
  togglePinGroup: (groupId: string) => void;
  
  // DnD РіСЂСѓРїРї
  updateGroupParent: (groupId: string, parentId: string | null) => void;
  copyGroupStructure: (groupId: string, targetGroupId: string) => void;
  
  // РЎРЅР°РїС€РѕС‚С‹
  createSnapshot: (name: string, description?: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  
  // РџСЂРµСЃРµС‚С‹ СЌРєСЃРїРѕСЂС‚Р°
  saveExportPreset: (preset: Omit<ExportPreset, 'id' | 'created'>) => void;
  loadExportPreset: (presetId: string) => ExportPreset | undefined;
  deleteExportPreset: (presetId: string) => void;
  
  // РўРµРіРё С„СЂР°Р·
  addPhraseTag: (name: string, color?: string) => void;
  assignTagToPhrase: (phraseId: string, tagId: string) => void;
  removeTagFromPhrase: (phraseId: string, tagId: string) => void;
  deletePhraseTag: (tagId: string) => void;
}

// РћР±РЅРѕРІР»СЏРµРј KeySetStore
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
  WordstatActions &
  V5Actions &
  DataActions;


