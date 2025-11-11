import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PhrasesTable } from './components/PhrasesTable/PhrasesTable';
import { GroupsPanel } from './components/GroupsPanel/GroupsPanel';
import { ActivityLog } from './components/ActivityLog/ActivityLog';
import { StatusBar } from './components/StatusBar';
import { ImportModal } from './components/Modals/ImportModal';
import { ExportModal } from './components/Modals/ExportModal';
import { DuplicatesModal } from './components/Modals/DuplicatesModal';
import { StopwordsManagerModal } from './components/Modals/StopwordsManagerModal';
import { AdvancedFiltersModal } from './components/Modals/AdvancedFiltersModal';
import { ColumnSettingsModal } from './components/Modals/ColumnSettingsModal';
import { StatisticsModal } from './components/Modals/StatisticsModal';
import { FindReplaceModal } from './components/Modals/FindReplaceModal';
import { PhraseHistoryModal } from './components/Modals/PhraseHistoryModal';
import { SimilarPhrasesModal } from './components/Modals/SimilarPhrasesModal';
import { AutomationSchedulerModal } from './components/Modals/AutomationSchedulerModal';
import { GroupTypeManagerModal } from './components/Modals/GroupTypeManagerModal';
import { ViewTemplatesModal } from './components/Modals/ViewTemplatesModal';
import { CrossMinusationModal } from './components/Modals/CrossMinusationModal';
import { MorphDuplicatesModal } from './components/Modals/MorphDuplicatesModal';
import { DataQualityModal } from './components/Modals/DataQualityModal';
import PipelinesModal from './components/Modals/PipelinesModal';
import ExportPresetsModal from './components/Modals/ExportPresetsModal';
import SnapshotsModal from './components/Modals/SnapshotsModal';
import TagsModal from './components/Modals/TagsModal';
import { MassBulkPanel } from './components/MassBulkPanel';
import { useStore } from './store/useStore';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';

const LazyWordstatModal = React.lazy(() =>
  import('./components/Modals/WordstatModal').then((mod) => ({
    default: mod.WordstatModal,
  })),
);

