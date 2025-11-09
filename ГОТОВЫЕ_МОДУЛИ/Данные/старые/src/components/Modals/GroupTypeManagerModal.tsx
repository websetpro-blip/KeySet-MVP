import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, FolderPlus } from 'lucide-react';

interface GroupTypeManagerModalProps {
  onClose: () => void;
}

export const GroupTypeManagerModal: React.FC<GroupTypeManagerModalProps> = ({ onClose }) => {
  const { addGroup, phrases, stopwords, addLog } = useStore();
  
  const [selectedType, setSelectedType] = useState<'normal' | 'mask' | 'stopwords' | 'frequency'>('normal');
  const [groupName, setGroupName] = useState('');
  const [maskPattern, setMaskPattern] = useState('');
  const [frequencyThreshold, setFrequencyThreshold] = useState(1000);
  const [selectedStopwords, setSelectedStopwords] = useState<Set<string>>(new Set());

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      addLog('warning', 'Введите название группы');
      return;
    }

    // Создаем базовую группу
    addGroup(groupName, null);
    
    // Получаем ID только что созданной группы
    const state = useStore.getState();
    const newGroup = state.groups[state.groups.length - 1];
    
    if (!newGroup) return;

    // Обновляем тип группы
    state.updateGroup(newGroup.id, { type: selectedType });

    // Применяем логику в зависимости от типа
    let movedCount = 0;
    
    switch (selectedType) {
      case 'mask': {
        if (!maskPattern.trim()) {
          addLog('warning', 'Введите регулярное выражение');
          return;
        }
        
        try {
          const regex = new RegExp(maskPattern, 'i');
          const matchingIds = phrases
            .filter(p => regex.test(p.text))
            .map(p => p.id);
          
          if (matchingIds.length > 0) {
            state.movePhrases(matchingIds, newGroup.id);
            movedCount = matchingIds.length;
          }
        } catch (error) {
          addLog('error', 'Неверное регулярное выражение');
          return;
        }
        break;
      }
      
      case 'stopwords': {
        if (selectedStopwords.size === 0) {
          addLog('warning', 'Выберите хотя бы одно стоп-слово');
          return;
        }
        
        const matchingIds = phrases
          .filter(p => {
            const text = p.text.toLowerCase();
            return Array.from(selectedStopwords).some(sw => text.includes(sw.toLowerCase()));
          })
          .map(p => p.id);
        
        if (matchingIds.length > 0) {
          state.movePhrases(matchingIds, newGroup.id);
          movedCount = matchingIds.length;
        }
        break;
      }
      
      case 'frequency': {
        const matchingIds = phrases
          .filter(p => p.ws >= frequencyThreshold)
          .map(p => p.id);
        
        if (matchingIds.length > 0) {
          state.movePhrases(matchingIds, newGroup.id);
          movedCount = matchingIds.length;
        }
        break;
      }
    }

    addLog('success', `Группа "${groupName}" создана (${movedCount} фраз перемещено)`);
    onClose();
  };

  const toggleStopword = (word: string) => {
    const newSet = new Set(selectedStopwords);
    if (newSet.has(word)) {
      newSet.delete(word);
    } else {
      newSet.add(word);
    }
    setSelectedStopwords(newSet);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[700px] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderPlus className="w-6 h-6" />
            Управление типами групп
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Название группы */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Название группы:</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Введите название"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Выбор типа группы */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Тип группы:</label>
            <div className="space-y-2">
              {[
                { value: 'normal', label: '📁 Обычная группа', desc: 'Стандартная группа без автоматических правил' },
                { value: 'mask', label: '🎭 По маске (регулярное выражение)', desc: 'Фразы, соответствующие регулярному выражению' },
                { value: 'stopwords', label: '🚫 По стоп-словам', desc: 'Фразы, содержащие выбранные стоп-слова' },
                { value: 'frequency', label: '📊 По частоте', desc: 'Фразы с частотой выше заданного порога' },
              ].map(type => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="groupType"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={() => setSelectedType(type.value as any)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Настройки для выбранного типа */}
          {selectedType === 'mask' && (
            <div className="p-4 bg-gray-50 rounded border">
              <label className="block text-sm font-medium mb-2">Регулярное выражение:</label>
              <input
                type="text"
                value={maskPattern}
                onChange={(e) => setMaskPattern(e.target.value)}
                placeholder="Например: ^\d+$"
                className="w-full px-3 py-2 border rounded"
              />
              <div className="mt-2 text-sm text-gray-600">
                Примеры: <code>^\d+$</code> (только цифры), <code>купить.*цена</code> (содержит оба слова)
              </div>
            </div>
          )}

          {selectedType === 'stopwords' && (
            <div className="p-4 bg-gray-50 rounded border max-h-60 overflow-auto">
              <label className="block text-sm font-medium mb-2">Выберите стоп-слова:</label>
              {stopwords.length === 0 ? (
                <div className="text-sm text-gray-500">Стоп-слова не добавлены</div>
              ) : (
                <div className="space-y-1">
                  {stopwords.map(sw => (
                    <label key={sw.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStopwords.has(sw.text)}
                        onChange={() => toggleStopword(sw.text)}
                        className="w-4 h-4"
                      />
                      <span>{sw.text}</span>
                      <span className="text-xs text-gray-500">({sw.category})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedType === 'frequency' && (
            <div className="p-4 bg-gray-50 rounded border">
              <label className="block text-sm font-medium mb-2">
                Минимальная частота (ws):
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={frequencyThreshold}
                onChange={(e) => setFrequencyThreshold(parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border rounded"
              />
              <div className="mt-2 text-sm text-gray-600">
                Будут перемещены фразы с ws ≥ {frequencyThreshold}
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="border-t p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Создать группу
          </button>
        </div>
      </div>
    </div>
  );
};
