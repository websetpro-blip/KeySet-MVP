// lib/operators-policy.ts
// Система управления операторами Яндекс.Директ для профессионального генератора масок

export type OperatorPolicy = 'strict' | 'phrase' | 'plus' | 'mix';

export interface OperatorConfig {
  name: string;
  description: string;
  symbol: string;
  example: string;
  priority: number; // Приоритет применения (1 = высший)
  applicable: boolean; // Доступна ли для данного типа масок
}

export interface MaskWithOperators {
  original: string;
  strict: string;    // Фиксация всех ключевых слов (!)
  phrase: string;    // Фразовое соответствие ("")
  plus: string;      // Служебные слова (+в +с)
  mix: string[];     // Комбинация всех операторов
  selectedPolicy: OperatorPolicy;
}

export interface PolicyApplicationResult {
  success: boolean;
  results: MaskWithOperators[];
  errors: string[];
  totalGenerated: number;
  policyDistribution: Record<OperatorPolicy, number>;
}

// Константы для операторов
const OPERATORS = {
  STRICT: '!',      // Фиксация
  PHRASE: '"',      // Фразовое соответствие  
  PLUS: '+',        // Служебные слова
} as const;

const SERVICE_WORDS = [
  'в', 'во', 'на', 'по', 'для', 'от', 'до', 'за', 'из', 'без', 'под', 'над', 'между', 'через'
];

const RUSSIAN_PREPOSITIONS = [
  'без', 'в', 'во', 'вместо', 'вне', 'для', 'до', 'за', 'из', 'из-за', 'из-под', 
  'к', 'кроме', 'между', 'на', 'над', 'надо', 'не', 'ни', 'о', 'об', 'обо', 'от', 
  'перед', 'под', 'подо', 'при', 'про', 'ради', 'с', 'со', 'сквозь', 'среди', 
  'у', 'через'
];

const FUNCTION_WORDS = [
  'очень', 'тоже', 'также', 'только', 'даже', 'уже', 'еще', 'ещё', 'все', 'всё',
  'мой', 'моя', 'моё', 'твой', 'твоя', 'твоё', 'его', 'её', 'их', 'наш', 'наша', 'наше'
];

const INFO_TRIGGERS = [
  'как', 'что', 'где', 'когда', 'зачем', 'почему', 'инструкция', 'рецепт',
  'отзыв', 'обзор', 'сравнение', 'тест', 'характеристики'
];

/**
 * OperatorsPolicy - система управления операторами Яндекс.Директ
 */
export class OperatorsPolicy {
  private policy: OperatorPolicy;

  constructor(policy: OperatorPolicy = 'mix') {
    this.policy = policy;
  }

