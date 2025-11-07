// lib/commercial-scorer-v2.ts
// Продвинутый скоринг коммерческой ценности масок для Yandex.Direct

export interface ScoringWeights {
  theta1: number; // ACTION/PRICE токены
  theta2: number; // BRAND/MODEL плотность
  theta3: number; // Длина ≤ 5 слов бонус
  theta4: number; // GEO присутствие
  infoPenalty: number; // Штраф за INFO-триггеры
}

export interface ScoredMask {
  original: string;
  score: number;
  components: {
    actionScore: number;
    brandModelScore: number;
    lengthScore: number;
    geoScore: number;
    infoPenalty: number;
  };
  breakdown: {
    actionTokens: string[];
    brandModelTokens: string[];
    geoTokens: string[];
    infoTriggers: string[];
    length: number;
    commercialIndicators: string[];
  };
  classification: 'HIGH_COMMERCIAL' | 'MEDIUM_COMMERCIAL' | 'LOW_COMMERCIAL' | 'INFO_QUERY';
  confidence: number;
}

export interface ScoringResult {
  masks: ScoredMask[];
  statistics: {
    totalMasks: number;
    averageScore: number;
    distribution: {
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    topCommercialMasks: ScoredMask[];
    totalActionTokens: number;
    totalBrandModelTokens: number;
    totalGeoTokens: number;
  };
  threshold: number;
  recommendations: string[];
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  theta1: 0.4,  // Наличие ACTION/PRICE токенов
  theta2: 0.3,  // BRAND/MODEL плотность
  theta3: 0.2,  // Длина ≤ 5 слов бонус
  theta4: 0.1,  // GEO присутствие
  infoPenalty: 0.2  // Штраф за INFO-триггеры
};

const ACTION_TOKENS = [
  'купить', 'заказать', 'цена', 'стоимость', 'цены', 'приобрести', 'купить дешево',
  'акция', 'скидка', 'распродажа', 'предложение', 'выгодно', 'выгодная покупка',
  'в наличии', 'купить онлайн', 'интернет магазин', 'заказать онлайн'
];

const PRICE_TOKENS = [
  'цена', 'стоимость', 'от', 'до', 'рублей', 'руб', 'с', 'по', 'от', 'до',
  'за', 'за штуку', 'за килограмм', 'за метр', 'скидка', 'акция', 'дешево',
  'дорого', 'выгодно', 'бесплатно', 'по акции'
];

const BRAND_TOKENS = [
  'apple', 'samsung', 'xiaomi', 'huawei', 'oneplus', 'asus', 'acer', 'lenovo',
  'hp', 'dell', 'canon', 'nikon', 'sony', 'lg', 'bosch', 'siemens', 'samsung',
  'apple', 'google', 'microsoft', 'intel', 'amd', 'nvidia', 'amd'
];

const MODEL_TOKENS = [
  'iphone', 'galaxy', 'note', 'pro', 'plus', 'max', 'ultra', 'mini', 'air',
  'macbook', 'ipad', 'watch', 'airpods', 'smartwatch', 'tablet', 'smartphone',
  'ноутбук', 'компьютер', 'монитор', 'принтер', 'сканер', 'мышь', 'клавиатура'
];

const GEO_TOKENS = [
  'москва', 'спб', 'санкт-петербург', 'петербург', 'питер', 'новосибирск',
  'екатеринбург', 'казань', 'нижний новгород', 'челябинск', 'самара',
  'омск', 'ростов', 'уфа', 'красноярск', 'воронеж', 'пермь', 'волгоград'
];

const INFO_TRIGGERS = [
  'как', 'что', 'где', 'когда', 'зачем', 'почему', 'инструкция', 'руководство',
  'рецепт', 'приготовление', 'отзыв', 'обзор', 'тест', 'сравнение',
  'характеристики', 'совместимость', 'совместим', 'подходит', 'не подходит'
];

/**
 * CommercialScorerV2 - продвинутый скоринг коммерческой ценности масок
 */
export class CommercialScorerV2 {
  private weights: ScoringWeights;

  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Основной метод скоринга
   */
  scoreMasks(masks: string[], threshold: number = 0.6): ScoringResult {
    const scoredMasks: ScoredMask[] = masks.map(mask => this.scoreSingleMask(mask));
    
    // Сортируем по убыванию скора
    scoredMasks.sort((a, b) => b.score - a.score);
    
    const statistics = this.calculateStatistics(scoredMasks);
    const recommendations = this.generateRecommendations(scoredMasks, threshold);
    
    return {
      masks: scoredMasks,
      statistics,
      threshold,
      recommendations
    };
  }

