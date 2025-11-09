import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { useStore } from '../../store/useStore';
import { findMorphologicalDuplicates, findExactDuplicates, removeMorphologicalDuplicates } from '../../utils/duplicates';
import { Info, Trash2, AlertTriangle } from 'lucide-react';
import type { Phrase } from '../../types';

interface MorphDuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MorphDuplicatesModal: React.FC<MorphDuplicatesModalProps> = ({ isOpen, onClose }) => {
  const { phrases, deletePhrases, addLog } = useStore();
  
  const [activeTab, setActiveTab] = React.useState<'exact' | 'morph'>('morph');
  const [duplicateGroups, setDuplicateGroups] = React.useState<Phrase[][]>([]);
  const [toDelete, setToDelete] = React.useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const analyzeDuplicates = React.useCallback(() => {
    setIsAnalyzing(true);
    setToDelete(new Set());
    
    try {
      const groups = activeTab === 'morph' 
        ? findMorphologicalDuplicates(phrases)
        : findExactDuplicates(phrases);
      
      setDuplicateGroups(groups);
      
      // Автоматически выбираем дубли для удаления (оставляем первый - самый сильный)
      const idsToDelete = new Set<string>();
      groups.forEach(group => {
        group.slice(1).forEach(phrase => idsToDelete.add(phrase.id));
      });
      setToDelete(idsToDelete);
      
      addLog('info', `Найдено групп дублей: ${groups.length}`);
    } catch (error) {
      addLog('error', `Ошибка анализа дублей: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeTab, phrases, addLog]);

  React.useEffect(() => {
    if (isOpen) {
      analyzeDuplicates();
    }
  }, [isOpen, analyzeDuplicates]);

  const togglePhrase = (phraseId: string) => {
    const newSet = new Set(toDelete);
    if (newSet.has(phraseId)) {
      newSet.delete(phraseId);
    } else {
      newSet.add(phraseId);
    }
    setToDelete(newSet);
  };

  const handleRemoveDuplicates = () => {
    if (toDelete.size === 0) {
      addLog('warning', 'Не выбраны фразы для удаления');
      return;
    }

    deletePhrases(Array.from(toDelete));
    addLog('success', `Удалено дублей: ${toDelete.size}`);
    onClose();
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Поиск и удаление дублей"
      size="lg"
    >
      <div className="space-y-4">
        {/* Описание */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p>
              <strong>Точные дубли</strong> - фразы с идентичным текстом.<br />
              <strong>Морфологические дубли</strong> - фразы с одинаковыми основами слов 
              (например, "купить телефон" и "покупка телефонов").
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('morph')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'morph'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Морфологические дубли
          </button>
          <button
            onClick={() => setActiveTab('exact')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'exact'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Точные дубли
          </button>
        </div>

        {/* Статистика */}
        {duplicateGroups.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Найдено групп: <strong>{duplicateGroups.length}</strong>
              </p>
              <p className="text-sm text-gray-700">
                Всего дублей: <strong>{totalDuplicates}</strong>
              </p>
            </div>
            <div className="text-sm text-gray-700">
              К удалению: <strong className="text-red-600">{toDelete.size}</strong>
            </div>
          </div>
        )}

        {/* Список групп дублей */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              Анализ дублей...
            </div>
          )}

          {!isAnalyzing && duplicateGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Дубли не найдены</p>
            </div>
          )}

          {!isAnalyzing && duplicateGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="border rounded-lg p-3 bg-white">
              <p className="text-xs text-gray-500 mb-2">Группа {groupIdx + 1} ({group.length} фраз)</p>
              <div className="space-y-2">
                {group.map((phrase, phraseIdx) => {
                  const isMain = phraseIdx === 0;
                  const isSelected = toDelete.has(phrase.id);
                  
                  return (
                    <div
                      key={phrase.id}
                      className={`flex items-start gap-2 p-2 rounded ${
                        isMain ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      {!isMain && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => togglePhrase(phrase.id)}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{phrase.text}</span>
                          {isMain && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                              Оставить
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>ws: {phrase.ws || 0}</span>
                          <span>qws: {phrase.qws || 0}</span>
                          <span>bws: {phrase.bws || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Предупреждение */}
        {toDelete.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              Будет удалено <strong>{toDelete.size}</strong> фраз. 
              В каждой группе остается фраза с наибольшим ws.
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Button
            onClick={analyzeDuplicates}
            variant="secondary"
            size="sm"
            disabled={isAnalyzing}
          >
            Обновить анализ
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary" size="sm">
              Отмена
            </Button>
            <Button
              onClick={handleRemoveDuplicates}
              variant="danger"
              size="sm"
              disabled={toDelete.size === 0}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Удалить ({toDelete.size})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