  /**
   * Применение политики операторов к списку масок
   */
  apply(masks: string[]): PolicyApplicationResult {
    try {
      const results: MaskWithOperators[] = [];
      const errors: string[] = [];
      const distribution: Record<OperatorPolicy, number> = {
        strict: 0, phrase: 0, plus: 0, mix: 0
      };

      masks.forEach((mask, index) => {
        try {
          const maskWithOps = this.applyToMask(mask);
          results.push(maskWithOps);
          distribution[maskWithOps.selectedPolicy]++;
        } catch (error) {
          errors.push(`Маска ${index + 1}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
      });

      return {
        success: errors.length === 0,
        results,
        errors,
        totalGenerated: results.length,
        policyDistribution: distribution
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : 'Критическая ошибка генерации'],
        totalGenerated: 0,
        policyDistribution: { strict: 0, phrase: 0, plus: 0, mix: 0 }
      };
    }
  }

  /**
   * Применение политики к одной маске
   */
  private applyToMask(mask: string): MaskWithOperators {
    const words = this.tokenizeMask(mask);
    const serviceWords = this.detectServiceWords(words);

    // Генерируем варианты с операторами
    const strict = this.generateStrictVersion(words, serviceWords);
    const phrase = this.generatePhraseVersion(words);
    const plus = this.generatePlusVersion(words, serviceWords);
    const mix = this.generateMixVersions(words, serviceWords);

    // Выбираем политику по умолчанию
    let selectedPolicy: OperatorPolicy = this.policy;
    
    // Автоматический выбор политики на основе контента
    if (this.policy === 'mix') {
      selectedPolicy = this.selectBestPolicy(words, serviceWords);
    }

    return {
      original: mask,
      strict,
      phrase,
      plus,
      mix,
      selectedPolicy
    };
  }

  /**
   * Токенизация маски на слова
   */
  private tokenizeMask(mask: string): string[] {
    return mask
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.trim().length > 0)
      .map(word => word.replace(/[^\wа-яё]/gi, ''));
  }

  /**
   * Определение служебных слов в маске
   */
  private detectServiceWords(words: string[]): {
    prepositions: string[];
    functionWords: string[];
    infoTriggers: string[];
    contentWords: string[];
  } {
    const prepositions: string[] = [];
    const functionWords: string[] = [];
    const infoTriggers: string[] = [];
    const contentWords: string[] = [];

    words.forEach(word => {
      if (RUSSIAN_PREPOSITIONS.includes(word)) {
        prepositions.push(word);
      } else if (FUNCTION_WORDS.includes(word)) {
        functionWords.push(word);
      } else if (INFO_TRIGGERS.includes(word)) {
        infoTriggers.push(word);
      } else {
        contentWords.push(word);
      }
    });

    return { prepositions, functionWords, infoTriggers, contentWords };
  }

  /**
   * Строгая фиксация (!) - все ключевые слова фиксируются
   */
  private generateStrictVersion(words: string[], serviceWords: ReturnType<typeof this.detectServiceWords>): string {
    const fixedWords = words.map(word => `${OPERATORS.STRICT}${word}`);
    return fixedWords.join(' ');
  }

  /**
   * Фразовое соответствие (") - вся фраза в кавычках
   */
  private generatePhraseVersion(words: string[]): string {
    const phrase = words.join(' ');
    return `${OPERATORS.PHRASE}${phrase}${OPERATORS.PHRASE}`;
  }

  /**
   * Служебные слова (+) - плюсы только перед служебными словами
   */
  private generatePlusVersion(words: string[], serviceWords: ReturnType<typeof this.detectServiceWords>): string {
    return words.map(word => {
      if (serviceWords.prepositions.includes(word) || serviceWords.functionWords.includes(word)) {
        return `${OPERATORS.PLUS}${word}`;
      }
      return word;
    }).join(' ');
  }

  /**
   * Смешанная политика - различные комбинации операторов
   */
  private generateMixVersions(words: string[], serviceWords: ReturnType<typeof this.detectServiceWords>): string[] {
    const versions: string[] = [];

    // Версия 1: Смешанная - фиксация контента + плюсы для служебных
    const mixed1 = words.map(word => {
      if (serviceWords.contentWords.includes(word)) {
        return `${OPERATORS.STRICT}${word}`;
      } else if (serviceWords.prepositions.includes(word)) {
        return `${OPERATORS.PLUS}${word}`;
      }
      return word;
    }).join(' ');
    versions.push(mixed1);

    // Версия 2: Консервативная - только фиксация важных слов
    const contentWords = serviceWords.contentWords;
    if (contentWords.length >= 2) {
      const conservative = words.map(word => {
        if (contentWords.includes(word)) {
          return `${OPERATORS.STRICT}${word}`;
        }
        return word;
      }).join(' ');
      versions.push(conservative);
    }

    // Версия 3: Агрессивная - всё фиксируется
    const aggressive = words.map(word => `${OPERATORS.STRICT}${word}`).join(' ');
    versions.push(aggressive);

    return versions;
  }

  /**
   * Автоматический выбор лучшей политики для маски
   */
  private selectBestPolicy(words: string[], serviceWords: ReturnType<typeof this.detectServiceWords>): OperatorPolicy {
    const { contentWords, prepositions, infoTriggers } = serviceWords;
    
    // Если есть INFO-триггеры - используем строгую фиксацию
    if (infoTriggers.length > 0) {
      return 'strict';
    }

    // Если много служебных слов - используем плюсы
    if (prepositions.length > 1) {
      return 'plus';
    }

    // Если много контентных слов (товары, бренды) - используем строгую
    if (contentWords.length >= 3) {
      return 'strict';
    }

    // По умолчанию - фразовое соответствие
    return 'phrase';
  }

  /**
   * Установка политики
   */
  setPolicy(policy: OperatorPolicy): void {
    this.policy = policy;
  }

  /**
   * Получение текущей политики
   */
  getPolicy(): OperatorPolicy {
    return this.policy;
  }

  /**
   * Получение конфигурации политик
   */
  static getAvailablePolicies(): OperatorConfig[] {
    return [
      {
        name: 'strict',
        description: 'Строгая фиксация всех ключевых слов',
        symbol: OPERATORS.STRICT,
        example: 'купить !iphone !15 !москва',
        priority: 1,
        applicable: true
      },
      {
        name: 'phrase',
        description: 'Фразовое соответствие всей фразы',
        symbol: OPERATORS.PHRASE,
        example: '"купить iphone 15 москва"',
        priority: 2,
        applicable: true
      },
      {
        name: 'plus',
        description: 'Служебные слова с плюсами',
        symbol: OPERATORS.PLUS,
        example: 'купить +в +на iphone 15 москва',
        priority: 3,
        applicable: true
      },
      {
        name: 'mix',
        description: 'Автоматический выбор оптимальной политики',
        symbol: '🔄',
        example: 'Автоматически выбирает между всеми вариантами',
        priority: 4,
        applicable: true
      }
    ];
  }

  /**
   * Получение статистики по политикам
   */
  static analyzeMask(masks: string[]): {
    totalMasks: number;
    avgWords: number;
    serviceWordsRatio: number;
    contentWordsRatio: number;
    recommendedPolicy: OperatorPolicy;
    reasoning: string;
  } {
    let totalWords = 0;
    let totalServiceWords = 0;
    let totalContentWords = 0;

    masks.forEach(mask => {
      const words = mask.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const serviceWords = this.detectServiceWordsSimple(words);
      
      totalWords += words.length;
      totalServiceWords += serviceWords.serviceCount;
      totalContentWords += serviceWords.contentCount;
    });

    const serviceRatio = totalWords > 0 ? totalServiceWords / totalWords : 0;
    const contentRatio = totalWords > 0 ? totalContentWords / totalWords : 0;
    
    let recommendedPolicy: OperatorPolicy;
    let reasoning: string;

    if (serviceRatio > 0.4) {
      recommendedPolicy = 'plus';
      reasoning = `Высокая доля служебных слов (${(serviceRatio * 100).toFixed(1)}%). Рекомендуется использовать плюсы.`;
    } else if (contentRatio > 0.6) {
      recommendedPolicy = 'strict';
      reasoning = `Высокая доля контентных слов (${(contentRatio * 100).toFixed(1)}%). Рекомендуется строгая фиксация.`;
    } else {
      recommendedPolicy = 'phrase';
      reasoning = `Сбалансированный состав. Рекомендуется фразовое соответствие.`;
    }

    return {
      totalMasks: masks.length,
      avgWords: totalWords / masks.length,
      serviceWordsRatio: serviceRatio,
      contentWordsRatio: contentRatio,
      recommendedPolicy,
      reasoning
    };
  }

  /**
   * Упрощенное определение служебных слов
   */
  private static detectServiceWordsSimple(words: string[]): {
    serviceCount: number;
    contentCount: number;
  } {
    let serviceCount = 0;
    let contentCount = 0;

    words.forEach(word => {
      if (RUSSIAN_PREPOSITIONS.includes(word) || FUNCTION_WORDS.includes(word) || INFO_TRIGGERS.includes(word)) {
        serviceCount++;
      } else {
        contentCount++;
      }
    });

    return { serviceCount, contentCount };
  }

  /**
   * Экспорт масок в различных форматах
   */
  static exportMasks(results: MaskWithOperators[], format: 'csv' | 'txt' = 'csv'): string {
    if (format === 'csv') {
      const headers = ['Оригинал', 'Строгая фиксация', 'Фразовое', 'С плюсами', 'Рекомендуемая политика'];
      const rows = results.map(result => [
        result.original,
        result.strict,
        result.phrase,
        result.plus,
        result.selectedPolicy
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      return csvContent;
    } else {
      // TXT формат
      return results.map(result => {
        const lines = [
          `Оригинал: ${result.original}`,
          `Строгая фиксация: ${result.strict}`,
          `Фразовое: ${result.phrase}`,
          `С плюсами: ${result.plus}`,
          `Рекомендуемая: ${result.selectedPolicy}`,
          ''
        ];
        return lines.join('\n');
      }).join('\n');
    }
  }
}
