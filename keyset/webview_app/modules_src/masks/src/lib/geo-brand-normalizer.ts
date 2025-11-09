// lib/geo-brand-normalizer.ts
// Система нормализации географических названий и брендов с синонимами и транслитерацией

export interface NormalizationRule {
  original: string;
  normalized: string[];
  confidence: number;
  category: 'geo' | 'brand';
  variants: {
    synonym: string[];    // Синонимы
    transliteration: string[]; // Транслитерация
    abbreviation: string[];    // Аббревиатуры
    full: string[];           // Полные формы
  };
}

export interface NormalizationResult {
  original: string;
  normalized: string[];
  rules: NormalizationRule[];
  categories: {
    geo: NormalizationRule[];
    brand: NormalizationRule[];
  };
  variants: {
    geographic: string[];
    brandVariants: string[];
    transliterations: string[];
  };
  confidence: number;
  recommendations: string[];
}

export interface BulkNormalizationResult {
  results: NormalizationResult[];
  summary: {
    totalMasks: number;
    withGeoNormalization: number;
    withBrandNormalization: number;
    withTransliteration: number;
    averageVariants: number;
    totalUniqueVariants: number;
  };
  statistics: {
    mostCommonGeo: Array<{ name: string; variants: number }>;
    mostCommonBrands: Array<{ name: string; variants: number }>;
    topTransliterations: Array<{ original: string; variants: string[] }>;
  };
}

/**
 * GeoBrandNormalizer - система нормализации географических названий и брендов
 */
export class GeoBrandNormalizer {
  private geoRules: Map<string, NormalizationRule> = new Map();
  private brandRules: Map<string, NormalizationRule> = new Map();

  constructor() {
    this.initializeNormalizationRules();
  }

  /**
   * Инициализация правил нормализации
   */
  private initializeNormalizationRules(): void {
    // Географические правила
    this.addGeoRule('москва', ['москва', 'мск', 'г.москва'], 1.0, {
      synonym: ['г.москва', 'г.мск', 'московская область', 'мо'],
      transliteration: [],
      abbreviation: ['мск'],
      full: ['москва']
    });

    this.addGeoRule('спб', ['спб', 'санкт-петербург', 'петербург', 'питер'], 1.0, {
      synonym: ['спб', 'петербург', 'питер'],
      transliteration: [],
      abbreviation: ['спб', 'питер'],
      full: ['санкт-петербург']
    });

    this.addGeoRule('новосибирск', ['новосибирск', 'нск'], 1.0, {
      synonym: ['новосибирск', 'нск'],
      transliteration: [],
      abbreviation: ['нск'],
      full: ['новосибирск']
    });

    this.addGeoRule('екатеринбург', ['екатеринбург', 'ебург'], 0.9, {
      synonym: ['екатеринбург', 'ебург', 'екат'],
      transliteration: [],
      abbreviation: ['ебург', 'екат'],
      full: ['екатеринбург']
    });

    this.addGeoRule('казань', ['казань', 'казан'], 1.0, {
      synonym: ['казань', 'казан'],
      transliteration: [],
      abbreviation: [],
      full: ['казань']
    });

    this.addGeoRule('нижний новгород', ['нижний новгород', 'нн'], 0.9, {
      synonym: ['нижний новгород', 'нижний', 'нн'],
      transliteration: [],
      abbreviation: ['нн'],
      full: ['нижний новгород']
    });

    // Брендовые правила
    this.addBrandRule('xiaomi', ['xiaomi', 'сяоми', 'ксиоми', 'ксяоми'], 1.0, {
      synonym: [],
      transliteration: ['сяоми', 'ксиоми', 'ксяоми'],
      abbreviation: ['xiaomi'],
      full: ['xiaomi']
    });

    this.addBrandRule('samsung', ['samsung', 'samsung'], 1.0, {
      synonym: [],
      transliteration: ['самсунг'],
      abbreviation: [],
      full: ['samsung']
    });

    this.addBrandRule('apple', ['apple', 'apple'], 1.0, {
      synonym: [],
      transliteration: ['эпл'],
      abbreviation: [],
      full: ['apple']
    });

    this.addBrandRule('huawei', ['huawei', 'хуавей', 'хуавей'], 1.0, {
      synonym: [],
      transliteration: ['хуавей'],
      abbreviation: [],
      full: ['huawei']
    });

    this.addBrandRule('asus', ['asus', 'асус'], 1.0, {
      synonym: [],
      transliteration: ['асус'],
      abbreviation: [],
      full: ['asus']
    });

    this.addBrandRule('acer', ['acer', 'эйсер'], 1.0, {
      synonym: [],
      transliteration: ['эйсер'],
      abbreviation: [],
      full: ['acer']
    });

    this.addBrandRule('lenovo', ['lenovo', 'леново'], 1.0, {
      synonym: [],
      transliteration: ['леново'],
      abbreviation: [],
      full: ['lenovo']
    });
  }

