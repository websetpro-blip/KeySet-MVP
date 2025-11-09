import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { X, Search } from 'lucide-react';

interface SimilarPhrasesModalProps {
  onClose: () => void;
}

interface WordGroup {
  word: string;
  count: number;
  phrases: string[];
}

export const SimilarPhrasesModal: React.FC<SimilarPhrasesModalProps> = ({ onClose }) => {
  const { phrases, stopwords, addGroup, movePhrases, addLog } = useStore();
  const [minOccurrences, setMinOccurrences] = useState(3);
  const [excludeStopwords, setExcludeStopwords] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Анализ фраз по составу слов
  const wordGroups = useMemo(() => {
    const wordMap = new Map<string, string[]>();
    const stopwordSet = new Set(stopwords.map(sw => sw.text.toLowerCase()));

    phrases.forEach(phrase => {
      const words = phrase.text.toLowerCase().split(/\s+/);
      
      words.forEach(word => {
        // Пропускаем короткие слова и стоп-слова
        if (word.length < 3) return;
        if (excludeStopwords && stopwordSet.has(word)) return;

        if (!wordMap.has(word)) {
          wordMap.set(word, []);
        }
        wordMap.get(word)!.push(phrase.id);
      });
    });

    // Преобразуем в массив и фильтруем по минимальному количеству
    const groups: WordGroup[] = [];
    wordMap.forEach((phraseIds, word) => {
      const uniqueIds = [...new Set(phraseIds)];
      if (uniqueIds.length >= minOccurrences) {
        groups.push({
          word,
          count: uniqueIds.length,
          phrases: uniqueIds,
        });
      }
    });

    // Сортируем по убыванию количества
    return groups.sort((a, b) => b.count - a.count);
  }, [phrases, stopwords, minOccurrences, excludeStopwords]);

  const handleAnalyze = () => {
    setShowResults(true);
    addLog('info', `Анализ завершен: найдено ${wordGroups.length} групп слов`);
  };

  const handleCreateGroup = (wordGroup: WordGroup) => {
    const groupName = `Группа "${wordGroup.word}"`;
    addGroup(groupName, null);
    
    // Получаем ID только что созданной группы
    const newGroupId = useStore.getState().groups[useStore.getState().groups.length - 1]?.id;
    
    if (newGroupId) {
      movePhrases(wordGroup.phrases, newGroupId);
      addLog('success', `Создана группа "${groupName}" (${wordGroup.count} фраз)`);
    }
  };

  const handleCreateAllGroups = () => {
    let created = 0;
    wordGroups.slice(0, 20).forEach(wordGroup => {
      handleCreateGroup(wordGroup);
      created++;
    });
    addLog('success', `Создано групп: ${created}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[700px] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">🔍 Поиск похожих фраз</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Настройки анализа */}
        <div className="p-6 bg-gray-50 border-b space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Минимум повторений слова:
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={minOccurrences}
              onChange={(e) => setMinOccurrences(parseInt(e.target.value) || 2)}
              className="w-24 px-3 py-2 border rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              (минимальное количество фраз со словом для создания группы)
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeStopwords}
              onChange={(e) => setExcludeStopwords(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Исключить стоп-слова из анализа</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Анализировать
            </button>
            
            {showResults && wordGroups.length > 0 && (
              <button
                onClick={handleCreateAllGroups}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Создать все группы (первые 20)
              </button>
            )}
          </div>
        </div>

        {/* Результаты */}
        <div className="flex-1 overflow-auto p-6">
          {!showResults ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">Настройте параметры и нажмите "Анализировать"</p>
              <p className="text-sm">
                Система найдет слова, которые часто встречаются в ваших фразах
              </p>
            </div>
          ) : wordGroups.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">Групп не найдено</p>
              <p className="text-sm">
                Попробуйте уменьшить минимум повторений или отключить исключение стоп-слов
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Найдено групп: {wordGroups.length}
              </div>
              
              {wordGroups.map((group, index) => (
                <div
                  key={index}
                  className="border rounded p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-lg">"{group.word}"</span>
                      <span className="ml-3 text-gray-600">
                        {group.count} {group.count === 1 ? 'фраза' : group.count < 5 ? 'фразы' : 'фраз'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreateGroup(group)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                    >
                      Создать группу
                    </button>
                  </div>
                  
                  {/* Превью первых 3 фраз */}
                  <div className="mt-2 text-sm text-gray-600">
                    {group.phrases.slice(0, 3).map(phraseId => {
                      const phrase = phrases.find(p => p.id === phraseId);
                      return phrase ? (
                        <div key={phraseId} className="truncate">• {phrase.text}</div>
                      ) : null;
                    })}
                    {group.phrases.length > 3 && (
                      <div className="text-gray-500 italic">
                        ... и еще {group.phrases.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
