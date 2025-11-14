const STORAGE_VERSION_KEY = 'keyset-storage-version';
const STORAGE_VERSION = '2025-11-11';
const PERSISTED_STORE_KEY = 'keyset-store';

const RELATED_KEYS = [
  PERSISTED_STORE_KEY,
  'columnOrder',
  'columnPinning',
  'viewTemplates',
  'phraseColors',
  'groupColors',
  'pinnedPhraseIds',
  'markedPhraseIds',
  'pinnedGroupIds',
];

const dropPersistedState = (reason: string) => {
  try {
    const removed: string[] = [];
    for (const key of RELATED_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    }
    console.warn('[KeySet][startup] Cleared persisted UI state:', {
      reason,
      removed,
    });
  } catch (error) {
    console.error('[KeySet][startup] Failed to clear corrupted storage', error);
  }
};

const validateJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

(() => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version && version !== STORAGE_VERSION) {
      dropPersistedState(`version-mismatch ${version} -> ${STORAGE_VERSION}`);
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      return;
    }

    const snapshot = localStorage.getItem(PERSISTED_STORE_KEY);
    if (!snapshot) {
      return;
    }

    if (!validateJSON(snapshot)) {
      dropPersistedState('invalid-json');
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      return;
    }
  } catch (error) {
    console.error('[KeySet][startup] Storage guard failed', error);
    dropPersistedState('guard-error');
  }
})();
