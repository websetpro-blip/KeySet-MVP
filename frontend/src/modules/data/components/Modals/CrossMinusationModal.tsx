import React from 'react';
import { X, Info, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { useStore } from '../../store/useStore';
import { computeCrossMinusation } from '../../utils/crossMinusate';
import type { CrossMinusationMatch } from '../../utils/crossMinusate';

interface CrossMinusationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrossMinusationModal: React.FC<CrossMinusationModalProps> = ({ isOpen, onClose }) => {
  const { phrases, updatePhrase, addLog } = useStore();
  const safePhrases = Array.isArray(phrases) ? phrases : [];
  
  const [useMorphology, setUseMorphology] = React.useState(true);
  const [minOverlap, setMinOverlap] = React.useState(50);
  const [isComputing, setIsComputing] = React.useState(false);
  const [matches, setMatches] = React.useState<CrossMinusationMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = React.useState<Set<number>>(new Set());
  const [isApplied, setIsApplied] = React.useState(false);

  const handleCompute = () => {
    setIsComputing(true);
    setIsApplied(false);
    
    if (safePhrases.length === 0) {
      addLog?.('warning', 'Нет фраз для анализа');
      return;
    }

    try {
      const result = computeCrossMinusation(safePhrases, useMorphology, minOverlap);
      setMatches(result.matches);
      setSelectedMatches(new Set(result.matches.map((_, idx) => idx)));
      addLog?.('success', `Найдено совпадений: ${result.matches.length}`);
    } catch (error) {
      addLog?.('error', `Ошибка кросс-минусации: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    } finally {
      setIsComputing(false);
    }
  };

  const handleApply = () => {
    let appliedCount = 0;
    
    matches.forEach((match, idx) => {
      if (selectedMatches.has(idx)) {
        // Добавляем минус-термы к исходной фразе
        const currentMinusTerms = match.sourcePhrase.minusTerms || [];
        const newMinusTerms = [...new Set([...currentMinusTerms, ...match.additionalTokens])];
        
        updatePhrase(match.sourcePhrase.id, { minusTerms: newMinusTerms });
        appliedCount++;
      }
    });
    
    setIsApplied(true);
    addLog?.('success', `Применено минус-слов: ${appliedCount} фраз`);
  };

  const toggleMatch = (idx: number) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedMatches(newSelected);
  };

  const selectAll = () => {
    setSelectedMatches(new Set(matches.map((_, idx) => idx)));
  };

  const deselectAll = () => {
    setSelectedMatches(new Set());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Кросс-минусация"
      size="lg"
    >
      <div className="space-y-4">
        {/* Описание */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Что такое кросс-минусация?</p>
            <p>Автоматическое добавление минус-слов к фразам на основе анализа пересечений. 
            Если фраза A содержит все слова фразы B плюс дополнительные, то к фразе B добавляются 
            минус-слова из разницы.</p>
          </div>
        </div>

        {/* Настройки */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Настройки анализа</h3>
          
          <div className="flex items-center gap-2">
            <Checkbox
              checked={useMorphology}
              onChange={() => setUseMorphology(!useMorphology)}
            />
            <label className="text-sm text-gray-700">
              Использовать морфологический анализ (учет словоформ)
            </label>
          </div>

          <div>
            <label className="text-sm text-gray-700 block mb-1">
              Минимальный процент пересечения: {minOverlap}%
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={minOverlap}
              onChange={(e) => setMinOverlap(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Больше совпадений</span>
              <span>Точнее совпадения</span>
            </div>
          </div>

          <Button
            onClick={handleCompute}
            disabled={isComputing}
            variant="primary"
            size="sm"
          >
            {isComputing ? 'Анализ...' : 'Найти совпадения'}
          </Button>
        </div>

        {/* Результаты */}
        {matches.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-700">
                Найдено совпадений: {matches.length}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Выбрать все
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-600 hover:text-gray-700"
                >
                  Снять выбор
                </button>
              </div>
            </div>

            {/* Список совпадений */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {matches.slice(0, 50).map((match, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleMatch(idx)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedMatches.has(idx)}
                      onChange={() => toggleMatch(idx)}
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {match.sourcePhrase.text}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({match.overlapPercentage}% совпадение)
                        </span>
                      </div>
                      <div className="text-gray-600 mb-1">
                        → Целевая: {match.targetPhrase.text}
                      </div>
                      <div className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded inline-block">
                        Минус-слова: {match.additionalTokens.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {matches.length > 50 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  Показано первых 50 из {matches.length}. Остальные будут применены при нажатии "Применить".
                </div>
              )}
            </div>
          </div>
        )}

        {matches.length === 0 && !isComputing && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Нажмите "Найти совпадения" для начала анализа</p>
          </div>
        )}

        {/* Уведомление об успешном применении */}
        {isApplied && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="text-sm text-green-800">
              Минус-слова успешно добавлены! Выбранные фразы обновлены.
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={onClose} variant="secondary" size="sm">
            Закрыть
          </Button>
          {matches.length > 0 && !isApplied && (
            <Button
              onClick={handleApply}
              variant="primary"
              size="sm"
              disabled={selectedMatches.size === 0}
            >
              Применить ({selectedMatches.size})
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
