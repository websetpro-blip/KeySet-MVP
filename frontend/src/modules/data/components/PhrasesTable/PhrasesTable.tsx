// @ts-nocheck
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnOrderState,
  ColumnPinningState,
  type Header,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, CheckCircle2, Pin, Lock, ChevronDown, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Checkbox } from '../ui/Checkbox';
import { useStore } from '../../store/useStore';
import type { Phrase } from '../../types';
import { cn } from '../../lib/utils';

const columnHelper = createColumnHelper<Phrase>();

// Функция для вычисления цвета градиента на основе значения
const getGradientColor = (value: number, min: number, max: number): string => {
  if (max === min) return 'transparent';
  const ratio = (value - min) / (max - min);
  
  // Градиент от светло-зеленого (низкие значения) к темно-зеленому (высокие значения)
  const opacity = 0.15 + ratio * 0.35; // от 15% до 50% непрозрачности
  return `rgba(34, 197, 94, ${opacity})`; // green-500
};

// Контекстное меню для заголовков столбцов
const ColumnHeaderMenu: React.FC<{
  x: number;
  y: number;
  columnId: string;
  onClose: () => void;
}> = ({ x, y, columnId, onClose }) => {
  const { setColumnVisibility, columnVisibility } = useStore();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleHideColumn = () => {
    setColumnVisibility({ ...columnVisibility, [columnId]: false });
    onClose();
  };

  const handleAutoWidth = () => {
    // В будущем можно реализовать автоматическую ширину
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
      style={{ top: y, left: x }}
    >
      <button
        onClick={handleHideColumn}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        <EyeOff className="w-4 h-4" />
        Скрыть столбец
      </button>
      <button
        onClick={handleAutoWidth}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        <Maximize2 className="w-4 h-4" />
        Авто-ширина
      </button>
    </div>
  );
};

// Draggable строка таблицы
const DraggableRow: React.FC<{
  phrase: Phrase;
  isSelected: boolean;
  isEven: boolean;
  children: React.ReactNode;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ phrase, isSelected, isEven, children, onContextMenu }) => {
  const { phraseColors, groupColors, pinnedPhraseIds, markedPhraseIds } = useStore();
  
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: phrase.id,
    data: { type: 'phrase', phrase },
  });
  
  const isPinned = pinnedPhraseIds.has(phrase.id);
  const isMarked = markedPhraseIds.has(phrase.id);
  const phraseColor = phraseColors[phrase.id];
  const groupColor = phrase.groupId ? groupColors[phrase.groupId] : undefined;
  const bgColor = phraseColor || groupColor;
  
  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      className={cn(
        'h-9 border-b border-gray-200 transition-colors',
        isDragging && 'opacity-50 bg-blue-200',
        isMarked && !bgColor && !isPinned && 'bg-amber-50 border-amber-200',
        bgColor && `bg-${bgColor}-100`,
        isPinned && !bgColor && 'bg-blue-50 border-blue-200',
        isSelected && !bgColor && !isPinned && !isMarked && 'bg-blue-100 border-blue-200',
        !isSelected && !bgColor && !isPinned && !isMarked && isEven && 'bg-white',
        !isSelected && !bgColor && !isPinned && !isMarked && !isEven && 'bg-gray-50',
        !isSelected && !bgColor && !isPinned && !isMarked && 'hover:bg-blue-50',
        phrase.locked && 'opacity-60'
      )}
    >
      {children}
    </tr>
  );
};