  /**
   * Скоринг одной маски
   */
  private scoreSingleMask(mask: string): ScoredMask {
    const words = this.tokenize(mask);
    const breakdown = this.analyzeMask(mask, words);
    
    const actionScore = this.calculateActionScore(words, breakdown);
    const brandModelScore = this.calculateBrandModelScore(words, breakdown);
    const lengthScore = this.calculateLengthScore(words);
    const geoScore = this.calculateGeoScore(words, breakdown);
    const infoPenalty = this.calculateInfoPenalty(words, breakdown);
    
    // Итоговый скор
    const score = Math.max(0, 
      this.weights.theta1 * actionScore +
      this.weights.theta2 * brandModelScore +
      this.weights.theta3 * lengthScore +
      this.weights.theta4 * geoScore -
      this.weights.infoPenalty * infoPenalty
    );
    
    // Классификация
    const classification = this.classifyMask(score, breakdown);
    const confidence = this.calculateConfidence(breakdown);
    
    return {
      original: mask,
      score: Math.round(score * 1000) / 1000, // Округляем до 3 знаков
      components: {
        actionScore,
        brandModelScore,
        lengthScore,
        geoScore,
        infoPenalty
      },
      breakdown,
      classification,
      confidence
    };
  }

  /**
   * Токенизация маски
   */
  private tokenize(mask: string): string[] {
    return mask
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[^\wа-яё]/gi, ''))
      .filter(word => word.length > 0);
  }

  /**
   * Анализ маски по компонентам
   */
  private analyzeMask(mask: string, words: string[]): ScoredMask['breakdown'] {
    const lowerMask = mask.toLowerCase();
    
    const actionTokens = words.filter(word => 
      ACTION_TOKENS.some(token => word.includes(token) || token.includes(word))
    );
    
    const priceTokens = words.filter(word => 
      PRICE_TOKENS.some(token => word.includes(token) || token.includes(word))
    );
    
    const brandTokens = words.filter(word => 
      BRAND_TOKENS.some(token => word.includes(token) || token.includes(word))
    );
    
    const modelTokens = words.filter(word => 
      MODEL_TOKENS.some(token => word.includes(token) || token.includes(word))
    );
    
    const geoTokens = words.filter(word => 
      GEO_TOKENS.some(token => word.includes(token) || token.includes(word))
    );
    
    const infoTriggers = words.filter(word => 
      INFO_TRIGGERS.some(trigger => word.includes(trigger) || trigger.includes(word))
    );
    
    const commercialIndicators = [
      ...actionTokens,
      ...priceTokens,
      ...brandTokens,
      ...modelTokens
    ].filter((token, index, arr) => arr.indexOf(token) === index); // Убираем дубликаты
    
    return {
      actionTokens: [...new Set([...actionTokens, ...priceTokens])],
      brandModelTokens: [...new Set([...brandTokens, ...modelTokens])],
      geoTokens,
      infoTriggers,
      length: words.length,
      commercialIndicators
    };
  }

  /**
   * Расчет скоров по компонентам
   */
  private calculateActionScore(words: string[], breakdown: ScoredMask['breakdown']): number {
    if (breakdown.actionTokens.length === 0) return 0;
    
    // Базовый скор за наличие ACTION токенов
    let score = 0.7;
    
    // Бонус за разнообразие ACTION токенов
    score += Math.min(breakdown.actionTokens.length * 0.1, 0.3);
    
    // Бонус за ценовые токены
    const hasPriceTokens = breakdown.actionTokens.some(token => 
      PRICE_TOKENS.some(priceToken => token.includes(priceToken))
    );
    if (hasPriceTokens) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private calculateBrandModelScore(words: string[], breakdown: ScoredMask['breakdown']): number {
    if (breakdown.brandModelTokens.length === 0) return 0;
    
    // Скор зависит от плотности брендов/моделей
    const density = breakdown.brandModelTokens.length / breakdown.length;
    
    // Нормализуем: оптимальная плотность 0.3-0.7
    let score = density;
    if (density < 0.3) score = density / 0.3;
    else if (density > 0.7) score = (1.0 - density) / 0.3;
    
    return Math.max(0, Math.min(score, 1.0));
  }

  private calculateLengthScore(words: string[]): number {
    const length = words.length;
    
    // Оптимальная длина 3-5 слов
    if (length <= 5) return 1.0;
    if (length <= 8) return 0.8;
    if (length <= 12) return 0.5;
    
    return 0.2;
  }

  private calculateGeoScore(words: string[], breakdown: ScoredMask['breakdown']): number {
    if (breakdown.geoTokens.length === 0) return 0;
    
    // Бонус за локализацию
    let score = 0.6;
    
    // Дополнительный бонус за конкретные города
    if (breakdown.geoTokens.some(token => ['москва', 'спб', 'санкт-петербург'].includes(token))) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateInfoPenalty(words: string[], breakdown: ScoredMask['breakdown']): number {
    if (breakdown.infoTriggers.length === 0) return 0;
    
    // Штраф зависит от количества INFO-триггеров
    const penalty = Math.min(breakdown.infoTriggers.length * 0.3, 1.0);
    
    return penalty;
  }

  /**
   * Классификация маски по коммерческой ценности
   */
  private classifyMask(score: number, breakdown: ScoredMask['breakdown']): ScoredMask['classification'] {
    if (breakdown.infoTriggers.length > 0 && score < 0.4) {
      return 'INFO_QUERY';
    }
    
    if (score >= 0.7) return 'HIGH_COMMERCIAL';
    if (score >= 0.5) return 'MEDIUM_COMMERCIAL';
    return 'LOW_COMMERCIAL';
  }

  /**
   * Расчет уверенности в скоре
   */
  private calculateConfidence(breakdown: ScoredMask['breakdown']): number {
    let confidence = 0.5; // Базовый уровень
    
    // Увеличиваем уверенность при наличии коммерческих токенов
    if (breakdown.commercialIndicators.length > 0) confidence += 0.2;
    if (breakdown.brandModelTokens.length > 0) confidence += 0.1;
    if (breakdown.geoTokens.length > 0) confidence += 0.1;
    
    // Уменьшаем при наличии INFO-триггеров
    if (breakdown.infoTriggers.length > 0) confidence -= 0.2;
    
    return Math.max(0.1, Math.min(confidence, 1.0));
  }

  /**
   * Расчет статистики
   */
  private calculateStatistics(scoredMasks: ScoredMask[]): ScoringResult['statistics'] {
    const total = scoredMasks.length;
    const averageScore = scoredMasks.reduce((sum, mask) => sum + mask.score, 0) / total;
    
    const distribution = {
      high: scoredMasks.filter(mask => mask.classification === 'HIGH_COMMERCIAL').length,
      medium: scoredMasks.filter(mask => mask.classification === 'MEDIUM_COMMERCIAL').length,
      low: scoredMasks.filter(mask => mask.classification === 'LOW_COMMERCIAL').length,
      info: scoredMasks.filter(mask => mask.classification === 'INFO_QUERY').length
    };
    
    const topCommercialMasks = scoredMasks
      .filter(mask => mask.classification === 'HIGH_COMMERCIAL')
      .slice(0, 10);
    
    const totalActionTokens = scoredMasks.reduce((sum, mask) => sum + mask.breakdown.actionTokens.length, 0);
    const totalBrandModelTokens = scoredMasks.reduce((sum, mask) => sum + mask.breakdown.brandModelTokens.length, 0);
    const totalGeoTokens = scoredMasks.reduce((sum, mask) => sum + mask.breakdown.geoTokens.length, 0);
    
    return {
      totalMasks: total,
      averageScore: Math.round(averageScore * 1000) / 1000,
      distribution,
      topCommercialMasks,
      totalActionTokens,
      totalBrandModelTokens,
      totalGeoTokens
    };
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(scoredMasks: ScoredMask[], threshold: number): string[] {
    const recommendations: string[] = [];
    
    const highCommercial = scoredMasks.filter(mask => mask.classification === 'HIGH_COMMERCIAL').length;
    const total = scoredMasks.length;
    const highRatio = highCommercial / total;
    
    if (highRatio > 0.3) {
      recommendations.push(`Отличное качество масок: ${Math.round(highRatio * 100)}% высококоммерческих`);
    } else if (highRatio > 0.1) {
      recommendations.push(`Хорошее качество масок: ${Math.round(highRatio * 100)}% высококоммерческих`);
    } else {
      recommendations.push(`Низкое качество масок: только ${Math.round(highRatio * 100)}% высококоммерческих`);
    }
    
    const infoQueries = scoredMasks.filter(mask => mask.classification === 'INFO_QUERY').length;
    if (infoQueries > total * 0.2) {
      recommendations.push(`Много информационных запросов (${infoQueries}) - возможно, стоит добавить больше коммерческих токенов`);
    }
    
    const averageLength = scoredMasks.reduce((sum, mask) => sum + mask.breakdown.length, 0) / total;
    if (averageLength > 8) {
      recommendations.push(`Слишком длинные маски (${averageLength.toFixed(1)} слов в среднем) - рекомендуется упростить`);
    }
    
    const topMasks = scoredMasks.slice(0, 5);
    recommendations.push(`Лучшие маски: ${topMasks.map(mask => mask.original).join(', ')}`);
    
    return recommendations;
  }

  /**
   * Фильтрация масок по порогу
   */
  filterByThreshold(scoredMasks: ScoredMask[], threshold: number): ScoredMask[] {
    return scoredMasks.filter(mask => mask.score >= threshold);
  }

  /**
   * Экспорт результатов скоринга
   */
  exportScoringResult(result: ScoringResult, format: 'csv' | 'json' = 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(result, null, 2);
    }
    
    // CSV формат
    const headers = [
      'Маска', 'Скор', 'Классификация', 'ACTION_токены', 'BRAND_MODEL_токены',
      'GEO_токены', 'INFO_триггеры', 'Длина', 'ACTION_скор', 'BRAND_MODEL_скор',
      'Длина_скор', 'GEO_скор', 'INFO_штраф', 'Уверенность'
    ];
    
    const rows = result.masks.map(mask => [
      `"${mask.original.replace(/"/g, '""')}"`,
      mask.score.toString(),
      mask.classification,
      `"${mask.breakdown.actionTokens.join(', ')}"`,
      `"${mask.breakdown.brandModelTokens.join(', ')}"`,
      `"${mask.breakdown.geoTokens.join(', ')}"`,
      `"${mask.breakdown.infoTriggers.join(', ')}"`,
      mask.breakdown.length.toString(),
      mask.components.actionScore.toString(),
      mask.components.brandModelScore.toString(),
      mask.components.lengthScore.toString(),
      mask.components.geoScore.toString(),
      mask.components.infoPenalty.toString(),
      mask.confidence.toString()
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Установка весов
   */
  setWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Получение текущих весов
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Анализ эффективности весов
   */
  analyzeWeightsEffectiveness(masks: string[], masks2: string[]): {
    currentResult: ScoringResult;
    alternativeResult: ScoringResult;
    recommendation: string;
  } {
    // Результат с текущими весами
    const currentResult = this.scoreMasks(masks);
    
    // Результат с альтернативными весами (более сбалансированными)
    const alternativeWeights: ScoringWeights = {
      theta1: 0.3,
      theta2: 0.3,
      theta3: 0.2,
      theta4: 0.2,
      infoPenalty: 0.15
    };
    
    const alternativeScorer = new CommercialScorerV2(alternativeWeights);
    const alternativeResult = alternativeScorer.scoreMasks(masks);
    
    // Сравнение и рекомендация
    const currentHighRatio = currentResult.statistics.distribution.high / currentResult.statistics.totalMasks;
    const altHighRatio = alternativeResult.statistics.distribution.high / alternativeResult.statistics.totalMasks;
    
    let recommendation = '';
    if (altHighRatio > currentHighRatio * 1.1) {
      recommendation = 'Рекомендуется использовать более сбалансированные веса для лучшего выявления коммерческих масок';
    } else if (currentHighRatio > altHighRatio * 1.1) {
      recommendation = 'Текущие веса работают оптимально для данного набора масок';
    } else {
      recommendation = 'Разница в эффективности незначительна, можно использовать любые веса';
    }
    
    return {
      currentResult,
      alternativeResult,
      recommendation
    };
  }
}

// Экспорт утилит
export const CommercialScorerUtils = {
  /**
   * Быстрый скор маски без подробного анализа
   */
  quickScore(mask: string): number {
    const words = mask.toLowerCase().split(/\s+/);
    let score = 0;
    
    // ACTION токены
    if (words.some(word => ACTION_TOKENS.some(token => word.includes(token)))) score += 0.4;
    
    // BRAND/MODEL токены
    const brandModelCount = words.filter(word => 
      BRAND_TOKENS.some(token => word.includes(token)) ||
      MODEL_TOKENS.some(token => word.includes(token))
    ).length;
    score += Math.min(brandModelCount * 0.15, 0.3);
    
    // GEO токены
    if (words.some(word => GEO_TOKENS.some(token => word.includes(token)))) score += 0.1;
    
    // Длина
    if (words.length <= 5) score += 0.2;
    else if (words.length <= 8) score += 0.1;
    
    // INFO штраф
    if (words.some(word => INFO_TRIGGERS.some(trigger => word.includes(trigger)))) score -= 0.2;
    
    return Math.max(0, score);
  },

  /**
   * Генерация примеров масок разных классов
   */
  generateExampleMasks(): { high: string[], medium: string[], low: string[], info: string[] } {
    return {
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
        'как выбрать iphone',
        'что лучше samsung или xiaomi',
        'характеристики iphone 15'
      ]
    };
  }
};
