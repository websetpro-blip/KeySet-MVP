import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { 
  ppcCleanupPipeline, 
  infoCleanupPipeline, 
  quickCleanupPipeline, 
  runPipeline,
  type PipelineStep 
} from '../../utils/pipelines';
import { Modal } from '../ui/Modal';

interface PipelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PipelineType = 'ppc' | 'seo' | 'quick';

interface PipelineConfig {
  name: string;
  description: string;
  steps: PipelineStep[];
  stepNames: string[];
}

const pipelines: Record<PipelineType, PipelineConfig> = {
  ppc: {
    name: 'Очистка PPC',
    description: 'Подготовка запросов для рекламных кампаний (Яндекс.Директ/Google Ads)',
    steps: ppcCleanupPipeline,
    stepNames: [
      'Удаление точных дублей',
      'Нормализация текста',
      'Удаление мусора',
      'Удаление морфологических дублей',
      'Удаление стоп-слов',
      'Кросс-минусация',
      'Фильтрация низкочастотных (<100)'
    ]
  },
  seo: {
    name: 'Очистка SEO',
    description: 'Информационные запросы (убрать брендовые/коммерческие)',
    steps: infoCleanupPipeline,
    stepNames: [
      'Нормализация текста',
      'Удаление точных дублей',
      'Удаление мусора',
      'Разметка информационных запросов',
      'Удаление коммерческих запросов',
      'Фильтрация низкочастотных (<50)'
    ]
  },
  quick: {
    name: 'Быстрая очистка',
    description: 'Базовая чистка: дубли + нормализация + мусор',
    steps: quickCleanupPipeline,
    stepNames: [
      'Удаление точных дублей',
      'Нормализация текста',
      'Удаление мусора'
    ]
  }
};

const PipelinesModal: React.FC<PipelinesModalProps> = ({ isOpen, onClose }) => {
  const { phrases, stopwords, setPhrases, addLog } = useStore();
  const safePhrases = Array.isArray(phrases) ? phrases : [];
  const safeStopwords = Array.isArray(stopwords) ? stopwords : [];
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineType>('quick');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const config = pipelines[selectedPipeline];

  const handleRunPipeline = async () => {
    if (safePhrases.length === 0) {
      addLog?.('warning', 'Нет фраз для обработки');
      return;
    }

    setIsProcessing(true);
    setLog([]);
    setCurrentStep(0);
    setShowPreview(false);

    try {
      const context = { phrases: safePhrases, stopwords: safeStopwords };
      const stepLogs: string[] = [];
      let current = { ...context };
      const initialCount = current.phrases?.length || 0;

      // Выполняем каждый шаг с обновлением прогресса
      for (let i = 0; i < config.steps.length; i++) {
        setCurrentStep(i + 1);
        const before = current.phrases?.length || 0;
        
        // Небольшая задержка для визуализации
        await new Promise(resolve => setTimeout(resolve, 100));
        
        current = await config.steps[i](current);
        const after = current.phrases?.length || 0;
        const diff = before - after;

        const stepLog = diff > 0 
          ? `Шаг ${i + 1}/${config.steps.length}: ${config.stepNames[i]} - Удалено ${diff} фраз (осталось ${after})`
          : `Шаг ${i + 1}/${config.steps.length}: ${config.stepNames[i]} - Обработано (осталось ${after})`;
        
        stepLogs.push(stepLog);
        setLog([...stepLogs]);
      }

      const totalRemoved = initialCount - current.phrases.length;
      const finalLog = `Готово! Удалено: ${totalRemoved}/${initialCount} (${((totalRemoved/initialCount)*100).toFixed(1)}%)`;
      stepLogs.push(finalLog);
      setLog([...stepLogs]);

      // Применяем результат
      if (Array.isArray(current.phrases)) {
        setPhrases(current.phrases);
      }
      addLog?.('success', `${config.name}: удалено ${totalRemoved} фраз`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      addLog?.('error', `Ошибка выполнения пайплайна: ${errorMsg}`);
      setLog(prev => [...prev, `Ошибка: ${errorMsg}`]);
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
    const previewLogs = config.stepNames.map((name, idx) => 
      `${idx + 1}. ${name}`
    );
    setLog(previewLogs);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setLog([]);
      setShowPreview(false);
      setCurrentStep(0);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Пайплайны очистки" size="lg">
      <div className="space-y-6">
        {/* Выбор пайплайна */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Выберите пайплайн
          </label>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(pipelines) as PipelineType[]).map((type) => {
              const pipeline = pipelines[type];
              return (
                <button
                  key={type}
                  onClick={() => setSelectedPipeline(type)}
                  disabled={isProcessing}
                  className={`
                    p-4 border rounded-lg text-left transition-all
                    ${selectedPipeline === type 
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' 
                      : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="font-medium text-gray-900">{pipeline.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{pipeline.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Шагов: {pipeline.steps.length}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Описание шагов */}
        {!isProcessing && !showPreview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Этапы обработки:
            </h4>
            <ol className="space-y-2">
              {config.stepNames.map((name, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="inline-block w-6 text-gray-500">{idx + 1}.</span>
                  <span>{name}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Прогресс-бар */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                Выполнение: {currentStep}/{config.steps.length}
              </span>
              <span className="text-gray-500">
                {((currentStep / config.steps.length) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(currentStep / config.steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Лог выполнения */}
        {log.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {log.map((entry, idx) => (
                <div key={idx} className="text-xs font-mono text-gray-300">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">Текущее состояние</div>
              <div className="text-sm text-blue-700 mt-1">
                Фраз в проекте: {phrases.length} | Стоп-слов: {stopwords.length}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {!isProcessing && (
            <>
              <button
                onClick={handlePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Предпросмотр
              </button>
              <button
                onClick={handleRunPipeline}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Запустить пайплайн
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${isProcessing 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {isProcessing ? 'Обработка...' : 'Закрыть'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PipelinesModal;
