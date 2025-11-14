import React from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';

interface MassBulkPanelProps {
  selectedCount: number;
  selectedIds: string[];
}

// Модал массового редактирования
const MassEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
}> = ({ isOpen, onClose, selectedIds }) => {
  const { phrases, updatePhrase, addLog } = useStore();
  const [operation, setOperation] = React.useState<'replace' | 'prefix' | 'suffix' | 'remove'>('replace');
  const [findText, setFindText] = React.useState('');
  const [replaceText, setReplaceText] = React.useState('');

  const handleApply = () => {
    if (!findText.trim() && operation !== 'prefix' && operation !== 'suffix') {
      alert('Введите текст для поиска');
      return;
    }

    let count = 0;
    const selectedPhrases = phrases.filter(p => selectedIds.includes(p.id));

    selectedPhrases.forEach(phrase => {
      let newText = phrase.text;

      switch (operation) {
        case 'replace':
          if (newText.includes(findText)) {
            newText = newText.replace(new RegExp(findText, 'g'), replaceText);
            count++;
          }
          break;
        case 'prefix':
          newText = replaceText + newText;
          count++;
          break;
        case 'suffix':
          newText = newText + replaceText;
          count++;
          break;
        case 'remove':
          if (newText.includes(findText)) {
            newText = newText.replace(new RegExp(findText, 'g'), '');
            count++;
          }
          break;
      }

      if (newText !== phrase.text) {
        updatePhrase(phrase.id, { text: newText.trim() });
      }
    });

    addLog('success', `Массовое редактирование: изменено ${count} фраз`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Массовое редактирование" size="md">
      <div className="p-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-800">
            Выделено фраз: <strong>{selectedIds.length}</strong>
          </div>
        </div>

        <div className="space-y-4">
          {/* Выбор операции */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Операция:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={operation === 'replace'}
                  onChange={() => setOperation('replace')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Заменить подстроку</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={operation === 'prefix'}
                  onChange={() => setOperation('prefix')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Добавить префикс</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={operation === 'suffix'}
                  onChange={() => setOperation('suffix')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Добавить суффикс</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={operation === 'remove'}
                  onChange={() => setOperation('remove')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Удалить подстроку</span>
              </label>
            </div>
          </div>

          {/* Поля ввода */}
          {(operation === 'replace' || operation === 'remove') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Найти:
              </label>
              <Input
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Текст для поиска"
              />
            </div>
          )}

          {(operation === 'replace' || operation === 'prefix' || operation === 'suffix') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {operation === 'replace' ? 'Заменить на:' : 
                 operation === 'prefix' ? 'Префикс:' : 'Суффикс:'}
              </label>
              <Input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder={
                  operation === 'replace' ? 'Новый текст' :
                  operation === 'prefix' ? 'Текст в начало' : 'Текст в конец'
                }
              />
            </div>
          )}

          {/* Предпросмотр */}
          {findText && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-600 mb-1">Предпросмотр:</div>
              <div className="text-sm">
                Будет обработано: <strong>
                  {phrases.filter(p => 
                    selectedIds.includes(p.id) && 
                    (operation === 'prefix' || operation === 'suffix' || p.text.includes(findText))
                  ).length}
                </strong> фраз
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={handleApply} variant="primary">
            Применить
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const MassBulkPanel: React.FC<MassBulkPanelProps> = ({ selectedCount, selectedIds }) => {
  const { 
    groups, 
    movePhrasesToGroup, 
    copyPhrasesToGroup,
    deleteSelectedPhrases, 
    addLog 
  } = useStore();
  
  const [showGroupSelect, setShowGroupSelect] = React.useState<'move' | 'copy' | null>(null);
  const [isMassEditOpen, setIsMassEditOpen] = React.useState(false);

  const handleGroupAction = async (groupId: string, action: 'move' | 'copy') => {
    if (action === 'move') {
      await movePhrasesToGroup(selectedIds, groupId);
      addLog('success', `Перемещено ${selectedCount} фраз`);
    } else {
      copyPhrasesToGroup(selectedIds, groupId);
      addLog('success', `Скопировано ${selectedCount} фраз`);
    }
    setShowGroupSelect(null);
  };

  const handleDelete = async () => {
    if (confirm(`Удалить выделенные фразы (${selectedCount} шт.)?`)) {
      await deleteSelectedPhrases(selectedIds);
    }
  };

  const handleCopyToClipboard = () => {
    const { phrases } = useStore.getState();
    const selectedPhrases = phrases.filter(p => selectedIds.includes(p.id));
    const text = selectedPhrases.map(p => p.text).join('\n');
    navigator.clipboard.writeText(text);
    addLog('success', `Скопировано ${selectedCount} фраз в буфер`);
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg z-10">
        <span className="font-semibold">Выбрано: {selectedCount}</span>
        
        {/* Кнопки действий */}
        <div className="flex gap-2 flex-1">
          {/* Переместить */}
          <div className="relative">
            <Button
              onClick={() => setShowGroupSelect(showGroupSelect === 'move' ? null : 'move')}
              variant="secondary"
              className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              ➡️ Переместить
            </Button>
            {showGroupSelect === 'move' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded shadow-lg py-1 min-w-[200px] max-h-[200px] overflow-auto z-50">
                {groups.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Нет групп</div>
                ) : (
                  groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGroupAction(g.id, 'move')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                    >
                      {g.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Копировать */}
          <div className="relative">
            <Button
              onClick={() => setShowGroupSelect(showGroupSelect === 'copy' ? null : 'copy')}
              variant="secondary"
              className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              📋 Копировать
            </Button>
            {showGroupSelect === 'copy' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded shadow-lg py-1 min-w-[200px] max-h-[200px] overflow-auto z-50">
                {groups.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Нет групп</div>
                ) : (
                  groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleGroupAction(g.id, 'copy')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                    >
                      {g.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Редактировать */}
          <Button
            onClick={() => setIsMassEditOpen(true)}
            variant="secondary"
            className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            ✏️ Редактировать
          </Button>

          {/* Копировать в буфер */}
          <Button
            onClick={handleCopyToClipboard}
            variant="secondary"
            className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            📄 В буфер
          </Button>

          {/* Удалить */}
          <Button
            onClick={handleDelete}
            variant="danger"
            className="text-sm bg-red-500/80 hover:bg-red-600 text-white border-red-400"
          >
            🗑️ Удалить
          </Button>
        </div>
      </div>

      {/* Модал массового редактирования */}
      <MassEditModal
        isOpen={isMassEditOpen}
        onClose={() => setIsMassEditOpen(false)}
        selectedIds={selectedIds}
      />
    </>
  );
};
