import React from 'react';
import { Plus, Trash2, Check, FileDown, ChevronDown, BarChart3, Search, Clock, FolderPlus, Columns, Bookmark, Link2, RefreshCw, Sparkles, Zap, Save, Camera, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { useStore } from '../../store/useStore';

export const Toolbar: React.FC<{
  onImportClick: () => void;
  onExportClick: () => void;
  onDuplicatesClick: () => void;
  onStopwordsClick: () => void;
  onParsingClick: () => void;
  onFiltersClick: () => void;
  onColumnSettingsClick: () => void;
  onStatisticsClick: () => void;
  onSimilarPhrasesClick: () => void;
  onAutomationClick: () => void;
  onGroupTypeManagerClick: () => void;
  onViewTemplatesClick: () => void;
  onCrossMinusationClick: () => void;
  onMorphDuplicatesClick: () => void;
  onDataQualityClick: () => void;
  onPipelinesClick: () => void;
  onExportPresetsClick: () => void;
  onSnapshotsClick: () => void;
  onTagsClick: () => void;
}> = ({ 
  onImportClick, 
  onExportClick, 
  onDuplicatesClick, 
  onStopwordsClick,
  onParsingClick,
  onFiltersClick,
  onColumnSettingsClick,
  onStatisticsClick,
  onSimilarPhrasesClick,
  onAutomationClick,
  onGroupTypeManagerClick,
  onViewTemplatesClick,
  onCrossMinusationClick,
  onMorphDuplicatesClick,
  onDataQualityClick,
  onPipelinesClick,
  onExportPresetsClick,
  onSnapshotsClick,
  onTagsClick,
}) => {
  const { 
    selectedPhraseIds,
    phrases,
    markedPhraseIds,
    selectAll,
    deselectAll,
    invertSelection,
    deletePhrases,
    clearPhrases,
    markAllPhrases,
    unmarkAllPhrases,
    invertMarkedPhrases,
    markPhrasesByFilter,
  } = useStore();
  
  const selectedCount = selectedPhraseIds.size;
  const hasSelection = selectedCount > 0;
  
  const handleDelete = () => {
    if (!hasSelection) return;
    
    const confirmed = window.confirm(
      `Удалить выделенные фразы (${selectedCount} шт.)?`
    );
    
    if (confirmed) {
      deletePhrases(Array.from(selectedPhraseIds));
    }
  };
  
  const handleClear = () => {
    if (phrases.length === 0) return;
    
    const confirmed = window.confirm(
      `Очистить всю таблицу (${phrases.length} фраз)?`
    );
    
    if (confirmed) {
      clearPhrases();
    }
  };
  
  const selectionItems: DropdownItem[] = [
    {
      label: 'Выбрать все',
      value: 'select-all',
      onClick: selectAll,
    },
    {
      label: 'Снять выбор',
      value: 'deselect-all',
      onClick: deselectAll,
      disabled: !hasSelection,
    },
    {
      label: 'Инвертировать',
      value: 'invert',
      onClick: invertSelection,
    },
  ];

  const markingItems: DropdownItem[] = [
    {
      label: 'Отметить все',
      value: 'mark-all',
      onClick: markAllPhrases,
    },
    {
      label: 'Снять все отметки',
      value: 'unmark-all',
      onClick: unmarkAllPhrases,
      disabled: markedPhraseIds.size === 0,
    },
    {
      label: 'Инвертировать отметки',
      value: 'invert-marks',
      onClick: invertMarkedPhrases,
    },
    {
      label: 'Отметить по фильтру',
      value: 'mark-by-filter',
      onClick: markPhrasesByFilter,
    },
  ];
  
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center gap-2">
      {/* Добавить */}
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={onImportClick}
      >
        Добавить
      </Button>
      
      {/* Удалить */}
      <Button
        variant="danger"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={handleDelete}
        disabled={!hasSelection}
      >
        Удалить {hasSelection && `(${selectedCount})`}
      </Button>
      
      {/* Выделение */}
      <Dropdown
        trigger={
          <Button variant="secondary">
            Выделение
            <ChevronDown className="w-4 h-4" />
          </Button>
        }
        items={selectionItems}
      />

      {/* Маркировка (v5.0) */}
      <Dropdown
        trigger={
          <Button variant="secondary">
            <Bookmark className="w-4 h-4 mr-1" />
            Маркировка {markedPhraseIds.size > 0 && `(${markedPhraseIds.size})`}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        }
        items={markingItems}
      />
      
      {/* Функции парсинга и анализа */}
      <div className="w-px h-6 bg-gray-200" />
      
      <Button 
        variant="secondary"
        onClick={onParsingClick}
        title="Парсинг частот из Yandex Wordstat"
      >
        Частота
      </Button>
      
      <Button 
        variant="secondary"
        onClick={onFiltersClick}
        title="Расширенные фильтры"
      >
        Фильтры
      </Button>
      
      <Button 
        variant="secondary"
        onClick={onColumnSettingsClick}
        title="Настройка отображаемых столбцов"
      >
        Столбцы
      </Button>
      
      <Button 
        variant="secondary"
        icon={<Columns className="w-4 h-4" />}
        onClick={onViewTemplatesClick}
        title="Шаблоны видов таблицы"
      >
        Виды
      </Button>
      
      {/* Анализ */}
      <div className="w-px h-6 bg-gray-200" />
      
      <Button
        variant="secondary"
        onClick={onDuplicatesClick}
        disabled={phrases.length === 0}
        title="Поиск точных дублей"
      >
        Точные дубли
      </Button>
      
      {/* Морфологические дубли (v5.0) */}
      <Button
        variant="secondary"
        onClick={onMorphDuplicatesClick}
        disabled={phrases.length === 0}
        title="Поиск морфологических дублей"
        icon={<RefreshCw className="w-4 h-4" />}
      >
        Морф. дубли
      </Button>

      {/* Кросс-минусация (v5.0) */}
      <Button
        variant="secondary"
        onClick={onCrossMinusationClick}
        disabled={phrases.length === 0}
        title="Кросс-минусация фраз"
        icon={<Link2 className="w-4 h-4" />}
      >
        Кросс-минусация
      </Button>

      {/* Анализ качества (v5.0) */}
      <Button
        variant="secondary"
        onClick={onDataQualityClick}
        disabled={phrases.length === 0}
        title="Анализ качества данных и очистка"
        icon={<Sparkles className="w-4 h-4" />}
      >
        Качество
      </Button>

      {/* Пайплайны очистки (v5.0 Sprint 3) */}
      <Button
        variant="secondary"
        onClick={onPipelinesClick}
        disabled={phrases.length === 0}
        title="Пайплайны очистки за 1 клик"
        icon={<Zap className="w-4 h-4" />}
      >
        Пайплайны
      </Button>
      
      <Button
        variant="secondary"
        onClick={onStopwordsClick}
        title="Управление стоп-словами (минус-словами)"
      >
        Стоп-слова
      </Button>
      
      <Button
        variant="secondary"
        icon={<Search className="w-4 h-4" />}
        onClick={onSimilarPhrasesClick}
        disabled={phrases.length === 0}
        title="Поиск похожих фраз и группировка"
      >
        Похожие
      </Button>
      
      <Button
        variant="secondary"
        icon={<BarChart3 className="w-4 h-4" />}
        onClick={onStatisticsClick}
        disabled={phrases.length === 0}
        title="Статистика проекта"
      >
        Статистика
      </Button>
      
      {/* Дополнительные функции */}
      <div className="w-px h-6 bg-gray-200" />
      
      <Button
        variant="secondary"
        icon={<FolderPlus className="w-4 h-4" />}
        onClick={onGroupTypeManagerClick}
        title="Управление типами групп"
      >
        Типы групп
      </Button>

      {/* Теги фраз (v5.0 Sprint 3) */}
      <Button
        variant="secondary"
        icon={<Tag className="w-4 h-4" />}
        onClick={onTagsClick}
        title="Управление тегами фраз"
      >
        Теги
      </Button>
      
      <Button
        variant="secondary"
        icon={<Clock className="w-4 h-4" />}
        onClick={onAutomationClick}
        title="Планировщик автоматических задач"
      >
        Автоматизация
      </Button>

      {/* Снапшоты (v5.0 Sprint 3) */}
      <Button
        variant="secondary"
        icon={<Camera className="w-4 h-4" />}
        onClick={onSnapshotsClick}
        title="Управление снапшотами проекта"
      >
        Снапшоты
      </Button>
      
      {/* Очистить */}
      <Button
        variant="secondary"
        onClick={handleClear}
        disabled={phrases.length === 0}
      >
        Очистить
      </Button>
      
      <div className="flex-1" />
      
      {/* Пресеты экспорта (v5.0 Sprint 3) */}
      <Button
        variant="secondary"
        icon={<Save className="w-4 h-4" />}
        onClick={onExportPresetsClick}
        title="Управление пресетами экспорта"
      >
        Пресеты
      </Button>

      {/* Экспорт */}
      <Button
        variant="secondary"
        icon={<FileDown className="w-4 h-4" />}
        onClick={onExportClick}
        disabled={phrases.length === 0}
      >
        Экспорт
      </Button>
      
      {/* Инфо */}
      {phrases.length > 0 && (
        <div className="text-xs text-gray-500">
          Всего фраз: <span className="font-medium text-gray-700">{phrases.length}</span>
          {hasSelection && (
            <>
              {' '} | Выделено: <span className="font-medium text-blue-600">{selectedCount}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
