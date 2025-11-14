import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Snapshot } from '../../types';
import { Modal } from '../ui/Modal';

interface SnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SnapshotsModal: React.FC<SnapshotsModalProps> = ({ isOpen, onClose }) => {
  const { snapshots, phrases, groups, createSnapshot, restoreSnapshot, deleteSnapshot, addLog } = useStore();
  const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];
  const safePhrases = Array.isArray(phrases) ? phrases : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleCreateNew = () => {
    setFormData({ name: '', description: '' });
    setMode('create');
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      addLog?.('warning', 'Введите название снапшота');
      return;
    }

    createSnapshot(formData.name, formData.description);
    setMode('list');
    addLog?.('success', `Снапшот создан: ${formData.name}`);
  };

  const handleRestore = (snapshot: Snapshot) => {
    if (confirm(`Восстановить снапшот "${snapshot.name}"?\n\nТекущее состояние будет заменено.`)) {
      restoreSnapshot(snapshot.id);
      addLog?.('success', `Снапшот восстановлен: ${snapshot.name}`);
    }
  };

  const handleDelete = (snapshot: Snapshot) => {
    if (confirm(`Удалить снапшот "${snapshot.name}"?`)) {
      deleteSnapshot(snapshot.id);
      addLog?.('success', `Снапшот удален: ${snapshot.name}`);
    }
  };

  const handleCancel = () => {
    setMode('list');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (snapshot: Snapshot) => {
    const phrasesCount = Array.isArray(snapshot.data?.phrases) ? snapshot.data.phrases.length : 0;
    const groupsCount = Array.isArray(snapshot.data?.groups) ? snapshot.data.groups.length : 0;
    return `${phrasesCount} фраз, ${groupsCount} групп`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Управление снапшотами" size="lg">
      <div className="space-y-6">
        {mode === 'list' && (
          <>
            {/* Инфо */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">О снапшотах</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Снапшоты сохраняют полное состояние проекта (фразы, группы, фильтры). 
                    Используйте их перед рискованными операциями. Лимит: 50 снапшотов.
                  </div>
                </div>
              </div>
            </div>

            {/* Текущее состояние */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Текущее состояние</h3>
              <div className="text-sm text-gray-600">
                Фраз: {safePhrases.length} | Групп: {safeGroups.length}
              </div>
            </div>

            {/* Список снапшотов */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Сохраненные снапшоты ({safeSnapshots.length}/50)
                </h3>
                <button
                  onClick={handleCreateNew}
                  disabled={safeSnapshots.length >= 50}
                  className={`
                    px-3 py-1.5 text-sm text-white rounded-lg transition-colors
                    ${safeSnapshots.length >= 50 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                    }
                  `}
                >
                  Создать снапшот
                </button>
              </div>

              {safeSnapshots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">Нет сохраненных снапшотов</div>
                  <div className="text-xs mt-1">Создайте снапшот для сохранения текущего состояния</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {safeSnapshots.slice().reverse().map(snapshot => (
                    <div key={snapshot.id} className="p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{snapshot.name}</div>
                          {snapshot.description && (
                            <div className="text-sm text-gray-600 mt-1">{snapshot.description}</div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{formatDate(snapshot.timestamp)}</span>
                            <span>{formatSize(snapshot)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleRestore(snapshot)}
                            className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                          >
                            Восстановить
                          </button>
                          <button
                            onClick={() => handleDelete(snapshot)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Автоснапшоты */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-900">Автоматические снапшоты</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Снапшоты создаются автоматически перед пайплайнами и другими массовыми операциями.
                    Также работает встроенная система Undo/Redo.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название снапшота *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Перед очисткой"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание (опционально)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание состояния проекта"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Информация о сохраняемых данных */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <div className="font-medium mb-1">Будет сохранено:</div>
              <ul className="space-y-1 ml-4">
                <li>• Фразы: {safePhrases.length}</li>
                <li>• Группы: {safeGroups.length}</li>
                <li>• Фильтры и настройки</li>
              </ul>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Создать снапшот
              </button>
            </div>
          </div>
        )}

        {mode === 'list' && (
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SnapshotsModal;
