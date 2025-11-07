import React from 'react';
import { Plus, Folder, FolderOpen, Star } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import type { Group } from '../../types';

// Droppable группа с DnD
const DroppableGroup: React.FC<{
  group: Group;
  level: number;
  isSelected: boolean;
  isActive: boolean;
  count: number;
  hasChildren: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ group, level, isSelected, isActive, count, hasChildren, onClick, onContextMenu }) => {
  // DnD для групп
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `group-drag:${group.id}`,
    data: { type: 'group', group },
  });
  
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: group.id,
    data: { type: 'group-target', group },
  });
  
  const { groupColors, pinnedGroupIds } = useStore();
  const groupColor = groupColors[group.id];
  const isPinned = pinnedGroupIds.has(group.id);
  
  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
        ${isDragging ? 'opacity-50 bg-blue-200' : ''}
        ${isOver ? 'bg-green-100 border-2 border-green-500' : ''}
        ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}
        ${isActive && !isSelected ? 'bg-blue-50 border-l-2 border-blue-400' : ''}
        ${group.locked ? 'opacity-60' : ''}
        ${groupColor ? `bg-${groupColor}-50` : ''}
        ${isPinned ? 'border-l-4 border-yellow-400' : ''}
      `}
      style={{ paddingLeft: `${level * 16 + 12}px` }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
      {isPinned && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
      
      {hasChildren ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-gray-400" />
      )}
      
      <span className="flex-1 text-sm truncate" title={group.name}>
        {group.name}
      </span>
      
      {group.locked && <span className="text-xs">🔒</span>}
      {groupColor && <span className={`w-2 h-2 rounded-full bg-${groupColor}-500`}></span>}
      
      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
        {count}
      </span>
    </div>
  );
};

// Контекстное меню для группы
const GroupContextMenu: React.FC<{
  x: number;
  y: number;
  group: Group;
  onClose: () => void;
}> = ({ x, y, group, onClose }) => {
  const { 
    groups,
    phrases,
    addGroup, 
    updateGroup, 
    deleteGroup, 
    addLog,
    copyPhrasesToGroup,
    movePhrasesToGroup,
    setGroupColor,
    copyGroupStructure,
    togglePinGroup,
  } = useStore();
  
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [showSubmenus, setShowSubmenus] = React.useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleRename = () => {
    const newName = prompt('Новое название группы:', group.name);
    if (newName && newName.trim()) {
      updateGroup(group.id, { name: newName.trim() });
      addLog('success', `Группа переименована: "${newName}"`);
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Удалить группу "${group.name}"?`)) {
      deleteGroup(group.id);
      addLog('warning', `Группа удалена: "${group.name}"`);
    }
    onClose();
  };

  const handleCreateSubgroup = () => {
    const name = prompt('Название подгруппы:');
    if (name && name.trim()) {
      addGroup(name.trim(), group.id);
      addLog('success', `Подгруппа создана: "${name}"`);
    }
    onClose();
  };

  const handleCopyGroup = () => {
    const newName = `${group.name}_копия`;
    addGroup(newName, group.parentId);
    
    const groupPhrases = phrases.filter(p => p.groupId === group.id);
    if (groupPhrases.length > 0) {
      setTimeout(() => {
        const newGroup = groups.find(g => g.name === newName);
        if (newGroup) {
          copyPhrasesToGroup(groupPhrases.map(p => p.id), newGroup.id);
        }
      }, 100);
    }
    
    addLog('success', `Группа скопирована: "${newName}"`);
    onClose();
  };

  const handleCopyStructure = () => {
    if (confirm(`Скопировать структуру группы "${group.name}"?`)) {
      const newName = `${group.name}_структура`;
      addGroup(newName, group.parentId);
      
      setTimeout(() => {
        const newGroup = groups.find(g => g.name === newName);
        if (newGroup) {
          copyGroupStructure(group.id, newGroup.id);
        }
      }, 100);
      
      addLog('success', `Структура группы скопирована: "${newName}"`);
    }
    onClose();
  };

  const handleCreateBookmark = () => {
    togglePinGroup(group.id);
    onClose();
  };

  const handleMergeWith = (targetGroupId: string) => {
    const targetGroup = groups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    if (confirm(`Объединить группу "${group.name}" с "${targetGroup.name}"?`)) {
      const groupPhrases = phrases.filter(p => p.groupId === group.id);
      if (groupPhrases.length > 0) {
        movePhrasesToGroup(groupPhrases.map(p => p.id), targetGroupId);
      }
      
      deleteGroup(group.id);
      addLog('success', `Группы объединены: "${group.name}" → "${targetGroup.name}"`);
    }
    onClose();
  };

  const handleExport = () => {
    const groupPhrases = phrases.filter(p => p.groupId === group.id);
    if (groupPhrases.length === 0) {
      alert('В группе нет фраз для экспорта');
      return;
    }

    const csv = ['Фраза,ws,qws,bws,Статус', ...groupPhrases.map(p => 
      `"${p.text}",${p.ws},${p.qws},${p.bws},${p.status}`
    )].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${group.name}_${Date.now()}.csv`;
    link.click();

    addLog('success', `Экспортирована группа: "${group.name}" (${groupPhrases.length} фраз)`);
    onClose();
  };

  const handleToggleLock = () => {
    updateGroup(group.id, { locked: !group.locked });
    addLog('info', `Группа ${group.locked ? 'разблокирована' : 'заблокирована'}: "${group.name}"`);
    onClose();
  };

  const handleSetColor = (color: string) => {
    setGroupColor(group.id, color);
    addLog('info', `Цвет группы изменен: "${group.name}"`);
    onClose();
  };

  const handleAddComment = () => {
    const comment = prompt('Комментарий к группе:', group.comment || '');
    if (comment !== null) {
      updateGroup(group.id, { comment });
      addLog('info', `Комментарий ${comment ? 'добавлен' : 'удален'}: "${group.name}"`);
    }
    onClose();
  };

  const handleShowStats = () => {
    const groupPhrases = phrases.filter(p => p.groupId === group.id);
    const totalWs = groupPhrases.reduce((sum, p) => sum + p.ws, 0);
    const avgWs = groupPhrases.length > 0 ? Math.round(totalWs / groupPhrases.length) : 0;
    const maxWs = groupPhrases.length > 0 ? Math.max(...groupPhrases.map(p => p.ws)) : 0;

    const stats = `
Статистика группы "${group.name}":

Всего фраз: ${groupPhrases.length}
Общая частота (ws): ${totalWs.toLocaleString('ru-RU')}
Средняя частота: ${avgWs.toLocaleString('ru-RU')}
Максимальная частота: ${maxWs.toLocaleString('ru-RU')}
    `.trim();

    alert(stats);
    onClose();
  };

  const otherGroups = groups.filter(g => g.id !== group.id);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50 min-w-[220px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleCreateSubgroup} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Создать подгруппу
      </button>
      <button onClick={handleRename} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Переименовать
      </button>
      <button onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
        Удалить
      </button>

      <div className="border-t my-1"></div>

      <button onClick={handleCopyGroup} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Копировать группу
      </button>

      <button onClick={handleCopyStructure} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Копировать структуру
      </button>

      <button onClick={handleCreateBookmark} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        {group.id && useStore.getState().pinnedGroupIds.has(group.id) ? 'Убрать ярлык' : 'Создать ярлык'}
      </button>

      {/* Объединить */}
      <div className="relative group/merge">
        <button 
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
          onMouseEnter={() => setShowSubmenus({...showSubmenus, merge: true})}
        >
          Объединить с... →
        </button>
        {showSubmenus.merge && otherGroups.length > 0 && (
          <div 
            className="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[180px] ml-1"
            onMouseLeave={() => setShowSubmenus({...showSubmenus, merge: false})}
          >
            {otherGroups.map(g => (
              <button key={g.id} onClick={() => handleMergeWith(g.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleExport} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Экспорт группы
      </button>

      <div className="border-t my-1"></div>

      <button onClick={handleToggleLock} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        {group.locked ? 'Разблокировать' : 'Заблокировать'}
      </button>

      {/* Изменить цвет */}
      <div className="relative group/color">
        <button 
          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
          onMouseEnter={() => setShowSubmenus({...showSubmenus, color: true})}
        >
          Изменить цвет →
        </button>
        {showSubmenus.color && (
          <div 
            className="absolute left-full top-0 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-[150px] ml-1"
            onMouseLeave={() => setShowSubmenus({...showSubmenus, color: false})}
          >
            {[
              { name: 'Красный', value: 'red' },
              { name: 'Желтый', value: 'yellow' },
              { name: 'Зеленый', value: 'green' },
              { name: 'Синий', value: 'blue' },
              { name: 'Фиолетовый', value: 'purple' },
              { name: 'Сброс', value: '' }
            ].map(color => (
              <button key={color.value} onClick={() => handleSetColor(color.value)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2">
                {color.value && <span className={`w-3 h-3 rounded bg-${color.value}-500`}></span>}
                {color.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleAddComment} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        {group.comment ? 'Изменить комментарий' : 'Добавить комментарий'}
      </button>

      <div className="border-t my-1"></div>

      <button onClick={handleShowStats} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
        Статистика по группе
      </button>
    </div>
  );
};

export const GroupsPanel: React.FC = () => {
  const { 
    groups, 
    selectedGroupId, 
    activeGroupIds,
    phrases, 
    addGroup, 
    deleteGroup, 
    selectGroup,
    toggleActiveGroup,
    clearActiveGroups,
  } = useStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; group: Group } | null>(null);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddModalOpen(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, group });
  };

  const handleGroupClick = (groupId: string, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      // Мульти-группа
      toggleActiveGroup(groupId);
    } else {
      // Обычный выбор
      clearActiveGroups();
      selectGroup(groupId);
    }
  };

  // Подсчет фраз в группах
  const groupCounts = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    groups.forEach(g => {
      counts[g.id] = phrases.filter(p => p.groupId === g.id).length;
    });
    return counts;
  }, [groups, phrases]);

  // Рендер дерева групп
  const renderGroup = (group: Group, level: number = 0) => {
    const isSelected = selectedGroupId === group.id;
    const isActive = activeGroupIds.has(group.id);
    const count = groupCounts[group.id] || 0;
    const hasChildren = groups.some(g => g.parentId === group.id);

    return (
      <div key={group.id}>
        <DroppableGroup
          group={group}
          level={level}
          isSelected={isSelected}
          isActive={isActive}
          count={count}
          hasChildren={hasChildren}
          onClick={(e) => handleGroupClick(group.id, e)}
          onContextMenu={(e) => handleContextMenu(e, group)}
        />

        {/* Дочерние группы */}
        {groups
          .filter(g => g.parentId === group.id)
          .map(childGroup => renderGroup(childGroup, level + 1))}
      </div>
    );
  };

  const rootGroups = groups.filter(g => !g.parentId);

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">
          Группы
          {activeGroupIds.size > 1 && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Мультигруппа ({activeGroupIds.size})
            </span>
          )}
        </h2>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="ghost"
          icon={<Plus className="w-4 h-4" />}
          title="Создать группу"
        />
      </div>

      {/* Список групп */}
      <div className="flex-1 overflow-y-auto">
        {/* Все фразы */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
            ${selectedGroupId === null && activeGroupIds.size === 0 ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'}
          `}
          onClick={() => {
            clearActiveGroups();
            selectGroup(null);
          }}
        >
          <Folder className="w-4 h-4 text-gray-400" />
          <span className="flex-1 text-sm font-medium">Все фразы</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
            {phrases.length}
          </span>
        </div>

        {/* Корневые группы */}
        {rootGroups.map(group => renderGroup(group))}

        {rootGroups.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Нет групп. Создайте первую группу.
          </div>
        )}
        
        {activeGroupIds.size > 0 && (
          <div className="p-3 text-xs text-gray-600 bg-blue-50 border-t">
            Подсказка: Ctrl+клик для выбора нескольких групп
          </div>
        )}
      </div>

      {/* Модал создания группы */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewGroupName('');
        }}
        title="Создать группу"
        size="sm"
      >
        <div className="p-6">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название группы"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddGroup();
            }}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                setNewGroupName('');
              }}
              variant="secondary"
            >
              Отмена
            </Button>
            <Button onClick={handleAddGroup} variant="primary">
              Создать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Контекстное меню */}
      {contextMenu && (
        <GroupContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          group={contextMenu.group}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
