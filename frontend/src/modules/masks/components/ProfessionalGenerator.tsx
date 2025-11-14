// @ts-nocheck
// components/ProfessionalGenerator.tsx
// Профессиональный генератор масок для Yandex.Direct

import React, { useState, useEffect, useCallback } from 'react';
import { MaskGrammarParser, MaskGrammarUtils } from '../lib/mask-grammar-parser';
import { OperatorsPolicy } from '../lib/operators-policy';
import { CommercialScorerV2, CommercialScorerUtils } from '../lib/commercial-scorer-v2';
import { GeoBrandNormalizer, GeoBrandNormalizerUtils } from '../lib/geo-brand-normalizer';
import { NegativeSetsBuilder } from '../lib/negative-sets-builder';
import { StreamGenerator, StreamGeneratorUtils } from '../lib/stream-generator';
import { UNode } from '../lib/tree_ops';

// Компоненты для формулы
const FormulaParser: React.FC<{
  formula: string;
  onChange: (formula: string) => void;
  onValidation: (isValid: boolean, errors: string[], preview: string[]) => void;
}> = ({ formula, onChange, onValidation }) => {
  const [validation, setValidation] = useState({ isValid: true, errors: [], preview: [] });
  
  // Мемоизация примера формулы - избегаем создания экземпляра на каждом рендере
  const examples = React.useMemo(() => {
    return MaskGrammarParser.prototype.getExamples.call(new MaskGrammarParser(''));
  }, []);

  useEffect(() => {
    const result = MaskGrammarParser.validateFormula(formula);
    const preview = MaskGrammarUtils.generatePreview({
      valid: result.valid,
      errors: result.errors,
      slots: [],
      rawFormula: formula,
      totalCombinations: 0
    });
    setValidation({ isValid: result.valid, errors: result.errors, preview });
    onValidation(result.valid, result.errors, preview);
  }, [formula, onValidation]); // добавили onValidation в зависимости для корректного эффекта

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Формула масок</label>
      <textarea
        className="w-full p-3 border rounded-lg font-mono text-sm"
        rows={2}
        value={formula}
        onChange={(e) => onChange(e.target.value)}
        placeholder="[BRAND] [MODEL] (GEO?) (ACTION|PRICE)?"
      />
      
      {validation.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <b>Ошибки:</b>
          <ul className="list-disc list-inside">
            {validation.errors.map((error, i) => <li key={i}>{error}</li>)}
          </ul>
        </div>
      )}
      
      <div className="mt-3">
        <label className="block text-xs font-medium mb-2">Примеры формул:</label>
        <div className="space-y-1">
          {examples.map((example: string, i: number) => (
            <button
              key={i}
              onClick={() => onChange(example)}
              className="block w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      
      {validation.preview.length > 0 && validation.isValid && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
          <label className="block text-xs font-medium mb-2">Предварительный просмотр:</label>
          <div className="text-xs space-y-1">
            {validation.preview.map((preview, i) => (
              <div key={i} className="text-green-700">{preview}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент для политики операторов
const OperatorsPanel: React.FC<{
  policy: 'strict' | 'phrase' | 'plus' | 'mix';
  onChange: (policy: 'strict' | 'phrase' | 'plus' | 'mix') => void;
  masks: string[];
}> = ({ policy, onChange, masks }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  
  useEffect(() => {
    if (masks.length > 0) {
      const analysis = OperatorsPolicy.analyzeMask(masks);
      setAnalysis(analysis);
    }
  }, [masks]);

  const policies = OperatorsPolicy.getAvailablePolicies();

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3">Политика операторов</label>
      <div className="grid grid-cols-2 gap-2">
        {policies.map((p) => (
          <label key={p.name} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="operators"
              value={p.name}
              checked={policy === p.name}
              onChange={(e) => onChange(e.target.value as any)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{p.name}</div>
              <div className="text-xs text-gray-600">{p.description}</div>
              <div className="text-xs font-mono text-blue-600 mt-1">{p.example}</div>
            </div>
          </label>
        ))}
      </div>
      
      {analysis && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm font-medium mb-2">Рекомендация: {analysis.recommendedPolicy}</div>
          <div className="text-xs text-gray-600">{analysis.reasoning}</div>
        </div>
      )}
    </div>
  );
};

// Компонент для скоринга
const ScoringPanel: React.FC<{
  threshold: number;
  onChange: (threshold: number) => void;
  weights: any;
  onWeightsChange: (weights: any) => void;
}> = ({ threshold, onChange, weights, onWeightsChange }) => {
  const [scorer] = useState(() => new CommercialScorerV2());
  
  // Примеры масок для тестирования скоринга
  const maskExamples = {
    high: [
      'купить iphone 15 москва цена',
      'заказать samsung galaxy s24 недорого',
      'купить xiaomi redmi note 13 спб'
    ],
    medium: [
      'смартфон apple москва',
      'телефон samsung акция',
      'гаджеты xiaomi в наличии'
    ],
    low: [
      'iphone',
      'телефон',
      'гаджеты москва'
    ],
    info: [
      'что такое iphone',
      'как выбрать телефон',
      'обзор samsung galaxy'
    ]
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3">Скоринг коммерческой ценности</label>
      
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2">Порог отсечения: {threshold.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={threshold}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-2">ACTION/PRICE (θ1)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weights.theta1}
            onChange={(e) => onWeightsChange({...weights, theta1: parseFloat(e.target.value)})}
            className="w-full"
          />
          <div className="text-xs text-gray-600">{weights.theta1}</div>
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-2">BRAND/MODEL (θ2)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weights.theta2}
            onChange={(e) => onWeightsChange({...weights, theta2: parseFloat(e.target.value)})}
            className="w-full"
          />
          <div className="text-xs text-gray-600">{weights.theta2}</div>
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-2">Длина (θ3)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weights.theta3}
            onChange={(e) => onWeightsChange({...weights, theta3: parseFloat(e.target.value)})}
            className="w-full"
          />
          <div className="text-xs text-gray-600">{weights.theta3}</div>
        </div>
        
        <div>
          <label className="block text-xs font-medium mb-2">GEO (θ4)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={weights.theta4}
            onChange={(e) => onWeightsChange({...weights, theta4: parseFloat(e.target.value)})}
            className="w-full"
          />
          <div className="text-xs text-gray-600">{weights.theta4}</div>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-xs font-medium mb-2">Примеры масок для тестирования</label>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {Object.entries(maskExamples).map(([type, masks]) => (
            <div key={type} className="text-xs">
              <div className="font-medium text-gray-700">{type}:</div>
              {(masks as string[]).slice(0, 2).map((mask, i) => (
                <div key={i} className="ml-2 text-gray-600">{mask}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Основной компонент профессионального генератора
export const ProfessionalGenerator: React.FC<{
  xmindData: UNode | null;
  onExport: (data: any) => void;
}> = ({ xmindData, onExport }) => {
  const [formula, setFormula] = useState('[BRAND] [MODEL] (GEO?) (ACTION|PRICE)?');
  const [operatorPolicy, setOperatorPolicy] = useState<'strict' | 'phrase' | 'plus' | 'mix'>('mix');
  const [scoringThreshold, setScoringThreshold] = useState(0.6);
  const [scoringWeights, setScoringWeights] = useState({
    theta1: 0.4, theta2: 0.3, theta3: 0.2, theta4: 0.1
  });
  
  const [formulaValid, setFormulaValid] = useState(true);
  const [formulaErrors, setFormulaErrors] = useState<string[]>([]);
  const [formulaPreview, setFormulaPreview] = useState<string[]>([]);
  
  // Мемоизация колбэка для валидации формулы - предотвращает бесконечный цикл рендеров
  const handleValidation = useCallback(
    (isValid: boolean, errors: string[], preview: string[]) => {
      setFormulaValid(isValid);
      setFormulaErrors(errors);
      setFormulaPreview(preview);
    },
    []
  );
  
  const [slotData, setSlotData] = useState<Record<string, string[]>>({
    BRAND: ['apple', 'samsung', 'xiaomi'],
    MODEL: ['iphone 15', 'galaxy s24', 'redmi note 13'],
    GEO: ['москва', 'спб', 'новосибирск'],
    ACTION: ['купить', 'заказать'],
    PRICE: ['цена', 'стоимость']
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generator, setGenerator] = useState<StreamGenerator | null>(null);
  const [generationProgress, setGenerationProgress] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  
  const [negativeWords, setNegativeWords] = useState<string[]>([]);
  const [industryProfile, setIndustryProfile] = useState<string>('ecommerce');

  // Анализ XMind при изменении данных
  useEffect(() => {
    if (xmindData) {
      const negativeBuilder = new NegativeSetsBuilder();
      const analysis = negativeBuilder.analyzeXMind(xmindData);
      
      if (analysis.detectedIndustry) {
        setIndustryProfile(analysis.detectedIndustry);
        
        // Извлекаем данные для слотов из XMind
        const extractedData = extractDataFromXMind(xmindData);
        setSlotData(prev => ({ ...prev, ...extractedData }));
      }
    }
  }, [xmindData]);

  const extractDataFromXMind = useCallback((node: UNode): Record<string, string[]> => {
    const extractFromBranch = (n: UNode): string[] => {
      const items: string[] = [n.title];
      n.children?.forEach(child => {
        items.push(...extractFromBranch(child));
      });
      return items;
    };

    const allText = extractFromBranch(node);
    const brands = allText.filter(text => 
      ['apple', 'samsung', 'xiaomi', 'huawei'].some(brand => text.toLowerCase().includes(brand))
    );
    
    const geo = allText.filter(text => 
      ['москва', 'спб', 'новосибирск', 'екатеринбург'].some(geo => text.toLowerCase().includes(geo))
    );

    return {
      BRAND: brands.length > 0 ? brands : ['apple', 'samsung'],
      GEO: geo.length > 0 ? geo : ['москва', 'спб']
    };
  }, []);

  const handleStartGeneration = async () => {
    if (!formulaValid) return;
    
    const config = {
      formula,
      data: slotData,
      operatorPolicy,
      scoringThreshold,
      enableNormalization: true,
      enableScoring: true,
      enableOperators: true,
      maxMasks: 50000,
      batchSize: 1000,
      enableDeduplication: true
    };

    const newGenerator = new StreamGenerator(config);
    setGenerator(newGenerator);
    setIsGenerating(true);

    try {
      const result = await newGenerator.generate();
      setResult(result);
      setGenerationProgress(newGenerator.getProgress());
      onExport(result);
    } catch (error) {
      console.error('Ошибка генерации:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePauseGeneration = () => {
    if (generator) {
      generator.pause();
    }
  };

  const handleResumeGeneration = () => {
    if (generator) {
      generator.resume();
    }
  };

  const handleCancelGeneration = () => {
    if (generator) {
      generator.cancel();
    }
    setIsGenerating(false);
  };

  const generateNegativeWords = () => {
    const builder = new NegativeSetsBuilder();
    const negativeResult = builder.generateNegativeWords(xmindData);
    const allWords = [
      ...negativeResult.global,
      ...negativeResult.thematic,
      ...negativeResult.contextual
    ].flatMap(set => set.words);
    
    setNegativeWords(allWords);
  };

  const updateSlotData = (slotName: string, values: string) => {
    const items = values.split('\n').map(v => v.trim()).filter(v => v.length > 0);
    setSlotData(prev => ({ ...prev, [slotName]: items }));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">🧬 Профессиональный генератор масок</h2>
      
      {/* Парсер формул */}
      <FormulaParser
        formula={formula}
        onChange={setFormula}
        onValidation={handleValidation}
      />
      
      {/* Политики операторов */}
      <OperatorsPanel
        policy={operatorPolicy}
        onChange={setOperatorPolicy}
        masks={[]}
      />
      
      {/* Скоринг */}
      <ScoringPanel
        threshold={scoringThreshold}
        onChange={setScoringThreshold}
        weights={scoringWeights}
        onWeightsChange={setScoringWeights}
      />
      
      {/* Данные для слотов */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Данные для слотов формулы</label>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(slotData).map(([slotName, values]) => (
            <div key={slotName}>
              <label className="block text-xs font-medium mb-1">{slotName}</label>
              <textarea
                className="w-full p-2 border rounded text-sm"
                rows={3}
                value={values.join('\n')}
                onChange={(e) => updateSlotData(slotName, e.target.value)}
                placeholder={`Значения для ${slotName} (по одному на строку)`}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Минус-слова */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Автоматические минус-слова</label>
        <button
          onClick={generateNegativeWords}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Сгенерировать минус-слова
        </button>
        {negativeWords.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 border rounded max-h-32 overflow-y-auto">
            <div className="text-sm font-medium mb-2">Найдено минус-слов: {negativeWords.length}</div>
            <div className="text-xs text-gray-600">
              {negativeWords.slice(0, 20).join(', ')}
              {negativeWords.length > 20 && ` ... и еще ${negativeWords.length - 20}`}
            </div>
          </div>
        )}
      </div>
      
      {/* Управление генерацией */}
      <div className="mb-6">
        <div className="flex gap-3 items-center">
          <button
            onClick={handleStartGeneration}
            disabled={!formulaValid || isGenerating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Генерация...' : 'Запустить генерацию'}
          </button>
          
          {isGenerating && (
            <>
              <button
                onClick={handlePauseGeneration}
                className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Пауза
              </button>
              <button
                onClick={handleResumeGeneration}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Возобновить
              </button>
              <button
                onClick={handleCancelGeneration}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Отмена
              </button>
            </>
          )}
        </div>
        
        {generationProgress && (
          <div className="mt-4 p-4 bg-blue-50 border rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Прогресс генерации</span>
              <span className="text-sm">{generationProgress.generated} / {generationProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(generationProgress.generated / generationProgress.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Скорость: {generationProgress.speed} масок/сек
              {generationProgress.estimatedTimeRemaining && (
                <> • Осталось: {Math.ceil(generationProgress.estimatedTimeRemaining / 1000)} сек</>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Результаты */}
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Результаты генерации</h3>
          
          {/* Статистика */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-green-50 border rounded">
              <div className="text-lg font-bold text-green-700">{result.totalGenerated}</div>
              <div className="text-xs text-green-600">Всего масок</div>
            </div>
            <div className="p-3 bg-blue-50 border rounded">
              <div className="text-lg font-bold text-blue-700">{result.totalScored}</div>
              <div className="text-xs text-blue-600">Со скорингом</div>
            </div>
            <div className="p-3 bg-purple-50 border rounded">
              <div className="text-lg font-bold text-purple-700">{result.totalNormalized}</div>
              <div className="text-xs text-purple-600">Нормализованных</div>
            </div>
            <div className="p-3 bg-orange-50 border rounded">
              <div className="text-lg font-bold text-orange-700">{result.totalWithOperators}</div>
              <div className="text-xs text-orange-600">С операторами</div>
            </div>
          </div>
          
          {/* Предпросмотр */}
          <div className="border rounded">
            <div className="p-3 bg-gray-50 border-b">
              <h4 className="font-medium">Предпросмотр (первые 100 масок)</h4>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {result.preview.slice(0, 100).map((mask: any, i: number) => (
                <div key={i} className="py-1 border-b last:border-b-0 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{mask.mask}</span>
                    {mask.score && (
                      <span className="text-xs text-gray-500">
                        {mask.score.toFixed(2)} {mask.classification}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Экспорт */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const csv = result.masks.map((m: any) => [m.mask, m.score, m.classification].join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'masks_generated.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Экспорт CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
