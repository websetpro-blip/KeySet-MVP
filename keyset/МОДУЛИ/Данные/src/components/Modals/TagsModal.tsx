import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { PhraseTag } from '../../types';
import { Modal } from '../ui/Modal';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const predefinedColors = [
  '#ef4444', // красный
  '#f97316', // оранжевый
  '#f59e0b', // янтарный
  '#eab308', // желтый
  '#84cc16', // лайм
  '#22c55e', // зеленый
  '#10b981', // изумруд
  '#14b8a6', // бирюзовый
  '#06b6d4', // циан
  '#0ea5e9', // небесный
  '#3b82f6', // синий
  '#6366f1', // индиго
  '#8b5cf6', // фиолетовый
  '#a855f7', // пурпурный
  '#d946ef', // фуксия
  '#ec4899', // розовый
];

const TagsModal: React.FC<TagsModalProps> = ({ isOpen, onClose }) => {
  const { 
    phraseTags, 
    phrases, 
    selectedPhraseIds,
    addPhraseTag, 
    assignTagToPhrase, 
    removeTagFromPhrase,
    deletePhraseTag, 
    addLog 
  } = useStore();
  
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1'
  });
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setFormData({ name: '', color: '#6366f1' });
    setMode('create');
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      addLog('warning', 'Введите название тега');
      return;
    }

    addPhraseTag(formData.name, formData.color);
    setMode('list');
    addLog('success', `Тег создан: ${formData.name}`);
  };

  const handleDelete = (tag: PhraseTag) => {
    const usageCount = phrases.filter(p => p.tags?.includes(tag.id)).length;
    const confirmMsg = usageCount > 0 
      ? `Удалить тег "${tag.name}"?\n\nТег используется в ${usageCount} фразах.`
      : `Удалить тег "${tag.name}"?`;

    if (confirm(confirmMsg)) {
      deletePhraseTag(tag.id);
      addLog('success', `Тег удален: ${tag.name}`);
    }
  };

  const handleAssignToSelected = (tagId: string) => {
    if (selectedPhraseIds.size === 0) {
      addLog('warning', 'Выберите фразы для назначения тега');
      return;
    }

    Array.from(selectedPhraseIds).forEach(phraseId => {
      const phrase = phrases.find(p => p.id === phraseId);
      if (phrase && !phrase.tags?.includes(tagId)) {
        assignTagToPhrase(phraseId, tagId);
      }
    });

    const tag = phraseTags.find(t => t.id === tagId);
    addLog('success', `Тег "${tag?.name}" назначен ${selectedPhraseIds.size} фразам`);
  };

  const handleRemoveFromSelected = (tagId: string) => {
    if (selectedPhraseIds.size === 0) {
      addLog('warning', 'Выберите фразы для удаления тега');
      return;
    }

    Array.from(selectedPhraseIds).forEach(phraseId => {
      removeTagFromPhrase(phraseId, tagId);
    });

    const tag = phraseTags.find(t => t.id === tagId);
    addLog('success', `Тег "${tag?.name}" удален с ${selectedPhraseIds.size} фраз`);
  };

  const handleCancel = () => {
    setMode('list');
  };

  const getTagUsageCount = (tagId: string) => {
    return phrases.filter(p => p.tags?.includes(tagId)).length;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredPhrases = filterTagId 
    ? phrases.filter(p => p.tags?.includes(filterTagId))
    : phrases;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Управление тегами" size="lg">
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
                  <div className="text-sm font-medium text-blue-900">О тегах</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Теги позволяют категоризировать фразы. Используйте их для маркировки типов запросов,
                    приоритетов или любых других параметров. Теги включаются в экспорт.
                  </div>
                </div>
              </div>
            </div>

            {/* Список тегов */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Доступные теги ({phraseTags.length})
                </h3>
                <button
                  onClick={handleCreateNew}
                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Создать тег
                </button>
              </div>

              {phraseTags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">Нет созданных тегов</div>
                  <div className="text-xs mt-1">Создайте теги для категоризации фраз</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {phraseTags.map(tag => {
                    const usageCount = getTagUsageCount(tag.id);
                    return (
                      <div key={tag.id} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{tag.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Использован: {usageCount} раз • Создан: {formatDate(tag.created)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleAssignToSelected(tag.id)}
                              disabled={selectedPhraseIds.size === 0}
                              className={`
                                px-2 py-1 text-xs rounded transition-colors
                                ${selectedPhraseIds.size === 0
                                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100'
                                }
                              `}
                              title="Назначить выделенным фразам"
                            >
                              Назначить
                            </button>
                            <button
                              onClick={() => handleRemoveFromSelected(tag.id)}
                              disabled={selectedPhraseIds.size === 0}
                              className={`
                                px-2 py-1 text-xs rounded transition-colors
                                ${selectedPhraseIds.size === 0
                                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                                }
                              `}
                              title="Удалить с выделенных фраз"
                            >
                              Снять
                            </button>
                            <button
                              onClick={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)}
                              className={`
                                px-2 py-1 text-xs rounded transition-colors
                                ${filterTagId === tag.id
                                  ? 'text-indigo-700 bg-indigo-100'
                                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                }
                              `}
                              title="Показать фразы с этим тегом"
                            >
                              Фильтр
                            </button>
                            <button
                              onClick={() => handleDelete(tag)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Статистика выделения */}
            {selectedPhraseIds.size > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-900">Выделено фраз: {selectedPhraseIds.size}</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Используйте кнопки "Назначить" и "Снять" для массовой работы с тегами
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Фильтр */}
            {filterTagId && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-indigo-900">
                    Показаны фразы с тегом: <span className="font-medium">{phraseTags.find(t => t.id === filterTagId)?.name}</span> ({filteredPhrases.length})
                  </div>
                  <button
                    onClick={() => setFilterTagId(null)}
                    className="text-sm text-indigo-700 hover:text-indigo-800 font-medium"
                  >
                    Сбросить фильтр
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название тега *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Информационный, Коммерческий, Приоритет"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Цвет */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите цвет
              </label>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`
                      w-10 h-10 rounded-lg transition-all
                      ${formData.color === color 
                        ? 'ring-2 ring-offset-2 ring-gray-900' 
                        : 'hover:scale-110'
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Предпросмотр */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm text-gray-900">
                  {formData.name || 'Название тега'}
                </span>
              </div>
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
                Создать тег
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

export default TagsModal;
