import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { useStore } from '../../store/useStore';
import { analyzeDataQuality, quickCleanup, deepCleanup } from '../../services/dataProcessing';
import { Info, Zap, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import type { QualityAnalysisResult, ProcessingResult } from '../../types/enhanced';

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataQualityModal: React.FC<DataQualityModalProps> = ({ isOpen, onClose }) => {
  const { phrases, setPhrases, addLog } = useStore();
  const safePhrases = Array.isArray(phrases) ? phrases : [];
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<QualityAnalysisResult | null>(null);
  const [processingResult, setProcessingResult] = React.useState<ProcessingResult | null>(null);
  const [useMorphology, setUseMorphology] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && !analysis) {
      runAnalysis();
    }
  }, [isOpen]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProcessingResult(null);
    
    try {
      if (safePhrases.length === 0) {
        addLog?.('warning', 'Нет данных для анализа качества');
        return;
      }

      const result = await analyzeDataQuality(safePhrases);
      setAnalysis(result);
      addLog?.('info', `Анализ качества завершен. Оценка: ${result.qualityScore}/100`);
    } catch (error) {
      addLog?.('error', `Ошибка анализа: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickCleanup = async () => {
    setIsProcessing(true);
    
    try {
      if (safePhrases.length === 0) {
        addLog?.('warning', 'Нет фраз для очистки');
        return;
      }

      const result = await quickCleanup(safePhrases, useMorphology);
      
      if (result.success) {
        setPhrases(result.phrases);
        setProcessingResult(result);
        addLog?.('success', `Быстрая очистка: удалено ${result.removed}, изменено ${result.modified} фраз`);
        
        // Обновляем анализ
        await runAnalysis();
      } else {
        addLog?.('error', `Ошибки при очистке: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      addLog?.('error', `Ошибка очистки: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeepCleanup = async () => {
    setIsProcessing(true);
    
    try {
      if (safePhrases.length === 0) {
        addLog?.('warning', 'Нет фраз для очистки');
        return;
      }

      const result = await deepCleanup(safePhrases, useMorphology);
      
      if (result.success) {
        setPhrases(result.phrases);
        setProcessingResult(result);
        addLog?.('success', `Глубокая очистка: удалено ${result.removed}, изменено ${result.modified} фраз`);
        
        // Обновляем анализ
        await runAnalysis();
      } else {
        addLog?.('error', `Ошибки при очистке: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      addLog?.('error', `Ошибка очистки: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Отличное';
    if (score >= 60) return 'Хорошее';
    if (score >= 40) return 'Среднее';
    return 'Низкое';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Анализ качества данных"
      size="lg"
    >
      <div className="space-y-4">
        {/* Описание */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            Анализ качества данных проверяет наличие дублей, мусора, стоп-слов и других проблем.
            Используйте быструю или глубокую очистку для автоматического улучшения качества.
          </div>
        </div>

        {/* Настройки */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            checked={useMorphology}
            onChange={() => setUseMorphology(!useMorphology)}
          />
          <label className="text-sm text-gray-700">
            Использовать морфологический анализ (рекомендуется)
          </label>
        </div>

        {/* Анализ качества */}
        {isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            Анализ данных...
          </div>
        )}

        {!isAnalyzing && analysis && (
          <div className="space-y-4">
            {/* Общая оценка */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getQualityColor(analysis.qualityScore)}`}>
                {analysis.qualityScore}
              </div>
              <p className="mt-3 text-lg font-medium text-gray-700">
                {getQualityLabel(analysis.qualityScore)} качество
              </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Всего фраз</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.totalPhrases.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Уникальных</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.uniquePhrases.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Точных дублей</p>
                <p className="text-2xl font-bold text-red-600">{analysis.duplicates.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Морф. дублей</p>
                <p className="text-2xl font-bold text-orange-600">{analysis.morphDuplicates.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Мусор</p>
                <p className="text-2xl font-bold text-yellow-600">{analysis.noiseCount.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Стоп-слова</p>
                <p className="text-2xl font-bold text-purple-600">{analysis.stopwordCount.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Средняя длина</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.averageLength}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Средние слова</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.averageWords}</p>
              </div>
            </div>

            {/* Рекомендации */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Рекомендации</h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-600">
                    {rec.includes('отличное') || rec.includes('хорошее') ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Результат обработки */}
        {processingResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800 mb-2">Обработка завершена успешно!</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
              <div>Обработано: {processingResult.processed}</div>
              <div>Удалено: {processingResult.removed}</div>
              <div>Изменено: {processingResult.modified}</div>
            </div>
            {processingResult.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {processingResult.warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-green-600">{warning}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <Button
            onClick={handleQuickCleanup}
            disabled={isProcessing || isAnalyzing}
            variant="secondary"
            size="sm"
            icon={<Zap className="w-4 h-4" />}
          >
            Быстрая очистка
          </Button>
          <Button
            onClick={handleDeepCleanup}
            disabled={isProcessing || isAnalyzing}
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-4 h-4" />}
          >
            Глубокая очистка
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Быстрая очистка:</strong> Удаление дублей, мусора, нормализация текста</p>
          <p><strong>Глубокая очистка:</strong> + кросс-минусация и дополнительная обработка</p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={runAnalysis} variant="secondary" size="sm" disabled={isAnalyzing}>
            Обновить анализ
          </Button>
          <Button onClick={onClose} variant="secondary" size="sm">
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};