function App() {
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = React.useState(false);
  const [isStopwordsModalOpen, setIsStopwordsModalOpen] = React.useState(false);
  const [isWordstatModalOpen, setIsWordstatModalOpen] = React.useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = React.useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = React.useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = React.useState(false);
  const [phraseHistoryId, setPhraseHistoryId] = React.useState<string | null>(null);
  const [isSimilarPhrasesOpen, setIsSimilarPhrasesOpen] = React.useState(false);
  const [isAutomationOpen, setIsAutomationOpen] = React.useState(false);
  const [isGroupTypeManagerOpen, setIsGroupTypeManagerOpen] = React.useState(false);
  const [isViewTemplatesOpen, setIsViewTemplatesOpen] = React.useState(false);
  const [isCrossMinusationOpen, setIsCrossMinusationOpen] = React.useState(false);
  const [isMorphDuplicatesOpen, setIsMorphDuplicatesOpen] = React.useState(false);
  const [isDataQualityOpen, setIsDataQualityOpen] = React.useState(false);
  const [isPipelinesOpen, setIsPipelinesOpen] = React.useState(false);
  const [isExportPresetsOpen, setIsExportPresetsOpen] = React.useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = React.useState(false);
  const [isTagsOpen, setIsTagsOpen] = React.useState(false);
  const [moveCopyDialog, setMoveCopyDialog] = React.useState<{
    phraseIds: string[];
    targetGroupId: string;
  } | null>(null);
  
  const { 
    selectedPhraseIds, 
    phrases,
    groups,
    clearFilters,
    deletePhrases, 
    selectAll, 
    deselectAll,
    invertSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    addLog,
    movePhrasesToGroup,
    copyPhrasesToGroup,
    updateGroupParent,
    loadInitialData,
    isDataLoaded,
    isDataLoading,
    dataError,
  } = useStore();

  const normalizedSelectedPhraseIds =
    selectedPhraseIds instanceof Set
      ? selectedPhraseIds
      : new Set(Array.isArray(selectedPhraseIds) ? selectedPhraseIds : []);

  const safePhrases = Array.isArray(phrases) ? phrases : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  React.useEffect(() => {
    if (!isDataLoaded && !isDataLoading) {
      loadInitialData();
    }
  }, [isDataLoaded, isDataLoading, loadInitialData]);
  
  // Настройка сенсоров для drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Минимальное расстояние для активации drag
      },
    })
  );
  
  // Обработчик drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.data.current || !over.data.current) {
      return;
    }
    
    const activeType = active.data.current.type;
    const overType = over.data.current.type;
    
    // Перетаскивание фразы на группу
    if (activeType === 'phrase' && (overType === 'group' || overType === 'group-target')) {
      const phraseId = active.id as string;
      const groupId = over.id as string;
      const phrase = safePhrases.find(p => p.id === phraseId);
      
      if (!phrase || phrase.groupId === groupId) {
        return;
      }
      
      // Показать диалог выбора действия (переместить/копировать)
      setMoveCopyDialog({
        phraseIds: [phraseId],
        targetGroupId: groupId,
      });
    }
    
    // Перетаскивание группы на группу (изменение родителя)
    if (activeType === 'group' && overType === 'group-target') {
      const movingGroupId = active.data.current.group.id;
      const targetGroupId = over.data.current.group.id;
      
      // Проверяем, что не перетаскиваем группу саму на себя
      if (movingGroupId === targetGroupId) {
        return;
      }
      
      // Проверяем, что целевая группа не является подгруппой перемещаемой группы
      const isDescendant = (parentId: string, childId: string): boolean => {
        const group = safeGroups.find(g => g.id === childId);
        if (!group) return false;
        if (group.parentId === parentId) return true;
        if (group.parentId) return isDescendant(parentId, group.parentId);
        return false;
      };
      
      if (isDescendant(movingGroupId, targetGroupId)) {
        addLog('warning', 'Нельзя переместить группу в свою подгруппу');
        return;
      }
      
      // Перемещаем группу
      updateGroupParent(movingGroupId, targetGroupId);
    }
  };
  
  // Горячие клавиши
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault();
    selectAll();
  }, { enableOnFormTags: false });
  
  useHotkeys('delete', () => {
    if (normalizedSelectedPhraseIds.size > 0) {
      const confirmed = window.confirm(
        `Удалить выделенные фразы (${normalizedSelectedPhraseIds.size} шт.)?`
      );
      if (confirmed) {
        deletePhrases(Array.from(normalizedSelectedPhraseIds));
      }
    }
  }, { enableOnFormTags: false });
  
  useHotkeys('escape', () => {
    deselectAll();
  });
  
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    addLog('info', 'Быстрый поиск - используйте фильтры');
  });
  
  useHotkeys('ctrl+h', (e) => {
    e.preventDefault();
    setIsFindReplaceModalOpen(true);
  }, { enableOnFormTags: false });
  
  useHotkeys('ctrl+i', (e) => {
    e.preventDefault();
    invertSelection();
  }, { enableOnFormTags: false });
  
  useHotkeys('ctrl+l', (e) => {
    e.preventDefault();
    clearFilters();
  }, { enableOnFormTags: false });
  
  useHotkeys('f5', (e) => {
    e.preventDefault();
    loadInitialData();
    addLog('info', 'Обновляем данные из базы');
  });
  
  useHotkeys('ctrl+d', (e) => {
    e.preventDefault();
    if (normalizedSelectedPhraseIds.size > 0) {
      addLog('info', 'Дублирование фраз - используйте копирование в группу');
    }
  }, { enableOnFormTags: false });
  
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo()) {
      undo();
    }
  }, { enableOnFormTags: false });
  
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    if (canRedo()) {
      redo();
    }
  }, { enableOnFormTags: false });
  
  if (dataError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white border border-red-200 shadow-sm rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-3">Не удалось загрузить данные</h2>
          <p className="text-sm text-gray-600 mb-6">
            {dataError}
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => loadInitialData()} className="w-full">
              Повторить попытку
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Перезагрузить приложение
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
        <Loader2 className="w-10 h-10 animate-spin mb-3" />
        <p className="text-lg font-medium">Загружаем данные из локальной базы...</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50 font-sans">
        {/* Toolbar */}
        <Toolbar
          onImportClick={() => setIsImportModalOpen(true)}
          onExportClick={() => setIsExportModalOpen(true)}
          onDuplicatesClick={() => setIsDuplicatesModalOpen(true)}
          onStopwordsClick={() => setIsStopwordsModalOpen(true)}
          onParsingClick={() => setIsWordstatModalOpen(true)}
          onFiltersClick={() => setIsFiltersModalOpen(true)}
          onColumnSettingsClick={() => setIsColumnSettingsOpen(true)}
          onStatisticsClick={() => setIsStatisticsModalOpen(true)}
          onSimilarPhrasesClick={() => setIsSimilarPhrasesOpen(true)}
          onAutomationClick={() => setIsAutomationOpen(true)}
          onGroupTypeManagerClick={() => setIsGroupTypeManagerOpen(true)}
          onViewTemplatesClick={() => setIsViewTemplatesOpen(true)}
          onCrossMinusationClick={() => setIsCrossMinusationOpen(true)}
          onMorphDuplicatesClick={() => setIsMorphDuplicatesOpen(true)}
          onDataQualityClick={() => setIsDataQualityOpen(true)}
          onPipelinesClick={() => setIsPipelinesOpen(true)}
          onExportPresetsClick={() => setIsExportPresetsOpen(true)}
          onSnapshotsClick={() => setIsSnapshotsOpen(true)}
          onTagsClick={() => setIsTagsOpen(true)}
        />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Table + Log */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <PhrasesTable onShowHistory={(phraseId) => setPhraseHistoryId(phraseId)} />
          <ActivityLog />
          <StatusBar />
          
          {/* Массовые операции */}
          {normalizedSelectedPhraseIds.size > 0 && (
            <MassBulkPanel 
              selectedCount={normalizedSelectedPhraseIds.size} 
              selectedIds={Array.from(normalizedSelectedPhraseIds)} 
            />
          )}
        </div>
        
        {/* Right: Groups Panel */}
        <div className="w-[30%] min-w-[280px] max-w-[400px]">
          <GroupsPanel />
        </div>
      </div>
      
      {/* Modals */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      <DuplicatesModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
      />
      
      <StopwordsManagerModal
        isOpen={isStopwordsModalOpen}
        onClose={() => setIsStopwordsModalOpen(false)}
      />
      
      {/* Новые модалы */}
      {isWordstatModalOpen && (
        <React.Suspense
          fallback={
            <Modal
              isOpen={true}
              onClose={() => setIsWordstatModalOpen(false)}
              title="Wordstat"
            >
              <div className="p-6 text-sm text-gray-500">Загрузка окна Wordstat…</div>
            </Modal>
          }
        >
          <LazyWordstatModal
            isOpen={true}
            onClose={() => setIsWordstatModalOpen(false)}
          />
        </React.Suspense>
      )}
      
      {isFiltersModalOpen && (
        <AdvancedFiltersModal onClose={() => setIsFiltersModalOpen(false)} />
      )}
      
      {isColumnSettingsOpen && (
        <ColumnSettingsModal onClose={() => setIsColumnSettingsOpen(false)} />
      )}
      
      <StatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
      />
      
      <FindReplaceModal
        isOpen={isFindReplaceModalOpen}
        onClose={() => setIsFindReplaceModalOpen(false)}
      />
      
      {/* Новые модалы */}
      {phraseHistoryId && (
        <PhraseHistoryModal
          phraseId={phraseHistoryId}
          onClose={() => setPhraseHistoryId(null)}
        />
      )}
      
      {isSimilarPhrasesOpen && (
        <SimilarPhrasesModal onClose={() => setIsSimilarPhrasesOpen(false)} />
      )}
      
      {isAutomationOpen && (
        <AutomationSchedulerModal onClose={() => setIsAutomationOpen(false)} />
      )}
      
      {isGroupTypeManagerOpen && (
        <GroupTypeManagerModal onClose={() => setIsGroupTypeManagerOpen(false)} />
      )}
      
      {isViewTemplatesOpen && (
        <ViewTemplatesModal isOpen={true} onClose={() => setIsViewTemplatesOpen(false)} />
      )}

      {/* Кросс-минусация (v5.0) */}
      {isCrossMinusationOpen && (
        <CrossMinusationModal
          isOpen={true}
          onClose={() => setIsCrossMinusationOpen(false)}
        />
      )}

      {/* Морфологические дубли (v5.0) */}
      {isMorphDuplicatesOpen && (
        <MorphDuplicatesModal
          isOpen={true}
          onClose={() => setIsMorphDuplicatesOpen(false)}
        />
      )}

      {/* Анализ качества данных (v5.0) */}
      {isDataQualityOpen && (
        <DataQualityModal
          isOpen={true}
          onClose={() => setIsDataQualityOpen(false)}
        />
      )}

      {/* Пайплайны очистки (v5.0 Sprint 3) */}
      {isPipelinesOpen && (
        <PipelinesModal
          isOpen={true}
          onClose={() => setIsPipelinesOpen(false)}
        />
      )}

      {/* Пресеты экспорта (v5.0 Sprint 3) */}
      {isExportPresetsOpen && (
        <ExportPresetsModal
          isOpen={true}
          onClose={() => setIsExportPresetsOpen(false)}
        />
      )}

      {/* Снапшоты (v5.0 Sprint 3) */}
      {isSnapshotsOpen && (
        <SnapshotsModal
          isOpen={true}
          onClose={() => setIsSnapshotsOpen(false)}
        />
      )}

      {/* Теги фраз (v5.0 Sprint 3) */}
      {isTagsOpen && (
        <TagsModal
          isOpen={true}
          onClose={() => setIsTagsOpen(false)}
        />
      )}
      
      {/* Диалог переноса/копирования при drag & drop */}
      {moveCopyDialog && (
        <Modal
          isOpen={true}
          onClose={() => setMoveCopyDialog(null)}
          title="Действие с фразой"
          size="sm"
        >
          <div className="p-6">
            <div className="mb-4 text-sm text-gray-600">
              Выберите действие с выбранной фразой:
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  movePhrasesToGroup(moveCopyDialog.phraseIds, moveCopyDialog.targetGroupId);
                  const group = safeGroups.find(g => g.id === moveCopyDialog.targetGroupId);
                  addLog('success', `Фраза перемещена в "${group?.name}"`);
                  setMoveCopyDialog(null);
                }}
                variant="primary"
                className="flex-1"
              >
                Переместить
              </Button>
              <Button
                onClick={() => {
                  copyPhrasesToGroup(moveCopyDialog.phraseIds, moveCopyDialog.targetGroupId);
                  const group = safeGroups.find(g => g.id === moveCopyDialog.targetGroupId);
                  addLog('success', `Фраза скопирована в "${group?.name}"`);
                  setMoveCopyDialog(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Копировать
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </DndContext>
  );
}

export default App;
