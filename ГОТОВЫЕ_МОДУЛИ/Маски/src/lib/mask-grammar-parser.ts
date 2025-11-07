// lib/mask-grammar-parser.ts
// Парсер формул масок для Yandex.Direct профессионального генератора

export type TokenType = 'REQUIRED' | 'OPTIONAL' | 'QUANTIFIER' | 'ALTERNATIVE' | 'WORD' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface ParsedSlot {
  name: string;
  required: boolean;
  quantifier: '0-1' | '0-N' | '1-1';
  alternatives?: string[];
  position: number;
}

export interface ParsedFormula {
  slots: ParsedSlot[];
  rawFormula: string;
  valid: boolean;
  errors: string[];
  totalCombinations: number;
}

// Константы для парсинга
const BRAND_KEYWORDS = ['brand', 'бренд', 'производитель', 'company'];
const MODEL_KEYWORDS = ['model', 'модель', 'товар', 'product', 'product_name'];
const GEO_KEYWORDS = ['geo', 'city', 'город', 'местоположение', 'спб', 'москва', 'новосибирск'];
const ACTION_KEYWORDS = ['action', 'действие', 'купить', 'заказать', 'цены', 'цена', 'стоимость'];
const PRICE_KEYWORDS = ['price', 'цена', 'стоимость', 'цена от', 'цена до'];

const INFO_TRIGGERS = ['как', 'что', 'где', 'когда', 'зачем', 'почему', 'инструкция', 'рецепт', 'отзыв'];

/**
 * MaskGrammarParser - парсер формул масок
 * Синтаксис:
 * [] = обязательный слот
 * () = необязательный слот  
 * ? = 0 или 1 раз (только внутри скобок)
 * | = альтернатива
 * * = 0 или много раз (только внутри скобок)
 */
export class MaskGrammarParser {
  private formula: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(formula: string) {
    this.formula = formula.trim();
    this.tokenize();
  }

  /**
   * Лексический анализ - разбиение формулы на токены
   */
  private tokenize(): void {
    this.tokens = [];
    this.position = 0;

    while (this.position < this.formula.length) {
      const char = this.formula[this.position];
      
      // Пропускаем пробелы
      if (char === ' ') {
        this.position++;
        continue;
      }

      // Специальные символы
      if (char === '[') {
        this.tokens.push({ type: 'REQUIRED', value: '[', position: this.position });
        this.position++;
        continue;
      }
      if (char === ']') {
        this.tokens.push({ type: 'REQUIRED', value: ']', position: this.position });
        this.position++;
        continue;
      }
      if (char === '(') {
        this.tokens.push({ type: 'OPTIONAL', value: '(', position: this.position });
        this.position++;
        continue;
      }
      if (char === ')') {
        this.tokens.push({ type: 'OPTIONAL', value: ')', position: this.position });
        this.position++;
        continue;
      }
      if (char === '?') {
        this.tokens.push({ type: 'QUANTIFIER', value: '?', position: this.position });
        this.position++;
        continue;
      }
      if (char === '*') {
        this.tokens.push({ type: 'QUANTIFIER', value: '*', position: this.position });
        this.position++;
        continue;
      }
      if (char === '|') {
        this.tokens.push({ type: 'ALTERNATIVE', value: '|', position: this.position });
        this.position++;
        continue;
      }

      // Слова
      if (char !== ' ' && !'[]()?|*'.includes(char)) {
        let word = '';
        while (this.position < this.formula.length && 
               !'[]()?|* '.includes(this.formula[this.position])) {
          word += this.formula[this.position];
          this.position++;
        }
        this.tokens.push({ type: 'WORD', value: word.trim(), position: this.position - word.length });
        continue;
      }

      this.position++;
    }

    this.tokens.push({ type: 'EOF', value: '', position: this.position });
  }

  /**
   * Основной метод парсинга
   */
  parse(): ParsedFormula {
    try {
      const slots: ParsedSlot[] = [];
      this.position = 0;

      while (!this.eof()) {
        const slot = this.parseSlot();
        if (slot) {
          slots.push(slot);
        }
      }

      const errors = this.validateSlots(slots);
      const totalCombinations = this.calculateCombinations(slots);

      return {
        slots,
        rawFormula: this.formula,
        valid: errors.length === 0,
        errors,
        totalCombinations
      };
    } catch (error) {
      return {
        slots: [],
        rawFormula: this.formula,
        valid: false,
        errors: [`Парсинг прерван: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`],
        totalCombinations: 0
      };
    }
  }

