import React from 'react';
import { AlertCircle, Globe, Loader2, RefreshCw, Search, Target } from 'lucide-react';

import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  collectWordstat,
  fetchWordstatAccounts,
  fetchWordstatRegions,
  type WordstatAccount,
  type WordstatRegion,
} from '../../api/wordstat';
import type { WordstatResult } from '../../types';

const DEFAULT_REGION_ID = 225;

interface WordstatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordstatModal: React.FC<WordstatModalProps> = ({ isOpen, onClose }) => {
  const {
    phrases,
    selectedPhraseIds,
    addLog,
    setProcessProgress,
    resetProgress,
    applyWordstatResults,
    loadInitialData,
  } = useStore((state) => ({
    phrases: state.phrases,
    selectedPhraseIds: state.selectedPhraseIds,
    addLog: state.addLog,
    setProcessProgress: state.setProcessProgress,
    resetProgress: state.resetProgress,
    applyWordstatResults: state.applyWordstatResults,
    loadInitialData: state.loadInitialData,
  }));

  const safePhrases = Array.isArray(phrases) ? phrases : [];
  const safeSelectedIds =
    selectedPhraseIds instanceof Set
      ? selectedPhraseIds
      : new Set(Array.isArray(selectedPhraseIds) ? selectedPhraseIds : []);

  const [accounts, setAccounts] = React.useState<WordstatAccount[]>([]);
  const [regions, setRegions] = React.useState<WordstatRegion[]>([]);
  const [selectedAccount, setSelectedAccount] = React.useState<string>('');
  const [modes, setModes] = React.useState({ ws: true, qws: false, bws: false });
  const [selectedRegions, setSelectedRegions] = React.useState<Set<number>>(
    () => new Set([DEFAULT_REGION_ID])
  );
  const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const selectedIdsArray = React.useMemo(() => Array.from(safeSelectedIds), [safeSelectedIds]);
  const targetPhrases = React.useMemo(() => {
    const candidates =
      selectedIdsArray.length > 0
        ? safePhrases.filter((phrase) => safeSelectedIds.has(phrase.id))
        : safePhrases;
    const unique = new Set<string>();
    candidates.forEach((phrase) => {
      const cleaned = (phrase.text || '').trim();
      if (cleaned) {
        unique.add(cleaned);
      }
    });
    return Array.from(unique);
  }, [safePhrases, selectedIdsArray.length, safeSelectedIds]);

  const regionSelectionArray = React.useMemo(
    () => Array.from(selectedRegions),
    [selectedRegions]
  );

