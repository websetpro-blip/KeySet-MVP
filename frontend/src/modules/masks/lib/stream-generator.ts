// lib/stream-generator.ts
// Стрим-генерация масок для больших объемов с SQLite и прогресс-баром

import { MaskGrammarParser, ParsedFormula } from './mask-grammar-parser';
import { OperatorsPolicy, OperatorPolicy } from './operators-policy';
import { CommercialScorerV2 } from './commercial-scorer-v2';
import { GeoBrandNormalizer } from './geo-brand-normalizer';

export interface GenerationConfig {
  formula: string;
  data: Record<string, string[]>; // Данные для слотов формулы
  operatorPolicy: OperatorPolicy;
  scoringThreshold: number;
  enableNormalization: boolean;
  enableScoring: boolean;
  enableOperators: boolean;
  maxMasks: number;
  batchSize: number; // Размер пакета для обработки
  enableDeduplication: boolean;
}

export interface GeneratedMask {
  id: string;
  mask: string;
  score?: number;
  classification?: string;
  operators?: {
    strict: string;
    phrase: string;
    plus: string;
    mix: string[];
  };
  normalized?: string[];
  variants?: string[];
  timestamp: number;
  source: 'generated' | 'normalized' | 'operated';
}

export interface StreamProgress {
  total: number;
  generated: number;
  scored: number;
  normalized: number;
  operated: number;
  deduplicated: number;
  currentBatch: number;
  totalBatches: number;
  isPaused: boolean;
  isCompleted: boolean;
  error?: string;
  estimatedTimeRemaining?: number;
  speed: number; // Масок в секунду
  memoryUsage?: number;
}

export interface StreamResult {
  masks: GeneratedMask[];
  totalGenerated: number;
  totalScored: number;
  totalNormalized: number;
  totalWithOperators: number;
  totalDeduplicated: number;
  progress: StreamProgress;
  statistics: {
    averageScore: number;
    topScoringMasks: GeneratedMask[];
    distributionByClassification: Record<string, number>;
    operatorDistribution: Record<OperatorPolicy, number>;
    normalizationStats: {
      geoVariants: number;
      brandVariants: number;
      transliterations: number;
    };
  };
  preview: GeneratedMask[]; // Первые 10k для предпросмотра
  databaseInfo: {
    fileSize: number;
    recordCount: number;
    lastUpdate: number;
  };
}

/**
 * StreamGenerator - система стрим-генерации масок для больших объемов
 */
export class StreamGenerator {
  private config: GenerationConfig;
  private progress: StreamProgress;
  private isPaused = false;
  private isCancelled = false;
  private pausePromise?: Promise<void>;
  private pauseResolve?: () => void;
  private dbPath: string = 'masks_generation.db';
  
  // Компоненты системы
  private parser: MaskGrammarParser;
  private scorer: CommercialScorerV2;
  private normalizer: GeoBrandNormalizer;
  private operatorPolicy: OperatorsPolicy;
  
  // Кэш для оптимизации
  private maskCache = new Set<string>();
  private scoreCache = new Map<string, number>();
  private normalizationCache = new Map<string, string[]>();

  constructor(config: GenerationConfig) {
    this.config = config;
    this.progress = {
      total: 0,
      generated: 0,
      scored: 0,
      normalized: 0,
      operated: 0,
      deduplicated: 0,
      currentBatch: 0,
      totalBatches: 0,
      isPaused: false,
      isCompleted: false,
      speed: 0
    };
    
    // Инициализируем компоненты
    this.parser = new MaskGrammarParser(config.formula);
    this.scorer = new CommercialScorerV2();
    this.normalizer = new GeoBrandNormalizer();
    this.operatorPolicy = new OperatorsPolicy(config.operatorPolicy);
    
    // Валидируем конфигурацию
    this.validateConfig();
  }

  /**
   * Валидация конфигурации
   */
  private validateConfig(): void {
    const parsed = this.parser.parse();
    if (!parsed.valid) {
      throw new Error(`Некорректная формула: ${parsed.errors.join(', ')}`);
    }
    
    if (this.config.batchSize > 10000 || this.config.batchSize < 100) {
      throw new Error('Размер пакета должен быть от 100 до 10000');
    }
    
    if (this.config.maxMasks > 1000000) {
      throw new Error('Максимальное количество масок не может превышать 1,000,000');
    }
  }