  /**
   * Парсинг одного слота [NAME] или (NAME?)
   */
  private parseSlot(): ParsedSlot | null {
    if (this.eof()) return null;

    const startToken = this.current();
    let required = true;
    let quantifier: '0-1' | '0-N' | '1-1' = '1-1';

    // Определяем тип слота
    if (startToken.type === 'REQUIRED' && startToken.value === '[') {
      required = true;
      this.next(); // пропускаем [
    } else if (startToken.type === 'OPTIONAL' && startToken.value === '(') {
      required = false;
      this.next(); // пропускаем (
    } else {
      // Слово без скобок - treated as required word
      return this.parseWordSlot(required);
    }

    // Парсим имя слота
    const name = this.parseSlotName();
    if (!name) {
      this.raiseError('Ожидается имя слота');
      return null;
    }

    // Парсим квантификатор (если есть)
    const nextToken = this.current();
    if (nextToken.type === 'QUANTIFIER') {
      if (nextToken.value === '?') {
        quantifier = '0-1';
      } else if (nextToken.value === '*') {
        quantifier = '0-N';
      }
      this.next();
    } else {
      quantifier = required ? '1-1' : '0-1';
    }

    // Проверяем закрывающую скобку
    const closingToken = this.current();
    if (required && closingToken.type === 'REQUIRED' && closingToken.value === ']') {
      this.next(); // пропускаем ]
      return { name, required, quantifier, position: startToken.position };
    } else if (!required && closingToken.type === 'OPTIONAL' && closingToken.value === ')') {
      this.next(); // пропускаем )
      return { name, required, quantifier, position: startToken.position };
    } else {
      this.raiseError(`Ожидается ${required ? ']' : ')'} для слота ${name}`);
      return null;
    }
  }

  /**
   * Парсинг альтернатив внутри слота: NAME1|NAME2|NAME3
   */
  private parseSlotName(): string {
    const parts: string[] = [];
    
    // Первая часть имени
    const firstPart = this.parseWord();
    if (!firstPart) return '';
    parts.push(firstPart);

    // Проверяем альтернативы
    while (this.current().type === 'ALTERNATIVE') {
      this.next(); // пропускаем |
      const altPart = this.parseWord();
      if (!altPart) {
        this.raiseError('Ожидается альтернатива после |');
        break;
      }
      parts.push(altPart);
    }

    return parts.join('|');
  }

  /**
   * Парсинг отдельного слова
   */
  private parseWord(): string | null {
    const token = this.current();
    if (token.type === 'WORD') {
      this.next();
      return token.value;
    }
    return null;
  }

  /**
   * Парсинг слота без скобок (только слово)
   */
  private parseWordSlot(required: boolean): ParsedSlot | null {
    const word = this.parseWord();
    if (!word) return null;
    
    return {
      name: word,
      required,
      quantifier: required ? '1-1' : '0-1',
      position: this.position
    };
  }

  /**
   * Валидация слотов
   */
  private validateSlots(slots: ParsedSlot[]): string[] {
    const errors: string[] = [];

    // Проверяем обязательные слоты
    const requiredSlots = slots.filter(s => s.required);
    if (requiredSlots.length === 0) {
      errors.push('Формула должна содержать хотя бы один обязательный слот []');
    }

    // Проверяем дубликаты имен
    const names = new Set<string>();
    for (const slot of slots) {
      if (names.has(slot.name)) {
        errors.push(`Дубликат имени слота: ${slot.name}`);
      }
      names.add(slot.name);
    }

    // Проверяем известные типы слотов
    const unknownSlots = slots.filter(s => !this.isKnownSlotType(s.name));
    if (unknownSlots.length > 0) {
      const unknown = unknownSlots.map(s => s.name).join(', ');
      errors.push(`Неизвестные типы слотов: ${unknown}. Рекомендуемые: BRAND, MODEL, GEO, ACTION, PRICE`);
    }

    return errors;
  }

  /**
   * Проверка известного типа слота
   */
  private isKnownSlotType(name: string): boolean {
    const lower = name.toLowerCase();
    return BRAND_KEYWORDS.some(k => lower.includes(k)) ||
           MODEL_KEYWORDS.some(k => lower.includes(k)) ||
           GEO_KEYWORDS.some(k => lower.includes(k)) ||
           ACTION_KEYWORDS.some(k => lower.includes(k)) ||
           PRICE_KEYWORDS.some(k => lower.includes(k));
  }

