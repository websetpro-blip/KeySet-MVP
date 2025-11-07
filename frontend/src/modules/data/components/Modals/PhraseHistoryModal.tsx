import React from 'react';
import { useStore } from '../../store/useStore';
import { X } from 'lucide-react';

interface PhraseHistoryModalProps {
  phraseId: string;
  onClose: () => void;
}

export const PhraseHistoryModal: React.FC<PhraseHistoryModalProps> = ({ phraseId, onClose }) => {
  const { phrases } = useStore();
  
  const phrase = phrases.find(p => p.id === phraseId);
  
  if (!phrase) {
    return null;
  }

  const history = phrase.history || [];

  // Форматирование типа действия
  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      created: '✨ Создано',
      edited: '✏️ Отредактировано',
      moved: '➡️ Перемещено',
      colored: '🎨 Изменен цвет',
      locked: '🔒 Заблокировано',
      unlocked: '🔓 Разблокировано',
    };
    return labels[action] || action;
  };

  // Форматирование даты
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[600px] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">📜 История изменений</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Информация о фразе */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="text-sm text-gray-600">Фраза:</div>
          <div className="text-lg font-semibold">{phrase.text}</div>
        </div>

        {/* История */}
        <div className="flex-1 overflow-auto p-6">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">История изменений пуста</p>
              <p className="text-sm">Все изменения фразы будут отображаться здесь</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{getActionLabel(entry.action)}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  
                  {entry.oldValue && entry.newValue && (
                    <div className="mt-2 text-sm">
                      <div className="text-gray-600">
                        <span className="font-medium">Было:</span>{' '}
                        <span className="line-through">{entry.oldValue}</span>
                      </div>
                      <div className="text-green-700">
                        <span className="font-medium">Стало:</span>{' '}
                        <span>{entry.newValue}</span>
                      </div>
                    </div>
                  )}
                  
                  {entry.details && (
                    <div className="mt-1 text-sm text-gray-600">{entry.details}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Всего записей: {history.length}
          </div>
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