  const loadAccounts = React.useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const payload = await fetchWordstatAccounts();
      setAccounts(payload);
      if (payload.length && !selectedAccount) {
        setSelectedAccount(payload[0].name);
      }
    } catch (error) {
      setErrorMessage((error as Error).message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РєРєР°СѓРЅС‚С‹ Wordstat.');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [selectedAccount]);

  const loadRegions = React.useCallback(async () => {
    setIsLoadingRegions(true);
    try {
      const payload = await fetchWordstatRegions();
      setRegions(payload);
    } catch (error) {
      setErrorMessage((error as Error).message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµРіРёРѕРЅС‹ Wordstat.');
    } finally {
      setIsLoadingRegions(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    setErrorMessage(null);
    loadAccounts();
    loadRegions();
  }, [isOpen, loadAccounts, loadRegions]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setErrorMessage(null);
      resetProgress();
    }
  }, [isOpen, resetProgress]);

  const summaryPhrasesLabel =
    selectedIdsArray.length > 0
      ? `Р’С‹Р±СЂР°РЅРѕ ${selectedIdsArray.length} РёР· ${safePhrases.length}`
      : `Р’СЃРµ ${safePhrases.length}`;

  const selectedRegionObjects = React.useMemo(() => {
    if (!regions.length || selectedRegions.size === 0) {
      return [];
    }
    const map = new Map<number, WordstatRegion>();
    regions.forEach((region) => map.set(region.id, region));
    return Array.from(selectedRegions)
      .map((id) => map.get(id))
      .filter((value): value is WordstatRegion => Boolean(value));
  }, [regions, selectedRegions]);

  const handleStart = async () => {
    if (isSubmitting) return;

    if (!modes.ws && !modes.qws && !modes.bws) {
      setErrorMessage('Р’С‹Р±РµСЂРёС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ СЂРµР¶РёРј С‡Р°СЃС‚РѕС‚С‹.');
      return;
    }

    if (!selectedAccount) {
      setErrorMessage('Р’С‹Р±РµСЂРёС‚Рµ Р°РєРєР°СѓРЅС‚ Wordstat.');
      return;
    }

    if (targetPhrases.length === 0) {
      setErrorMessage('РќРµС‚ С„СЂР°Р· РґР»СЏ РїР°СЂСЃРёРЅРіР°. Р”РѕР±Р°РІСЊС‚Рµ РёР»Рё РІС‹РґРµР»РёС‚Рµ С„СЂР°Р·С‹ РІ С‚Р°Р±Р»РёС†Рµ.');
      return;
    }

    const regionsToSend = regionSelectionArray.length ? regionSelectionArray : [DEFAULT_REGION_ID];

    setIsSubmitting(true);
    setErrorMessage(null);
    setProcessProgress(10, 0, targetPhrases.length);

    try {
      const results: WordstatResult[] = await collectWordstat({
        phrases: targetPhrases,
        regions: regionsToSend,
        profile: selectedAccount,
        modes,
      });

      applyWordstatResults(results);
      await loadInitialData?.();
      setProcessProgress(100, targetPhrases.length, targetPhrases.length);
      addLog(
        'success',
        `Wordstat: РѕР±РЅРѕРІР»РµРЅС‹ С‡Р°СЃС‚РѕС‚С‹ РґР»СЏ ${results.length || 0} СЃС‚СЂРѕРє (Р°РєРєР°СѓРЅС‚ ${selectedAccount})`
      );
      onClose();
    } catch (error) {
      const message =
        (error as Error).message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ С‡Р°СЃС‚РѕС‚С‹ РёР· Wordstat. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.';
      setErrorMessage(message);
      addLog('error', message);
    } finally {
      resetProgress();
      setIsSubmitting(false);
    }
  };

  const toggleMode = (mode: 'ws' | 'qws' | 'bws') => {
    setModes((prev) => ({ ...prev, [mode]: !prev[mode] }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      title="РџР°СЂСЃРёРЅРі С‡Р°СЃС‚РѕС‚ (Yandex Wordstat)"
      size="lg"
      footer={
        <>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            РћС‚РјРµРЅР°
          </Button>
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={
              isSubmitting ||
              isLoadingAccounts ||
              !selectedAccount ||
              targetPhrases.length === 0 ||
              (!modes.ws && !modes.qws && !modes.bws)
            }
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isSubmitting ? 'РџР°СЂСЃРёРЅРі...' : 'Р—Р°РїСѓСЃС‚РёС‚СЊ РїР°СЂСЃРёРЅРі'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Р¤СЂР°Р·С‹</div>
            <div className="text-lg font-semibold text-gray-900">{summaryPhrasesLabel}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">РђРєРєР°СѓРЅС‚</div>
            <div className="text-lg font-semibold text-gray-900">
              {selectedAccount || 'РќРµ РІС‹Р±СЂР°РЅ'}
            </div>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Р РµРіРёРѕРЅС‹</div>
            <div className="text-lg font-semibold text-gray-900">
              {selectedRegions.size || 0} С€С‚.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Р РµР¶РёРјС‹ С‡Р°СЃС‚РѕС‚РЅРѕСЃС‚Рё</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox
              checked={modes.ws}
              onChange={() => toggleMode('ws')}
              label="WS (Р±РµР· РєР°РІС‹С‡РµРє)"
            />
            <Checkbox
              checked={modes.qws}
              onChange={() => toggleMode('qws')}
              label={'"WS" (РІ РєР°РІС‹С‡РєР°С…)'}
            />
            <Checkbox
              checked={modes.bws}
              onChange={() => toggleMode('bws')}
              label="!WS (С‚РѕС‡РЅС‹Р№)"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">РђРєРєР°СѓРЅС‚ Wordstat</span>
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadAccounts}
              disabled={isLoadingAccounts}
            >
              РћР±РЅРѕРІРёС‚СЊ
            </Button>
          </div>

          <div className="space-y-2">
            {isLoadingAccounts ? (
              <div className="h-10 animate-pulse rounded-md bg-gray-100" />
            ) : accounts.length === 0 ? (
              <div className="rounded-md border border-dashed border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                РќРµС‚ РґРѕСЃС‚СѓРїРЅС‹С… Р°РєРєР°СѓРЅС‚РѕРІ Wordstat. Р”РѕР±Р°РІСЊС‚Рµ РёС… РІ СЃС‚Р°СЂРѕРј РїСЂРёР»РѕР¶РµРЅРёРё Рё РѕР±РЅРѕРІРёС‚Рµ СЃРїРёСЃРѕРє.
              </div>
            ) : (
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={selectedAccount}
                onChange={(event) => setSelectedAccount(event.target.value)}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.name}>
                    {account.name} В· {account.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedAccount && (
            <p className="text-xs text-gray-500">
              РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РїСЂРѕС„РёР»СЊ В«{selectedAccount}В» Р°РІС‚РѕСЂРёР·РѕРІР°РЅ РІ Wordstat Рё РёРјРµРµС‚ СЃРІРµР¶РёРµ РєСѓРєРё.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" /> Р“РµРѕРіСЂР°С„РёСЏ Р·Р°РїСЂРѕСЃРѕРІ
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadRegions}
              disabled={isLoadingRegions}
            >
              РћР±РЅРѕРІРёС‚СЊ
            </Button>
          </div>

          <GeoRegionPicker
            regions={regions}
            isLoading={isLoadingRegions}
            selected={selectedRegions}
            onChange={(next) => setSelectedRegions(new Set(next))}
          />

          {selectedRegionObjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedRegionObjects.slice(0, 6).map((region) => (
                <span
                  key={region.id}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                >
                  {region.name}
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      const next = new Set(selectedRegions);
                      next.delete(region.id);
                      setSelectedRegions(next);
                    }}
                    aria-label={`РЈР±СЂР°С‚СЊ СЂРµРіРёРѕРЅ ${region.name}`}
                  >
                    Г—
                  </button>
                </span>
              ))}
              {selectedRegionObjects.length > 6 && (
                <span className="text-xs text-gray-500">
                  + {selectedRegionObjects.length - 6} РµС‰С‘
                </span>
              )}
            </div>
          )}
        </section>

        <section className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="flex items-start gap-2">
            <Target className="w-4 h-4 flex-shrink-0 text-blue-500 mt-0.5" />
            <span>
              Р’ РїР°СЂСЃРёРЅРі РїРѕРїР°РґСѓС‚{' '}
              <strong>
                {selectedIdsArray.length > 0
                  ? `${selectedIdsArray.length} РІС‹РґРµР»РµРЅРЅС‹С…`
                  : `${safePhrases.length} РІСЃРµС…`}
              </strong>{' '}
              С„СЂР°Р·. Р РµРіРёРѕРЅС‹: {selectedRegions.size || 1}, Р°РєРєР°СѓРЅС‚: {selectedAccount || 'РЅРµ РІС‹Р±СЂР°РЅ'}.
            </span>
          </p>
        </section>
      </div>
    </Modal>
  );
};

interface GeoRegionPickerProps {
  regions: WordstatRegion[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  isLoading: boolean;
}

const GeoRegionPicker: React.FC<GeoRegionPickerProps> = ({
  regions,
  selected,
  onChange,
  isLoading,
}) => {
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const structure = React.useMemo(() => {
    const byParent = new Map<number | null, WordstatRegion[]>();
    const parent = new Map<number, number | null>();
    const children = new Map<number, number[]>();

    regions.forEach((region) => {
      const key = region.parentId ?? null;
      if (!byParent.has(key)) {
        byParent.set(key, []);
      }
      byParent.get(key)!.push(region);

      parent.set(region.id, region.parentId ?? null);
      if (region.parentId != null) {
        if (!children.has(region.parentId)) {
          children.set(region.parentId, []);
        }
        children.get(region.parentId)!.push(region.id);
      }
    });

    byParent.forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }))
    );

    return { byParent, parent, children };
  }, [regions]);

  React.useEffect(() => {
    if (!regions.length) return;
    const autoExpanded = new Set<number>();
    regions.forEach((region) => {
      if (region.depth <= 1 && region.hasChildren) {
        autoExpanded.add(region.id);
      }
    });
    setExpanded(autoExpanded);
  }, [regions]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const dropDescendants = React.useCallback(
    (regionId: number, draft: Set<number>) => {
      const children = structure.children.get(regionId) || [];
      children.forEach((childId) => {
        draft.delete(childId);
        dropDescendants(childId, draft);
      });
    },
    [structure.children]
  );

  const dropAncestors = React.useCallback(
    (regionId: number, draft: Set<number>) => {
      let parentId = structure.parent.get(regionId) ?? null;
      while (parentId != null) {
        draft.delete(parentId);
        parentId = structure.parent.get(parentId) ?? null;
      }
    },
    [structure.parent]
  );

  const handleToggleRegion = (regionId: number, checked: boolean) => {
    const next = new Set(selected);
    if (checked) {
      next.add(regionId);
      dropDescendants(regionId, next);
      dropAncestors(regionId, next);
    } else {
      next.delete(regionId);
    }
    onChange(next);
  };

  const filteredRegions = React.useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return regions.filter(
      (region) =>
        region.name.toLowerCase().includes(term) ||
        region.path.toLowerCase().includes(term)
    );
  }, [regions, search]);

  const renderNodes = (parentId: number | null, depth = 0): React.ReactNode => {
    const nodes = structure.byParent.get(parentId) || [];
    return nodes.map((node) => {
      const hasChildren = (structure.byParent.get(node.id) || []).length > 0;
      const isExpanded = expanded.has(node.id);
      const isChecked = selected.has(node.id);

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-1"
            style={{ paddingLeft: depth * 16 }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-100"
              >
                {isExpanded ? 'в€’' : '+'}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Checkbox
              checked={isChecked}
              onChange={(event) => handleToggleRegion(node.id, event.target.checked)}
              label={node.name}
            />
          </div>
          {hasChildren && isExpanded && (
            <div>{renderNodes(node.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Globe className="w-4 h-4 text-gray-500" />
          Р’С‹Р±СЂР°РЅРѕ СЂРµРіРёРѕРЅРѕРІ: <strong className="text-gray-900">{selected.size}</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set([DEFAULT_REGION_ID]))}
          >
            Р РѕСЃСЃРёСЏ (225)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set())}
          >
            РћС‡РёСЃС‚РёС‚СЊ
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input
          placeholder="РџРѕРёСЃРє РїРѕ РЅР°Р·РІР°РЅРёСЋ РёР»Рё РїСѓС‚РёвЂ¦"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-md bg-gray-100" />
      ) : (
        <div className="h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
          {search.trim() ? (
            filteredRegions.length > 0 ? (
              filteredRegions.map((region) => (
                <label
                  key={region.id}
                  className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm last:border-none"
                >
                  <span>{region.path}</span>
                  <Checkbox
                    checked={selected.has(region.id)}
                    onChange={(event) => handleToggleRegion(region.id, event.target.checked)}
                  />
                </label>
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500">РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ.</div>
            )
          ) : (
            <div className="space-y-1 py-2">{renderNodes(null)}</div>
          )}
        </div>
      )}
    </div>
  );
};