  /**
   * Расчет количества комбинаций
   */
  private calculateCombinations(slots: ParsedSlot[]): number {
    return slots.reduce((total, slot) => {
      switch (slot.quantifier) {
        case '0-1': return total * 2; // есть или нет
        case '0-N': return total * 100; // предполагаем максимум 100 вариантов
        case '1-1': return total * 1; // обязательно есть
        default: return total;
      }
    }, 1);
  }

  /**
   * Утилиты для парсинга
   */
  private current(): Token {
    return this.tokens[this.position] || { type: 'EOF', value: '', position: this.position };
  }

  private next(): Token {
    this.position++;
    return this.current();
  }

  private eof(): boolean {
    return this.current().type === 'EOF';
  }

  private raiseError(message: string): void {
    const pos = this.current().position;
    throw new Error(`Синтаксическая ошибка на позиции ${pos}: ${message}`);
  }

  /**
   * Получение примеров использования формулы
   */
  getExamples(): string[] {
    const examples: string[] = [];
    
    // Примеры базовых формул
    examples.push('[BRAND] [MODEL] (GEO?) (ACTION|PRICE)?');
    examples.push('[SERVICE] [CITY] [ACTION] *');
    examples.push('[PRODUCT] (COLOR|SIZE) [BRAND] (GEO?)');
    examples.push('[BRAND] [MODEL] [ACTION] (GEO) (PRICE)?');
    
    // Примеры сложных формул
    examples.push('[CATEGORY] [BRAND] (MODIFIER)* [ACTION] (GEO?)');
    examples.push('[SERVICE] (AREA) [ACTION] [PRICE_RANGE] (GUARANTEE)?');

    return examples;
  }

  /**
   * Валидация формулы в реальном времени
   */
  static validateFormula(formula: string): { valid: boolean; errors: string[] } {
    try {
      const parser = new MaskGrammarParser(formula);
      const result = parser.parse();
      return {
        valid: result.valid,
        errors: result.errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка парсинга']
      };
    }
  }
}

// Экспорт утилит для работы с токенами
export const MaskGrammarUtils = {
  /**
   * Определение типа слота по имени
   */
  getSlotType(name: string): 'BRAND' | 'MODEL' | 'GEO' | 'ACTION' | 'PRICE' | 'UNKNOWN' {
    const lower = name.toLowerCase();
    
    if (BRAND_KEYWORDS.some(k => lower.includes(k))) return 'BRAND';
    if (MODEL_KEYWORDS.some(k => lower.includes(k))) return 'MODEL';
    if (GEO_KEYWORDS.some(k => lower.includes(k))) return 'GEO';
    if (ACTION_KEYWORDS.some(k => lower.includes(k))) return 'ACTION';
    if (PRICE_KEYWORDS.some(k => lower.includes(k))) return 'PRICE';
    
    return 'UNKNOWN';
  },

  /**
   * Проверка INFO-триггеров
   */
  hasInfoTriggers(text: string): boolean {
    const lower = text.toLowerCase();
    return INFO_TRIGGERS.some(trigger => lower.includes(trigger));
  },

  /**
   * Получение предварительного просмотра генерации
   */
  generatePreview(parsedFormula: ParsedFormula): string[] {
    if (!parsedFormula.valid || parsedFormula.slots.length === 0) {
      return ['Некорректная формула'];
    }

    const preview: string[] = [];
    
    // Генерируем несколько примеров
    for (let i = 0; i < 5 && i < parsedFormula.totalCombinations; i++) {
      const parts: string[] = [];
      
      for (const slot of parsedFormula.slots) {
        const slotType = MaskGrammarUtils.getSlotType(slot.name);
        const sampleValue = MaskGrammarUtils.getSampleValue(slotType);
        
        if (sampleValue && (slot.required || Math.random() > 0.3)) {
          parts.push(sampleValue);
        }
      }
      
      if (parts.length > 0) {
        preview.push(parts.join(' '));
      }
    }
    
    return preview;
  },

  /**
   * Получение примерного значения для типа слота
   */
  getSampleValue(slotType: string): string | null {
    const samples: Record<string, string> = {
      'BRAND': 'apple',
      'MODEL': 'iphone 15',
      'GEO': 'москва',
      'ACTION': 'купить',
      'PRICE': 'цена'
    };
    
    return samples[slotType] || null;
  }
};