  /**
   * Добавление правила для географического названия
   */
  private addGeoRule(keyword: string, normalized: string[], confidence: number, variants: NormalizationRule['variants']): void {
    const rule: NormalizationRule = {
      original: keyword,
      normalized,
      confidence,
      category: 'geo',
      variants
    };
    this.geoRules.set(keyword.toLowerCase(), rule);
  }

  /**
   * Добавление правила для бренда
   */
  private addBrandRule(keyword: string, normalized: string[], confidence: number, variants: NormalizationRule['variants']): void {
    const rule: NormalizationRule = {
      original: keyword,
      normalized,
      confidence,
      category: 'brand',
      variants
    };
    this.brandRules.set(keyword.toLowerCase(), rule);
  }

  /**
   * Нормализация одной маски
   */
  normalize(mask: string): NormalizationResult {
    const words = this.tokenize(mask);
    const normalizedWords = [...words]; // Копия для модификации
    const geoRules: NormalizationRule[] = [];
    const brandRules: NormalizationRule[] = [];
    
    // Применяем нормализацию к каждому слову
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      // Проверяем географические правила
      const geoRule = this.findGeoRule(word);
      if (geoRule) {
        geoRules.push(geoRule);
        normalizedWords[i] = geoRule.normalized[0]; // Используем основную форму
      }
      
      // Проверяем брендовые правила
      const brandRule = this.findBrandRule(word);
      if (brandRule) {
        brandRules.push(brandRule);
        normalizedWords[i] = brandRule.normalized[0]; // Используем основную форму
      }
    }
    
    // Генерируем варианты для каждого найденного токена
    const variants = this.generateVariants(geoRules, brandRules);
    
    // Рассчитываем уверенность
    const confidence = this.calculateConfidence(geoRules, brandRules);
    
    // Формируем результат
    const result: NormalizationResult = {
      original: mask,
      normalized: normalizedWords,
      rules: [...geoRules, ...brandRules],
      categories: {
        geo: geoRules,
        brand: brandRules
      },
      variants,
      confidence,
      recommendations: this.generateRecommendations(geoRules, brandRules)
    };
    
