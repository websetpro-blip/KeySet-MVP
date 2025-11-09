import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

export const ParsingSimulationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { phrases, updatePhrase, setProcessProgress, addLog } = useStore();
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);

  const handleStartParsing = async () => {
    setIsParsing(true);
    const totalPhrases = phrases.length;
    setTotal(totalPhrases);

    for (let i = 0; i < totalPhrases; i++) {
      // Генерируем случайные частоты
      const ws = Math.floor(Math.random() * 5000) + 100;
      const qws = Math.floor(ws * 0.7);
      const bws = Math.floor(ws * 0.3);

      // Обновляем фразу
      updatePhrase(phrases[i].id, {
        ws,
        qws,
        bws,
        status: 'success'
      });

      // Показываем прогресс
      const progressValue = Math.round(((i + 1) / totalPhrases) * 100);
      setProgress(progressValue);
      setCurrent(i + 1);
      setProcessProgress(progressValue, i + 1, totalPhrases);
      
      if ((i + 1) % 10 === 0 || i === totalPhrases - 1) {
        addLog('info', `Парсинг: ${i + 1}/${totalPhrases} фраз (${progressValue}%)`);
      }

      // Имитируем задержку
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    setIsParsing(false);
    addLog('success', `Парсинг завершён: ${totalPhrases} фраз обработано`);
    
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-[500px] shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Парсинг частот</h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Симуляция парсинга {phrases.length} фраз из Yandex Wordstat
          </p>

          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded overflow-hidden h-8 mb-2">
            <div
              className="h-full bg-blue-500 transition-all flex items-center justify-center text-white text-sm font-bold"
              style={{ width: `${progress}%` }}
            >
              {progress > 0 && `${progress}%`}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {current} / {total}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStartParsing}
            disabled={isParsing || phrases.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? 'Парсинг...' : 'Начать парсинг'}
          </button>
          <button
            onClick={onClose}
            disabled={isParsing}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