// Контекстное меню
const ContextMenu: React.FC<{
  x: number;
  y: number;
  phrase: Phrase;
  onClose: () => void;
  onShowHistory?: (phraseId: string) => void;
}> = ({ x, y, phrase, onClose, onShowHistory }) => {
  const { 
    groups, 
    editPhrase, 
    markPhraseColor,
    toggleRowLock, 
    deletePhrases, 
    movePhrasesToGroup,
    addStopword,
    addLog,
    togglePinPhrase,
    toggleMarkPhrase,
  } = useStore();
  
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(phrase.text);
    addLog('info', `Скопировано в буфер: "${phrase.text}"`);
    onClose();
  };

  const handleEdit = () => {
    const newText = prompt('Редактировать фразу:', phrase.text);
    if (newText && newText.trim()) {
      editPhrase(phrase.id, newText.trim());
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Удалить фразу "${phrase.text}"?`)) {
      deletePhrases([phrase.id]);
    }
    onClose();
  };

  const handleColor = (color: string) => {
    markPhraseColor(phrase.id, color);
    onClose();
  };

  const handleMove = (groupId: string) => {
    movePhrasesToGroup([phrase.id], groupId);
    onClose();
  };

  const handleAddToStopwords = () => {
    const words = phrase.text.split(' ');
    words.forEach(word => {
      addStopword({
        id: Date.now().toString() + Math.random(),
        text: word,
        matchType: 'partial',
        useMorphology: false,
        category: 'ИНФОРМАЦИОННЫЕ',
      });
    });
    addLog('success', `Добавлено в стоп-слова: ${words.length} слов`);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50 min-w-[220px]"
      style={{ left: x, top: y }}
    >
      <button onClick={handleCopy} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Копировать в буфер
      </button>
      <button onClick={handleEdit} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Редактировать
      </button>
      <div className="border-t my-1"></div>
      
      {/* Переместить в группу */}
      <div className="relative group/move">
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
          Переместить в группу →
        </button>
        <div className="hidden group-hover/move:block absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[150px] ml-1">
          {groups.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">Нет групп</div>
          ) : (
            groups.map(g => (
              <button key={g.id} onClick={() => handleMove(g.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                {g.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Цвет */}
      <div className="relative group/color">
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
          Цвет →
        </button>
        <div className="hidden group-hover/color:block absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[120px] ml-1">
          <button onClick={() => handleColor('red')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500"></span> Красный
          </button>
          <button onClick={() => handleColor('yellow')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500"></span> Желтый
          </button>
          <button onClick={() => handleColor('green')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500"></span> Зеленый
          </button>
          <button onClick={() => handleColor('blue')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500"></span> Синий
          </button>
          <button onClick={() => handleColor('')} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
            Сбросить
          </button>
        </div>
      </div>

      <div className="border-t my-1"></div>
      <button onClick={() => { toggleRowLock(phrase.id); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        {phrase.locked ? 'Разблокировать' : 'Заблокировать'}
      </button>
      <button onClick={() => { togglePinPhrase(phrase.id); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Закрепить сверху
      </button>
      <button onClick={() => { toggleMarkPhrase(phrase.id); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        {useStore.getState().markedPhraseIds.has(phrase.id) ? 'Снять отметку' : 'Отметить фразу'}
      </button>
      <button onClick={handleAddToStopwords} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Добавить в стоп-слова
      </button>
      {onShowHistory && (
        <button onClick={() => { onShowHistory(phrase.id); onClose(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
          История изменений
        </button>
      )}
      <div className="border-t my-1"></div>
      <button onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
        Удалить
      </button>
    </div>
  );
};

export const PhrasesTable: React.FC<{ onShowHistory?: (phraseId: string) => void }> = ({ onShowHistory }) => {
  const { 
    phrases, 
    selectedPhraseIds, 
    selectedGroupId,
    activeGroupIds,
    filters,
    columnVisibility,
    columnOrder,
    columnPinning,
    pinnedPhraseIds,
    markedPhraseIds,
    searchMasks,
    selectPhrase, 
    selectAll, 
    deselectAll,
    updatePhrase,
    setColumnOrder,
    setColumnPinning,
    toggleMarkPhrase,
  } = useStore();
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; phrase: Phrase } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = React.useState<{ x: number; y: number; columnId: string } | null>(null);
  
  // Применение фильтров
  const filteredPhrases = React.useMemo(() => {
    let result = phrases;

    // Фильтр по группе или мульти-группе
    if (activeGroupIds.size > 0) {
      result = result.filter(p => p.groupId && activeGroupIds.has(p.groupId));
    } else if (selectedGroupId) {
      result = result.filter(p => p.groupId === selectedGroupId);
    }

    // Числовые фильтры
    if (filters.wsMin !== undefined) result = result.filter(p => p.ws >= filters.wsMin!);
    if (filters.wsMax !== undefined) result = result.filter(p => p.ws <= filters.wsMax!);
    if (filters.qwsMin !== undefined) result = result.filter(p => p.qws >= filters.qwsMin!);
    if (filters.qwsMax !== undefined) result = result.filter(p => p.qws <= filters.qwsMax!);
    if (filters.bwsMin !== undefined) result = result.filter(p => p.bws >= filters.bwsMin!);
    if (filters.bwsMax !== undefined) result = result.filter(p => p.bws <= filters.bwsMax!);
    if (filters.lengthMin !== undefined) result = result.filter(p => p.text.length >= filters.lengthMin!);
    if (filters.lengthMax !== undefined) result = result.filter(p => p.text.length <= filters.lengthMax!);
    if (filters.wordCountMin !== undefined) result = result.filter(p => p.text.split(/\s+/).length >= filters.wordCountMin!);
    if (filters.wordCountMax !== undefined) result = result.filter(p => p.text.split(/\s+/).length <= filters.wordCountMax!);

    // Текстовые фильтры
    if (filters.contains) result = result.filter(p => p.text.toLowerCase().includes(filters.contains!.toLowerCase()));
    if (filters.notContains) result = result.filter(p => !p.text.toLowerCase().includes(filters.notContains!.toLowerCase()));
    if (filters.startsWith) result = result.filter(p => p.text.toLowerCase().startsWith(filters.startsWith!.toLowerCase()));
    if (filters.endsWith) result = result.filter(p => p.text.toLowerCase().endsWith(filters.endsWith!.toLowerCase()));

    // Быстрые фильтры
    if (filters.showOnlyHighFreq) result = result.filter(p => p.ws > 1000);
    if (filters.showOnlyLowFreq) result = result.filter(p => p.ws < 100 && p.ws > 0);
    if (filters.showOnlyZeroFreq) result = result.filter(p => p.ws === 0);
    if (filters.showOnlyWithStopwords) result = result.filter(p => p.hasStopword === true);
    if (filters.showOnlySelected) result = result.filter(p => selectedPhraseIds.has(p.id));

    // Сортировка: закрепленные фразы сверху
    result.sort((a, b) => {
      if (pinnedPhraseIds.has(a.id) && !pinnedPhraseIds.has(b.id)) return -1;
      if (!pinnedPhraseIds.has(a.id) && pinnedPhraseIds.has(b.id)) return 1;
      return 0;
    });

    return result;
  }, [phrases, selectedGroupId, activeGroupIds, filters, selectedPhraseIds, pinnedPhraseIds]);
  
  // Клик по фразе с Ctrl/Ctrl+Alt для открытия SERP
  const handlePhraseCellClick = (phrase: Phrase, event: React.MouseEvent) => {
    if (event.ctrlKey && !event.altKey && searchMasks[0]) {
      const url = searchMasks[0].url.replace('{QUERY}', encodeURIComponent(phrase.text));
      window.open(url, '_blank');
    } else if (event.ctrlKey && event.altKey && searchMasks[1]) {
      const url = searchMasks[1].url.replace('{QUERY}', encodeURIComponent(phrase.text));
      window.open(url, '_blank');
    }
  };
  
  // Определение колонок с учетом видимости
  const columns = React.useMemo(() => {
    const cols: any[] = [
      // Чекбокс
      columnHelper.display({
        id: 'select',
        size: 60,
        header: ({ table }) => {
          const allSelected = filteredPhrases.length > 0 && filteredPhrases.every(p => selectedPhraseIds.has(p.id));
          const someSelected = filteredPhrases.some(p => selectedPhraseIds.has(p.id));
          
          return (
            <Checkbox
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onChange={() => allSelected ? deselectAll() : selectAll()}
            />
          );
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {pinnedPhraseIds.has(row.original.id) && <Pin className="w-3 h-3 text-blue-500 fill-blue-500" />}
            {row.original.locked && <Lock className="w-3 h-3 text-gray-500" />}
            <Checkbox checked={selectedPhraseIds.has(row.original.id)} onChange={() => selectPhrase(row.original.id)} />
          </div>
        ),
      }),
      
      // Номер
      columnHelper.display({
        id: 'index',
        size: 50,
        header: '№',
        cell: ({ row }) => <span className="text-gray-500">{row.index + 1}</span>,
      }),
    ];

    // Фраза
    if (columnVisibility.phrase !== false) {
      cols.push(
        columnHelper.accessor('text', {
          header: 'Фраза',
          size: 400,
          cell: ({ row }) => {
            const isEditing = editingId === row.original.id;
            
            if (isEditing) {
              return (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (editValue.trim()) updatePhrase(row.original.id, { text: editValue.trim() });
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editValue.trim()) updatePhrase(row.original.id, { text: editValue.trim() });
                      setEditingId(null);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  autoFocus
                  className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              );
            }
            
            return (
              <span
                onDoubleClick={() => { setEditingId(row.original.id); setEditValue(row.original.text); }}
                onClick={(e) => handlePhraseCellClick(row.original, e)}
                className="cursor-text"
                title="Ctrl+клик - Google | Ctrl+Alt+клик - Yandex"
              >
                {row.original.text}
              </span>
            );
          },
        })
      );
    }

    // ws, qws, bws с градиентной подсветкой
    if (columnVisibility.ws !== false) {
      const wsValues = filteredPhrases.map(p => p.ws).filter(v => v > 0);
      const wsMin = wsValues.length > 0 ? Math.min(...wsValues) : 0;
      const wsMax = wsValues.length > 0 ? Math.max(...wsValues) : 0;
      
      cols.push(columnHelper.accessor('ws', {
        header: 'ws',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue();
          const bgColor = value > 0 ? getGradientColor(value, wsMin, wsMax) : 'transparent';
          return (
            <span 
              className="text-gray-600 font-medium px-2 py-1 rounded block"
              style={{ backgroundColor: bgColor }}
            >
              {value > 0 ? value.toLocaleString('ru-RU') : '-'}
            </span>
          );
        },
      }));
    }
    if (columnVisibility.qws !== false) {
      const qwsValues = filteredPhrases.map(p => p.qws).filter(v => v > 0);
      const qwsMin = qwsValues.length > 0 ? Math.min(...qwsValues) : 0;
      const qwsMax = qwsValues.length > 0 ? Math.max(...qwsValues) : 0;
      
      cols.push(columnHelper.accessor('qws', {
        header: 'qws',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue();
          const bgColor = value > 0 ? getGradientColor(value, qwsMin, qwsMax) : 'transparent';
          return (
            <span 
              className="text-gray-600 font-medium px-2 py-1 rounded block"
              style={{ backgroundColor: bgColor }}
            >
              {value > 0 ? value.toLocaleString('ru-RU') : '-'}
            </span>
          );
        },
      }));
    }
    if (columnVisibility.bws !== false) {
      const bwsValues = filteredPhrases.map(p => p.bws).filter(v => v > 0);
      const bwsMin = bwsValues.length > 0 ? Math.min(...bwsValues) : 0;
      const bwsMax = bwsValues.length > 0 ? Math.max(...bwsValues) : 0;
      
      cols.push(columnHelper.accessor('bws', {
        header: 'bws',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue();
          const bgColor = value > 0 ? getGradientColor(value, bwsMin, bwsMax) : 'transparent';
          return (
            <span 
              className="text-gray-600 font-medium px-2 py-1 rounded block"
              style={{ backgroundColor: bgColor }}
            >
              {value > 0 ? value.toLocaleString('ru-RU') : '-'}
            </span>
          );
        },
      }));
    }

    // Статус
    if (columnVisibility.status !== false) {
      cols.push(columnHelper.accessor('status', {
        header: 'Статус',
        size: 80,
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <div className="flex items-center justify-center">
              {(status === 'done' || status === 'success') && <CheckCircle2 className="w-4 h-4 text-success-500" />}
              {status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
              {status === 'error' && <div className="w-2 h-2 rounded-full bg-error-500" />}
            </div>
          );
        },
      }));
    }

    return cols;
  }, [filteredPhrases, selectedPhraseIds, editingId, editValue, columnVisibility, pinnedPhraseIds, selectPhrase, selectAll, deselectAll, updatePhrase]);
  
  const table = useReactTable({
    data: filteredPhrases,
    columns,
    state: { sorting, columnOrder, columnPinning },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true, // v5.0 - Мульти-сортировка с Shift+клик
    maxMultiSortColCount: 3, // Максимум 3 колонки одновременно
  });

  const handleContextMenu = (e: React.MouseEvent, phrase: Phrase) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, phrase });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderContextMenu({ x: e.clientX, y: e.clientY, columnId });
  };
  
  // Калькуляторы для футера
  const stats = React.useMemo(() => {
    const wsValues = filteredPhrases.map(p => p.ws).filter(v => v > 0);
    const sum = wsValues.reduce((a, b) => a + b, 0);
    const avg = wsValues.length > 0 ? Math.round(sum / wsValues.length) : 0;
    const max = wsValues.length > 0 ? Math.max(...wsValues) : 0;
    const min = wsValues.length > 0 ? Math.min(...wsValues) : 0;
    
    return { sum, avg, max, min, count: filteredPhrases.length };
  }, [filteredPhrases]);
  
  if (filteredPhrases.length === 0) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-base mb-2">Нет фраз для отображения</p>
          <p className="text-sm">
            {selectedGroupId || activeGroupIds.size > 0
              ? 'В выбранной группе нет фраз' 
              : Object.keys(filters).length > 0
              ? 'Не найдено фраз по заданным фильтрам'
              : 'Добавьте фразы через кнопку "Добавить" или импортируйте файл'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 bg-white overflow-auto flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b-2 border-gray-300">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={cn(
                      'h-10 px-3 text-left text-sm font-medium text-gray-700',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-gray-200'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    onContextMenu={(e) => handleHeaderContextMenu(e, header.column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-blue-500">
                          {header.column.getIsSorted() === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const isSelected = selectedPhraseIds.has(row.original.id);
              const isEven = index % 2 === 0;
              const phrase = row.original;
              
              return (
                <DraggableRow
                  key={row.id}
                  phrase={phrase}
                  isSelected={isSelected}
                  isEven={isEven}
                  onContextMenu={(e) => handleContextMenu(e, phrase)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 text-sm text-gray-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </DraggableRow>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Футер с калькуляторами */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm">
        <div>
          Всего фраз: <strong>{stats.count}</strong>
          {selectedPhraseIds.size > 0 && (
            <span className="text-blue-600 ml-4">Выбрано: <strong>{selectedPhraseIds.size}</strong></span>
          )}
        </div>
        <div className="flex gap-6 text-xs text-gray-600">
          <div>Сумма ws: <strong>{stats.sum.toLocaleString('ru-RU')}</strong></div>
          <div>Среднее ws: <strong>{stats.avg.toLocaleString('ru-RU')}</strong></div>
          <div>Макс ws: <strong>{stats.max.toLocaleString('ru-RU')}</strong></div>
          <div>Мин ws: <strong>{stats.min.toLocaleString('ru-RU')}</strong></div>
        </div>
      </div>

      {/* Контекстное меню для фраз */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          phrase={contextMenu.phrase}
          onClose={() => setContextMenu(null)}
          onShowHistory={onShowHistory}
        />
      )}

      {/* Контекстное меню для заголовков столбцов */}
      {headerContextMenu && (
        <ColumnHeaderMenu
          x={headerContextMenu.x}
          y={headerContextMenu.y}
          columnId={headerContextMenu.columnId}
          onClose={() => setHeaderContextMenu(null)}
        />
      )}
    </div>
  );
};
