// Типы данных для модуля Объявления (Яндекс Директ)
// Основано на требованиях из ГОТОВЫЕ_МОДУЛИ/Объявления

// Лимиты Яндекс Директ (корректные значения)
export const LIMITS = {
  H1: 56,  // Заголовок 1
  H2: 56,  // Заголовок 2
  TEXT: 81, // Текст объявления
  DISPLAY_URL: 20, // Отображаемая ссылка (путь)
  CLARIFICATION: 66, // Уточнение
  QUICKLINK_TEXT: 30, // Текст быстрой ссылки
  QUICKLINK_DESC: 60, // Описание быстрой ссылки
} as const;

// Одна строка объявления (AdRow) - основная модель
export interface AdRow {
  key: string; // Ключевая фраза
  h1: string; // Заголовок 1 (≤56)
  h2: string; // Заголовок 2 (≤56)
  txt: string; // Текст объявления (≤81)
  url: string; // Финальный URL с UTM
  path: string; // Отображаемая ссылка (домен/путь без UTM)
  clar: string; // Уточнения (до 4, через \n)

  // Быстрые ссылки (SL1-SL4)
  sl1_text: string;
  sl1_url: string;
  sl1_anchor: string;
  sl1_desc: string;

  sl2_text: string;
  sl2_url: string;
  sl2_anchor: string;
  sl2_desc: string;

  sl3_text: string;
  sl3_url: string;
  sl3_anchor: string;
  sl3_desc: string;

  sl4_text: string;
  sl4_url: string;
  sl4_anchor: string;
  sl4_desc: string;
}

// Правило подмены (для блока "Правила подмены")
export interface SubstitutionRule {
  id: string;
  enabled: boolean;
  type: 'plain' | 'regex'; // Обычная замена или регулярное выражение
  find: string; // Что искать
  replace: string; // На что заменить
  scope: string[]; // Поля для применения: key, h1, h2, txt, url, path, clar, sl*_text, sl*_desc или "*"
}

// Набор правил подмены
export interface RuleSet {
  name: string; // "Глобальные замены" или "ГЕО/морфология"
  enabled: boolean;
  rules: SubstitutionRule[];
}

// Настройки генерации
export interface GenerationSettings {
  domain: string; // Домен/лендинг
  utm: string; // UTM-шаблон с {key} и {group}
  h1Template: string; // Шаблон H1 с {key}
  h2Suffix: string; // Суффикс H2 (если ключ полностью влез в H1)
  textVariants: string[]; // Варианты текста (по одному на строке)
}

// Состояние модуля
export interface AnnouncementsState {
  rows: AdRow[]; // Сгенерированные объявления
  settings: GenerationSettings;
  ruleSets: RuleSet[]; // 2 набора: глобальные и ГЕО
  isGenerating: boolean;
  isAIGenerating: boolean;
  selectedRowIndices: Set<number>;
}

// Опции для генерации
export interface GenerateOptions {
  keys: string[]; // Ключевые фразы
  settings: GenerationSettings;
  applyRules: boolean; // Применить правила подмены
}

// Опции для AI-генерации
export interface AIGenerateOptions {
  keys: string[];
  domain: string;
  utm: string;
  locale: string; // "ru"
  mode: 'serp' | 'basic'; // С анализом SERP или без
  limits: typeof LIMITS;
}

// Ответ от AI API
export interface AIGenerateResponse {
  rows: AdRow[];
}

// Опции экспорта CSV
export interface ExportOptions {
  campaignName: string;
  adGroupName?: string; // По умолчанию = ключ
  delimiter: ';' | ',';
  includeBOM: boolean;
}
