import React from 'react';
import { AlertCircle, ChevronRight, Globe, Loader2, RefreshCw, Search, Target } from 'lucide-react';

import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import {
  collectWordstat,
  fetchWordstatRegions,
  type WordstatRegion,
} from '../../api/wordstat';
import { enqueuePhrases } from '../../api/data';
import type { WordstatResult } from '../../types';

const DEFAULT_REGION_ID = 225;

interface WordstatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WordstatModal: React.FC<WordstatModalProps> = ({ isOpen, onClose }) => {
  const phrases = useStore((state) => state.phrases);
  const selectedPhraseIds = useStore((state) => state.selectedPhraseIds);
  const addLog = useStore((state) => state.addLog);
  const setProcessProgress = useStore((state) => state.setProcessProgress);
  const resetProgress = useStore((state) => state.resetProgress);
  const applyWordstatResults = useStore((state) => state.applyWordstatResults);
  const loadInitialData = useStore((state) => state.loadInitialData);

  const safePhrases = Array.isArray(phrases) ? phrases : [];
  const safeSelectedIds =
    selectedPhraseIds instanceof Set
      ? selectedPhraseIds
      : new Set(Array.isArray(selectedPhraseIds) ? selectedPhraseIds : []);

  const [regions, setRegions] = React.useState<WordstatRegion[]>([]);
  const [modes, setModes] = React.useState({ ws: true, qws: false, bws: false });
  const [selectedRegions, setSelectedRegions] = React.useState<Set<number>>(
    () => new Set([DEFAULT_REGION_ID])
  );
  const [isLoadingRegions, setIsLoadingRegions] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [phraseInput, setPhraseInput] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadInfo, setUploadInfo] = React.useState<{ submitted: number; inserted: number } | null>(
    null
  );

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

  const loadRegions = React.useCallback(async () => {
    setIsLoadingRegions(true);
    try {
      const payload = await fetchWordstatRegions();
      setRegions(payload);
    } catch (error) {
      setErrorMessage((error as Error).message || 'Не удалось загрузить регионы Wordstat.');
    } finally {
      setIsLoadingRegions(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    setErrorMessage(null);
    loadRegions();
  }, [isOpen, loadRegions]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setErrorMessage(null);
      resetProgress();
      setPhraseInput('');
      setUploadInfo(null);
    }
  }, [isOpen, resetProgress]);

  const summaryPhrasesLabel =
    selectedIdsArray.length > 0
      ? `Выбрано ${selectedIdsArray.length} из ${safePhrases.length}`
      : `Все ${safePhrases.length}`;

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

  const parsedInputPhrases = React.useMemo(() => {
    return Array.from(
      new Set(
        phraseInput
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      )
    );
  }, [phraseInput]);

  const handleUploadPhrases = React.useCallback(async () => {
    if (!parsedInputPhrases.length) {
      setErrorMessage('Введите ключевые фразы перед загрузкой.');
      return;
    }
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const { inserted } = await enqueuePhrases({ phrases: parsedInputPhrases });
      await loadInitialData?.();
      setPhraseInput('');
      setUploadInfo({ submitted: parsedInputPhrases.length, inserted });
      addLog(
        'success',
        `В очередь добавлено ${inserted} фраз${inserted !== parsedInputPhrases.length ? ` (из ${parsedInputPhrases.length})` : ''}.`
      );
    } catch (error) {
      const message = (error as Error).message || 'Не удалось загрузить фразы.';
      setErrorMessage(message);
      addLog('error', message);
    } finally {
      setIsUploading(false);
    }
  }, [parsedInputPhrases, loadInitialData, addLog]);

  const hasInputPhrases = parsedInputPhrases.length > 0;

  const handleStart = async () => {
    if (isSubmitting) return;

    if (!modes.ws && !modes.qws && !modes.bws) {
      setErrorMessage('Выберите хотя бы один режим частоты.');
      return;
    }

    if (targetPhrases.length === 0) {
      setErrorMessage('Нет фраз для парсинга. Добавьте или выделите фразы в таблице.');
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
        modes,
      });

      applyWordstatResults(results);
      await loadInitialData?.();
      setProcessProgress(100, targetPhrases.length, targetPhrases.length);
      addLog(
        'success',
        `Wordstat: обновлены частоты для ${results.length || 0} строк`
      );
      onClose();
    } catch (error) {
      const message =
        (error as Error).message || 'Не удалось получить частоты из Wordstat. Попробуйте позже.';
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
      title="Парсинг частот (Yandex Wordstat)"
      size="lg"
      footer={
        <>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={
              isSubmitting ||
              isUploading ||
              targetPhrases.length === 0 ||
              (!modes.ws && !modes.qws && !modes.bws)
            }
            icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {isSubmitting ? 'Парсинг...' : 'Запустить парсинг'}
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
            <div className="text-xs uppercase text-gray-500">Фразы</div>
            <div className="text-lg font-semibold text-gray-900">{summaryPhrasesLabel}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Регионы</div>
            <div className="text-lg font-semibold text-gray-900">
              {selectedRegions.size || 0} шт.
            </div>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs uppercase text-gray-500">Новые ключи</div>
            <div className="text-lg font-semibold text-gray-900">
              {parsedInputPhrases.length}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Режимы частотности</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Checkbox
              checked={modes.ws}
              onChange={() => toggleMode('ws')}
              label="WS (без кавычек)"
            />
            <Checkbox
              checked={modes.qws}
              onChange={() => toggleMode('qws')}
              label={'"WS" (в кавычках)'}
            />
            <Checkbox
              checked={modes.bws}
              onChange={() => toggleMode('bws')}
              label="!WS (точный)"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Загрузка ключей</span>
            {uploadInfo && (
              <span className="text-xs text-gray-500">
                Последняя загрузка: {uploadInfo.inserted}/{uploadInfo.submitted}
              </span>
            )}
          </div>

          <Textarea
            label="Новые фразы (по одной на строку)"
            rows={5}
            value={phraseInput}
            onChange={(event) => setPhraseInput(event.target.value)}
            placeholder={`купить диван недорого\nпошив штор на заказ\nаренда генератора`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleUploadPhrases}
              disabled={!hasInputPhrases || isUploading}
              icon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isUploading ? 'Загрузка...' : 'Добавить в очередь'}
            </Button>
            <span className="text-xs text-gray-500">
              Ключи автоматически появятся в центральной таблице и будут обработаны при запуске парсинга.
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" /> География запросов
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadRegions}
              disabled={isLoadingRegions}
            >
              Обновить
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
                    aria-label={`Убрать регион ${region.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedRegionObjects.length > 6 && (
                <span className="text-xs text-gray-500">
                  + {selectedRegionObjects.length - 6} ещё
                </span>
              )}
            </div>
          )}
        </section>

        <section className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="flex items-start gap-2">
            <Target className="w-4 h-4 flex-shrink-0 text-blue-500 mt-0.5" />
            <span>
              В парсинг попадут{' '}
              <strong>
                {selectedIdsArray.length > 0
                  ? `${selectedIdsArray.length} выбранных`
                  : `${safePhrases.length} всех`}
              </strong>{' '}
              фраз. Регионы: {selectedRegions.size || 1}. Все доступные аккаунты будут задействованы автоматически.
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
   const nodeRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

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

  const ensureExpanded = React.useCallback(
    (regionId: number) => {
      const next = new Set(expanded);
      let cursor: number | null | undefined = regionId;
      while (cursor) {
        const parentId = structure.parent.get(cursor);
        if (parentId === undefined) {
          break;
        }
        if (parentId !== null) {
          next.add(parentId);
        }
        cursor = parentId;
      }
      setExpanded(next);
      requestAnimationFrame(() => {
        const element = nodeRefs.current[regionId];
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [expanded, structure.parent]
  );

  const renderNodes = (parentId: number | null, depth = 0): React.ReactNode => {
    const nodes = structure.byParent.get(parentId) || [];
    return nodes.map((node) => {
      const hasChildren = (structure.byParent.get(node.id) || []).length > 0;
      const isExpanded = expanded.has(node.id);
      const isChecked = selected.has(node.id);

      return (
        <div
          key={node.id}
          ref={(el) => {
            nodeRefs.current[node.id] = el;
          }}
        >
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
                {isExpanded ? '−' : '+'}
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
          Выбрано регионов: <strong className="text-gray-900">{selected.size}</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set([DEFAULT_REGION_ID]))}
          >
            Россия (225)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set([159]))}
          >
            Казахстан (159)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set([149]))}
          >
            Беларусь (149)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange(new Set())}
          >
            Очистить
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input
          placeholder="Поиск по названию или пути…"
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
              <div
                key={region.id}
                className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-none"
              >
                <button
                  type="button"
                  className="flex items-center gap-2 text-left text-gray-700 hover:text-gray-900"
                  onClick={() => ensureExpanded(region.id)}
                >
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  <span>{region.path}</span>
                </button>
                <Checkbox
                  checked={selected.has(region.id)}
                  onChange={(event) => handleToggleRegion(region.id, event.target.checked)}
                />
              </div>
            ))
            ) : (
              <div className="p-4 text-sm text-gray-500">Ничего не найдено.</div>
            )
          ) : (
            <div className="space-y-1 py-2">{renderNodes(null)}</div>
          )}
        </div>
      )}
    </div>
  );
};