  /**
   * Инициализация базы данных
   */
  private async initDatabase(): Promise<void> {
    // В реальном приложении здесь была бы инициализация SQLite
    // Пока используем IndexedDB для демонстрации
    if ('indexedDB' in window) {
      const request = indexedDB.open('masksGenerator', 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('masks')) {
          db.createObjectStore('masks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
    }
  }

  /**
   * Основной метод генерации
   */
  async generate(): Promise<StreamResult> {
    try {
      await this.initDatabase();
      
      const parsedFormula = this.parser.parse();
      if (!parsedFormula.valid) {
        throw new Error(`Формула содержит ошибки: ${parsedFormula.errors.join(', ')}`);
      }
      
      // Расчет общего количества масок
      const totalMasks = this.calculateTotalMasks(parsedFormula);
      this.progress.total = Math.min(totalMasks, this.config.maxMasks);
      this.progress.totalBatches = Math.ceil(this.progress.total / this.config.batchSize);
      
      const startTime = Date.now();
      const generatedMasks: GeneratedMask[] = [];
      const previewMasks: GeneratedMask[] = [];
      let processedInCurrentSecond = 0;
      let lastSpeedUpdate = startTime;
      
      // Основной цикл генерации
      for (let batch = 0; batch < this.progress.totalBatches; batch++) {
        if (this.isCancelled) {
          throw new Error('Генерация отменена пользователем');
        }
        
        this.progress.currentBatch = batch + 1;
        const batchMasks = await this.generateBatch(parsedFormula, batch);
        
        // Обработка масок в пакете
        for (const mask of batchMasks) {
          if (this.isPaused) {
            await this.waitForResume();
          }
          
          // Дедупликация
          if (this.config.enableDeduplication && this.maskCache.has(mask.mask)) {
            this.progress.deduplicated++;
            continue;
          }
          
          if (this.config.enableDeduplication) {
            this.maskCache.add(mask.mask);
          }
          
          // Скоринг
          if (this.config.enableScoring && this.config.scoringThreshold > 0) {
            const score = this.scorer.scoreMasks([mask.mask], this.config.scoringThreshold);
            if (score.masks.length > 0 && score.masks[0].score >= this.config.scoringThreshold) {
              mask.score = score.masks[0].score;
              mask.classification = score.masks[0].classification;
              this.progress.scored++;
            } else {
              continue; // Пропускаем маски ниже порога
            }
          }
          
          // Нормализация
          if (this.config.enableNormalization) {
            const normalization = this.normalizer.normalize(mask.mask);
            if (normalization.variants.geographic.length > 0 || 
                normalization.variants.brandVariants.length > 0) {
              mask.normalized = normalization.normalized;
              mask.variants = [
                ...normalization.variants.geographic,
                ...normalization.variants.brandVariants,
                ...normalization.variants.transliterations
              ];
              this.progress.normalized++;
            }
          }
          
          // Операторы
          if (this.config.enableOperators) {
            const operatorsResult = this.operatorPolicy.apply([mask.mask]);
            if (operatorsResult.results.length > 0) {
              mask.operators = {
                strict: operatorsResult.results[0].strict,
                phrase: operatorsResult.results[0].phrase,
                plus: operatorsResult.results[0].plus,
                mix: operatorsResult.results[0].mix
              };
              this.progress.operated++;
            }
          }
          
          generatedMasks.push(mask);
          this.progress.generated++;
          
          // Добавляем в предпросмотр (первые 10k)
          if (previewMasks.length < 10000) {
            previewMasks.push(mask);
          }
          
          // Обновление скорости
          processedInCurrentSecond++;
          const now = Date.now();
          if (now - lastSpeedUpdate >= 1000) {
            this.progress.speed = processedInCurrentSecond;
            processedInCurrentSecond = 0;
            lastSpeedUpdate = now;
            
            // Оценка оставшегося времени
            const elapsed = now - startTime;
            const progress = this.progress.generated / this.progress.total;
            const estimatedTotal = elapsed / progress;
            this.progress.estimatedTimeRemaining = estimatedTotal - elapsed;
          }
          
          // Отдаем управление для обновления UI
          if (this.progress.generated % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
      
      this.progress.isCompleted = true;
      
      // Формируем результат
      const result: StreamResult = {
        masks: generatedMasks,
        totalGenerated: this.progress.generated,
        totalScored: this.progress.scored,
        totalNormalized: this.progress.normalized,
        totalWithOperators: this.progress.operated,
        totalDeduplicated: this.progress.deduplicated,
        progress: { ...this.progress },
        statistics: this.calculateStatistics(generatedMasks),
        preview: previewMasks,
        databaseInfo: {
          fileSize: this.estimateDatabaseSize(),
          recordCount: generatedMasks.length,
          lastUpdate: Date.now()
        }
      };
      
      return result;
      
    } catch (error) {
      this.progress.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      this.progress.isCompleted = true;
      throw error;
    }
  }

  /**
   * Генерация пакета масок
   */
  private async generateBatch(parsedFormula: ParsedFormula, batchNumber: number): Promise<GeneratedMask[]> {
    const batch: GeneratedMask[] = [];
    const startIndex = batchNumber * this.config.batchSize;
    const endIndex = Math.min(startIndex + this.config.batchSize, this.progress.total);
    
    // Генерируем комбинации для данного пакета
    const combinations = this.generateCombinations(parsedFormula, startIndex, endIndex - startIndex);
    
    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      const mask = this.combineMask(combination);
      
      batch.push({
        id: `${batchNumber}_${i}_${Date.now()}`,
        mask,
        timestamp: Date.now(),
        source: 'generated'
      });
    }
    
    return batch;
  }

  /**
   * Расчет общего количества масок
   */
  private calculateTotalMasks(parsedFormula: ParsedFormula): number {
    let total = 1;
    
    for (const slot of parsedFormula.slots) {
      const dataValues = this.getSlotData(slot.name);
      const dataCount = dataValues.length || 1;
      
      switch (slot.quantifier) {
        case '0-1':
          total *= (dataCount + 1); // +1 для отсутствия
          break;
        case '0-N':
          total *= Math.min(dataCount * 10, 100); // Ограничиваем для демонстрации
          break;
        case '1-1':
          total *= dataCount;
          break;
      }
    }
    
    return total;
  }

  /**
   * Получение данных для слота
   */
  private getSlotData(slotName: string): string[] {
    const normalizedName = slotName.toLowerCase();
    
    // Пытаемся найти по ключевым словам
    for (const [key, values] of Object.entries(this.config.data)) {
      if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
        return values;
      }
    }
    
    // Поиск по точному совпадению
    if (this.config.data[slotName]) {
      return this.config.data[slotName];
    }
    
    // Поиск по частичному совпадению
    for (const [key, values] of Object.entries(this.config.data)) {
      if (key.toLowerCase().includes(normalizedName)) {
        return values;
      }
    }
    
    return []; // Пустые данные
  }

  /**
   * Генерация комбинаций для пакета
   */
  private generateCombinations(parsedFormula: ParsedFormula, startIndex: number, count: number): Array<Record<string, string | null>> {
    const combinations: Array<Record<string, string | null>> = [];
    
    // Простая реализация для демонстрации
    // В реальном приложении здесь был бы более сложный алгоритм
    for (let i = 0; i < count; i++) {
      const combination: Record<string, string | null> = {};
      
      for (const slot of parsedFormula.slots) {
        const slotData = this.getSlotData(slot.name);
        if (slotData.length > 0) {
          const randomIndex = Math.floor(Math.random() * slotData.length);
          combination[slot.name] = slotData[randomIndex];
        } else {
          combination[slot.name] = null;
        }
      }
      
      combinations.push(combination);
    }
    
    return combinations;
  }

  /**
   * Объединение комбинации в маску
   */
  private combineMask(combination: Record<string, string | null>): string {
    const parts: string[] = [];
    
    for (const [slotName, value] of Object.entries(combination)) {
      if (value && value.trim().length > 0) {
        parts.push(value);
      }
    }
    
    return parts.join(' ').trim();
  }

  /**
   * Ожидание возобновления генерации
   */
  private waitForResume(): Promise<void> {
    this.progress.isPaused = true;
    
    if (!this.pausePromise) {
      this.pausePromise = new Promise(resolve => {
        this.pauseResolve = resolve;
      });
    }
    
    return this.pausePromise;
  }

  /**
   * Приостановка генерации
   */
  pause(): void {
    this.isPaused = true;
    this.progress.isPaused = true;
  }

  /**
   * Возобновление генерации
   */
  resume(): void {
    this.isPaused = false;
    this.progress.isPaused = false;
    
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pausePromise = undefined;
      this.pauseResolve = undefined;
    }
  }

  /**
   * Отмена генерации
   */
  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
  }

  /**
   * Получение текущего прогресса
   */
  getProgress(): StreamProgress {
    return { ...this.progress };
  }

  /**
   * Расчет статистики результатов
   */
  private calculateStatistics(masks: GeneratedMask[]): StreamResult['statistics'] {
    const scores = masks.filter(m => m.score !== undefined).map(m => m.score!) || [];
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const topScoringMasks = masks
      .filter(m => m.score !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
    
    const classificationCounts: Record<string, number> = {};
    masks.forEach(mask => {
      if (mask.classification) {
        classificationCounts[mask.classification] = (classificationCounts[mask.classification] || 0) + 1;
      }
    });
    
    const operatorDistribution: Record<OperatorPolicy, number> = {
      strict: 0,
      phrase: 0,
      plus: 0,
      mix: 0
    };
    
    masks.forEach(mask => {
      if (mask.operators) {
        operatorDistribution[this.config.operatorPolicy]++;
      }
    });
    
    let geoVariants = 0;
    let brandVariants = 0;
    let transliterations = 0;
    
    masks.forEach(mask => {
      if (mask.variants) {
        // Простая эвристика для определения типа варианта
        mask.variants.forEach(variant => {
          if (variant.includes('москва') || variant.includes('спб')) geoVariants++;
          else if (variant.includes('apple') || variant.includes('samsung')) brandVariants++;
          else transliterations++;
        });
      }
    });
    
    return {
      averageScore,
      topScoringMasks,
      distributionByClassification: classificationCounts,
      operatorDistribution,
      normalizationStats: {
        geoVariants,
        brandVariants,
        transliterations
      }
    };
  }

  /**
   * Оценка размера базы данных
   */
  private estimateDatabaseSize(): number {
    // Приблизительная оценка в байтах
    const avgMaskSize = 50; // Средний размер маски в символах
    const recordSize = avgMaskSize + 50; // + накладные расходы
    return this.progress.generated * recordSize;
  }

  /**
   * Экспорт результатов
   */
  exportResult(result: StreamResult, format: 'csv' | 'json' | 'txt' = 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    }
    
    if (format === 'txt') {
      return result.masks.map(mask => mask.mask).join('\n');
    }
    
    // CSV формат
    const headers = [
      'ID', 'Маска', 'Скор', 'Классификация', 'Строгая_фиксация', 
      'Фразовое', 'С_плюсами', 'Нормализованная', 'Варианты', 'Источник'
    ];
    
    const rows = result.masks.map(mask => [
      mask.id,
      `"${mask.mask.replace(/"/g, '""')}"`,
      mask.score?.toString() || '',
      mask.classification || '',
      `"${mask.operators?.strict || ''}"`,
      `"${mask.operators?.phrase || ''}"`,
      `"${mask.operators?.plus || ''}"`,
      `"${mask.normalized?.join(' ') || ''}"`,
      `"${mask.variants?.join('|') || ''}"`,
      mask.source
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Получение статистики производительности
   */
  getPerformanceStats(): {
    masksPerSecond: number;
    memoryUsage: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  } {
    const elapsed = Date.now() - (this as any).startTime || 1000;
    const masksPerSecond = this.progress.generated / (elapsed / 1000);
    
    // В реальном приложении здесь был бы более точный расчет
    return {
      masksPerSecond: Math.round(masksPerSecond),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      cacheHitRate: 0.8, // Примерное значение
      averageProcessingTime: 0.1 // миллисекунд на маску
    };
  }
}

// Экспорт утилит
export const StreamGeneratorUtils = {
  /**
   * Создание примерной конфигурации
   */
  createDemoConfig(): GenerationConfig {
    return {
      formula: '[BRAND] [MODEL] (GEO?) (ACTION|PRICE)?',
      data: {
        BRAND: ['apple', 'samsung', 'xiaomi', 'huawei'],
        MODEL: ['iphone 15', 'galaxy s24', 'redmi note 13', 'p50'],
        GEO: ['москва', 'спб', 'новосибирск'],
        ACTION: ['купить', 'заказать'],
        PRICE: ['цена', 'стоимость']
      },
      operatorPolicy: 'mix',
      scoringThreshold: 0.5,
      enableNormalization: true,
      enableScoring: true,
      enableOperators: true,
      maxMasks: 100000,
      batchSize: 1000,
      enableDeduplication: true
    };
  },

  /**
   * Валидация конфигурации
   */
  validateConfig(config: GenerationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.formula.trim()) {
      errors.push('Формула не может быть пустой');
    }
    
    if (Object.keys(config.data).length === 0) {
      errors.push('Должны быть указаны данные для формулы');
    }
    
    if (config.maxMasks > 1000000) {
      errors.push('Максимальное количество масок не может превышать 1,000,000');
    }
    
    if (config.batchSize > 10000 || config.batchSize < 100) {
      errors.push('Размер пакета должен быть от 100 до 10,000');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