    return result;
  }

  /**
   * Массовая нормализация масок
   */
  bulkNormalize(masks: string[]): BulkNormalizationResult {
    const results = masks.map(mask => this.normalize(mask));
    
    const summary = {
      totalMasks: masks.length,
      withGeoNormalization: results.filter(r => r.categories.geo.length > 0).length,
      withBrandNormalization: results.filter(r => r.categories.brand.length > 0).length,
      withTransliteration: results.filter(r => r.variants.transliterations.length > 0).length,
      averageVariants: 0,
      totalUniqueVariants: 0
    };
    
    // Подсчитываем варианты
    const allVariants = new Set<string>();
    let totalVariants = 0;
    
    results.forEach(result => {
      totalVariants += result.variants.geographic.length + result.variants.brandVariants.length;
      result.variants.geographic.forEach(v => allVariants.add(v));
      result.variants.brandVariants.forEach(v => allVariants.add(v));
      result.variants.transliterations.forEach(v => allVariants.add(v));
    });
    
    summary.averageVariants = totalVariants / masks.length;
    summary.totalUniqueVariants = allVariants.size;
    
    // Статистика
    const statistics = this.calculateStatistics(results);
    
    return {
      results,
      summary,
      statistics
    };
  }

  /**
   * Токенизация строки
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[^\wа-яё]/gi, ''))
      .filter(word => word.length > 0);
  }

  /**
   * Поиск правила для географического названия
   */
  private findGeoRule(word: string): NormalizationRule | null {
    // Точное совпадение
    if (this.geoRules.has(word)) {
      return this.geoRules.get(word)!;
    }
    
    // Частичное совпадение
    for (const [key, rule] of this.geoRules) {
      if (word.includes(key) || key.includes(word)) {
        return rule;
      }
    }
    
    return null;
  }

  /**
   * Поиск правила для бренда
   */
  private findBrandRule(word: string): NormalizationRule | null {
    // Точное совпадение
    if (this.brandRules.has(word)) {
      return this.brandRules.get(word)!;
    }
    
    // Частичное совпадение
    for (const [key, rule] of this.brandRules) {
      if (word.includes(key) || key.includes(word)) {
        return rule;
      }
    }
    
    return null;
  }

  /**
   * Генерация вариантов на основе найденных правил
   */
  private generateVariants(geoRules: NormalizationRule[], brandRules: NormalizationRule[]): NormalizationResult['variants'] {
    const geographic: string[] = [];
    const brandVariants: string[] = [];
    const transliterations: string[] = [];
    
    // Географические варианты
    geoRules.forEach(rule => {
      geographic.push(...rule.variants.synonym, ...rule.variants.abbreviation, ...rule.variants.full);
      transliterations.push(...rule.variants.transliteration);
    });
    
    // Брендовые варианты
    brandRules.forEach(rule => {
      brandVariants.push(...rule.variants.synonym, ...rule.variants.abbreviation, ...rule.variants.full);
      transliterations.push(...rule.variants.transliteration);
    });
    
    // Убираем дубликаты
    const uniqueGeographic = [...new Set(geographic)];
    const uniqueBrands = [...new Set(brandVariants)];
    const uniqueTransliterations = [...new Set(transliterations)];
    
    return {
      geographic: uniqueGeographic,
      brandVariants: uniqueBrands,
      transliterations: uniqueTransliterations
    };
  }

  /**
   * Расчет уверенности в нормализации
   */
  private calculateConfidence(geoRules: NormalizationRule[], brandRules: NormalizationRule[]): number {
    let confidence = 0.5; // Базовый уровень
    
    const allRules = [...geoRules, ...brandRules];
    
    if (allRules.length === 0) return 0;
    
    // Увеличиваем уверенность при наличии правил
    confidence += allRules.length * 0.2;
    
    // Увеличиваем за высокую уверенность правил
    const avgConfidence = allRules.reduce((sum, rule) => sum + rule.confidence, 0) / allRules.length;
    confidence += avgConfidence * 0.3;
    
    // Штраф за противоречивые правила
    const geoVariants = new Set(geoRules.map(r => r.original));
    const brandVariants = new Set(brandRules.map(r => r.original));
    
    let conflicts = 0;
    geoVariants.forEach(variant => {
      if (brandVariants.has(variant)) conflicts++;
    });
    
    confidence -= conflicts * 0.1;
    
    return Math.max(0, Math.min(confidence, 1.0));
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(geoRules: NormalizationRule[], brandRules: NormalizationRule[]): string[] {
    const recommendations: string[] = [];
    
    if (geoRules.length > 0) {
      const geoNames = geoRules.map(rule => rule.original).join(', ');
      recommendations.push(`Найдены географические варианты: ${geoNames}`);
    }
    
    if (brandRules.length > 0) {
      const brandNames = brandRules.map(rule => rule.original).join(', ');
      recommendations.push(`Найдены брендовые варианты: ${brandNames}`);
    }
    
    if (geoRules.length === 0 && brandRules.length === 0) {
      recommendations.push('Географические названия и бренды не обнаружены');
    }
    
    return recommendations;
  }

  /**
   * Расчет статистики
   */
  private calculateStatistics(results: NormalizationResult[]): BulkNormalizationResult['statistics'] {
    const geoCounts = new Map<string, number>();
    const brandCounts = new Map<string, number>();
    const transliterationMap = new Map<string, string[]>();
    
    results.forEach(result => {
      result.categories.geo.forEach(rule => {
        geoCounts.set(rule.original, (geoCounts.get(rule.original) || 0) + 1);
      });
      
      result.categories.brand.forEach(rule => {
        brandCounts.set(rule.original, (brandCounts.get(rule.original) || 0) + 1);
      });
      
      result.variants.transliterations.forEach(transliteration => {
        const variants = transliterationMap.get(transliteration) || [];
        variants.push(transliteration);
        transliterationMap.set(transliteration, variants);
      });
    });
    
    const mostCommonGeo = Array.from(geoCounts.entries())
      .map(([name, count]) => ({ name, variants: count }))
      .sort((a, b) => b.variants - a.variants)
      .slice(0, 10);
    
    const mostCommonBrands = Array.from(brandCounts.entries())
      .map(([name, count]) => ({ name, variants: count }))
      .sort((a, b) => b.variants - a.variants)
      .slice(0, 10);
    
    const topTransliterations = Array.from(transliterationMap.entries())
      .map(([original, variants]) => ({ original, variants }))
      .sort((a, b) => b.variants.length - a.variants.length)
      .slice(0, 10);
    
    return {
      mostCommonGeo,
      mostCommonBrands,
      topTransliterations
    };
  }

  /**
   * Добавление пользовательского правила
   */
  addCustomRule(category: 'geo' | 'brand', original: string, normalized: string[], confidence: number = 0.8): void {
    const variants: NormalizationRule['variants'] = {
      synonym: [],
      transliteration: [],
      abbreviation: [],
      full: normalized
    };
    
    const rule: NormalizationRule = {
      original,
      normalized,
      confidence,
      category,
      variants
    };
    
    if (category === 'geo') {
      this.geoRules.set(original.toLowerCase(), rule);
    } else {
      this.brandRules.set(original.toLowerCase(), rule);
    }
  }

  /**
   * Удаление правила
   */
  removeRule(category: 'geo' | 'brand', original: string): boolean {
    const key = original.toLowerCase();
    
    if (category === 'geo') {
      return this.geoRules.delete(key);
    } else {
      return this.brandRules.delete(key);
    }
  }

  /**
   * Экспорт правил
   */
  exportRules(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      const rules = {
        geo: Object.fromEntries(this.geoRules),
        brand: Object.fromEntries(this.brandRules)
      };
      return JSON.stringify(rules, null, 2);
    }
    
    // CSV формат
    const headers = ['Категория', 'Оригинал', 'Нормализованные', 'Уверенность'];
    const rows: string[] = [];
    
    this.geoRules.forEach(rule => {
      rows.push([
        'geo',
        rule.original,
        rule.normalized.join('|'),
        rule.confidence.toString()
      ].join(','));
    });
    
    this.brandRules.forEach(rule => {
      rows.push([
        'brand',
        rule.original,
        rule.normalized.join('|'),
        rule.confidence.toString()
      ].join(','));
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Анализ эффективности нормализации
   */
  analyzeEffectiveness(masks: string[]): {
    originalCount: number;
    normalizedCount: number;
    expansionRatio: number;
    topImprovements: Array<{ mask: string; variants: number }>;
    recommendations: string[];
  } {
    const results = this.bulkNormalize(masks);
    const improvements = results.results.map(result => ({
      mask: result.original,
      variants: result.variants.geographic.length + result.variants.brandVariants.length + result.variants.transliterations.length
    }));
    
    improvements.sort((a, b) => b.variants - a.variants);
    
    const recommendations = [
      `Всего обработано масок: ${results.summary.totalMasks}`,
      `Средний прирост вариантов: ${results.summary.averageVariants.toFixed(1)}`,
      `Уникальных вариантов: ${results.summary.totalUniqueVariants}`,
      `Масок с географической нормализацией: ${results.summary.withGeoNormalization}`,
      `Масок с брендовой нормализацией: ${results.summary.withBrandNormalization}`
    ];
    
    return {
      originalCount: masks.length,
      normalizedCount: results.summary.totalUniqueVariants,
      expansionRatio: results.summary.totalUniqueVariants / masks.length,
      topImprovements: improvements.slice(0, 10),
      recommendations
    };
  }
}

// Экспорт утилит
export const GeoBrandNormalizerUtils = {
  /**
   * Быстрая проверка содержит ли маска географические или брендовые токены
   */
  quickAnalyze(mask: string): {
    hasGeo: boolean;
    hasBrand: boolean;
    confidence: number;
    matched: string[];
  } {
    const words = mask.toLowerCase().split(/\s+/);
    const matched: string[] = [];
    let hasGeo = false;
    let hasBrand = false;
    
    const geoKeywords = ['москва', 'спб', 'санкт-петербург', 'новосибирск', 'екатеринбург'];
    const brandKeywords = ['apple', 'samsung', 'xiaomi', 'huawei', 'asus', 'acer', 'lenovo'];
    
    words.forEach(word => {
      if (geoKeywords.some(keyword => word.includes(keyword))) {
        hasGeo = true;
        matched.push(word);
      }
      if (brandKeywords.some(keyword => word.includes(keyword))) {
        hasBrand = true;
        matched.push(word);
      }
    });
    
    const confidence = (hasGeo ? 0.5 : 0) + (hasBrand ? 0.5 : 0);
    
    return { hasGeo, hasBrand, confidence, matched };
  },

  /**
   * Генерация примера масок для демонстрации
   */
  generateDemoMasks(): string[] {
    return [
      'купить iphone 15 москва цена',
      'xiaomi redmi note 13 спб в наличии',
      'samsung galaxy s24 новосибирск недорого',
      'huawei p50 екатеринбург акция',
      'asus zenbook казань заказать',
      'lenovo thinkpad нижний новгород',
      'acer aspire москва купить',
      'macbook pro спб цена',
      'ipad air новосибирск доставка',
      'samsung tv екатеринбург установка'
    ];
  }
};
