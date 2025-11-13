import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

export const ParsingSimulationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { phrases, updatePhrase, setProcessProgress, addLog } = useStore();
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleStartParsing = async () => {
    setIsParsing(true);
    setError(null);
    const totalPhrases = phrases.length;
    setTotal(totalPhrases);

    try {
      // Вызываем реальный API Wordstat
      addLog('info', `Запуск парсинга ${totalPhrases} фраз через TurboParser...`);

      const response = await fetch('/api/wordstat/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phrases: phrases.map(p => p.text),
          modes: {
            ws: true,   // Обычная частотность
            qws: true,  // В кавычках
            bws: true   // Восклицательный знак
          },
          regions: [225], // Россия
          profile: null   // Все аккаунты
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const results = await response.json();

      // Обновляем фразы реальными результатами
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const phrase = phrases.find(p => p.text === result.phrase);

        if (phrase) {
          updatePhrase(phrase.id, {
            ws: typeof result.ws === 'number' ? result.ws : null,
            qws: typeof result.qws === 'number' ? result.qws : null,
            bws: typeof result.bws === 'number' ? result.bws : null,
            status: result.status === 'OK' ? 'success' : 'error'
          });
        }

        // Показываем прогресс
        const progressValue = Math.round(((i + 1) / results.length) * 100);
        setProgress(progressValue);
        setCurrent(i + 1);
        setProcessProgress(progressValue, i + 1, results.length);

        if ((i + 1) % 10 === 0 || i === results.length - 1) {
          addLog('info', `Парсинг: ${i + 1}/${results.length} фраз (${progressValue}%)`);
        }
      }

      setIsParsing(false);
      addLog('success', `Парсинг завершён: ${results.length} фраз обработано`);

      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setIsParsing(false);
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMsg);
      addLog('error', `Ошибка парсинга: ${errorMsg}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-[500px] shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Парсинг частот</h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Парсинг {phrases.length} фраз из Yandex Wordstat через TurboParser (5 браузеров × 10 табов)
          </p>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded overflow-hidden h-8 mb-2">
            <div
              className={`h-full ${error ? 'bg-red-500' : 'bg-blue-500'} transition-all flex items-center justify-center text-white text-sm font-bold`}
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
