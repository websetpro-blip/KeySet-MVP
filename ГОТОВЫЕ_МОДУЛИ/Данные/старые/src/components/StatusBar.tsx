import React from 'react';
import { useStore } from '../store/useStore';

export const StatusBar: React.FC = () => {
  const { phrases, selectedPhraseIds, selectedGroupId, groups } = useStore();

  const totalCount = phrases.length;
  const selectedCount = selectedPhraseIds.size;
  const groupedCount = selectedGroupId 
    ? phrases.filter(p => p.groupId === selectedGroupId).length 
    : 0;
  
  // Подсчет дублей
  const duplicatesCount = React.useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    phrases.forEach(p => {
      if (seen.has(p.text.toLowerCase())) {
        count++;
      } else {
        seen.add(p.text.toLowerCase());
      }
    });
    return count;
  }, [phrases]);
  
  // Подсчет фраз со стоп-словами
  const stopwordsCount = phrases.filter(p => p.hasStopword).length;
  
  // Подсчет фраз без группы
  const ungroupedCount = phrases.filter(p => !p.groupId).length;

  return (
    <div className="h-8 bg-gray-50 border-t border-gray-200 px-4 flex items-center justify-between text-xs text-gray-600">
      <div className="flex items-center gap-6">
        <span>
          Всего: <strong className="text-gray-900">{totalCount}</strong>
        </span>
        <span>
          Выделено: <strong className="text-blue-600">{selectedCount}</strong>
        </span>
        {selectedGroupId && (
          <span>
            В группе: <strong className="text-green-600">{groupedCount}</strong>
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        <span>
          Групп: <strong className="text-gray-900">{groups.length}</strong>
        </span>
        <span>
          Без группы: <strong className="text-orange-600">{ungroupedCount}</strong>
        </span>
        {duplicatesCount > 0 && (
          <span>
            Дублей: <strong className="text-red-600">{duplicatesCount}</strong>
          </span>
        )}
        {stopwordsCount > 0 && (
          <span>
            Стоп-слова: <strong className="text-red-600">{stopwordsCount}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
