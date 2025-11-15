// Логика генерации объявлений для Яндекс Директ
// Основано на требованиях из ГОТОВЫЕ_МОДУЛИ/Объявления

import type {
  AdRow,
  LIMITS,
  GenerationSettings,
  SubstitutionRule,
  RuleSet,
  ExportOptions,
} from '../types';

// ===== УТИЛИТЫ =====

/**
 * Нормализация домена (убрать протокол и слэши)
 */
export function normDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim();
}

/**
 * Обрезать строку до максимальной длины
 */
export function clip(str: string, maxLength: number): string {
  const trimmed = (str || '').trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength - 1) + '…';
}

/**
 * Подстановка {key}, {Phrase}, {PHRASE} в шаблон
 */
export function substituteKey(template: string, key: string): string {
  let result = template;
  result = result.replace(/\{key\}/g, key);
  result = result.replace(/\{Phrase\}/g, capitalize(key));
  result = result.replace(/\{PHRASE\}/g, key.toUpperCase());
  return result;
}

/**
 * Капитализация первой буквы
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== ПОСТРОЕНИЕ URL =====

/**
 * Строит финальный URL с UTM-метками
 * {key} и {group} подставляются из ключа
 */
export function buildUrl(domain: string, utm: string, key: string): string {
  let url = `https://${normDomain(domain)}`;

  const utmParams = (utm || '').trim();
  if (utmParams) {
    const group = key.slice(0, 40); // Нормализуем имя группы
    const queryString = utmParams
      .replace(/\{key\}/g, encodeURIComponent(key))
      .replace(/\{group\}/g, encodeURIComponent(group));

    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  return url;
}

/**
 * Отображаемая ссылка (домен/путь БЕЗ UTM)
 * Показывается в предпросмотре и в CSV
 */
export function displayUrl(fullUrl: string, pathSuffix: string): string {
  const baseUrl = fullUrl.split('?')[0]; // Убираем UTM
  const domain = normDomain(baseUrl);
  const path = (pathSuffix || '').replace(/^\/+/, '');

  return path ? `${domain}/${path}` : domain;
}

// ===== РАЗБИЕНИЕ КЛЮЧА НА H1/H2 =====

/**
 * Разбивает ключ на H1 и H2 по словам
 * H1 ≤ 56 символов, остаток → H2
 * Если остатка нет, H2 = h2Suffix
 */
export function splitKeyToH1H2(
  key: string,
  h2Suffix: string
): { h1: string; h2: string } {
  const words = key.trim().split(/\s+/);
  let h1 = '';
  let i = 0;

  // Набираем H1 до 56 символов
  for (; i < words.length; i++) {
    const candidate = (h1 ? h1 + ' ' : '') + words[i];
    if (candidate.length <= 56) {
      h1 = candidate;
    } else {
      break;
    }
  }

  // Остаток идёт в H2
  const rest = words.slice(i).join(' ');
  const h2 = rest ? rest : h2Suffix;

  return {
    h1: h1 || clip(key, 56),
    h2: clip(h2, 56),
  };
}

// ===== ГЕНЕРАЦИЯ ОБЪЯВЛЕНИЙ =====

/**
 * Генерирует одно объявление из ключа и настроек
 */
export function generateAdRow(key: string, settings: GenerationSettings): AdRow {
  // H1/H2 - разбиваем ключ
  const h1Template = substituteKey(settings.h1Template, key);
  const { h1, h2 } = splitKeyToH1H2(h1Template, settings.h2Suffix);

  // Текст - берём из вариантов циклически
  const textIndex = Math.floor(Math.random() * settings.textVariants.length);
  const text = settings.textVariants[textIndex] || 'Быстрая доставка. Официально. Гарантия.';

  // URL с UTM
  const url = buildUrl(settings.domain, settings.utm, key);

  // Создаём пустую строку
  return {
    key,
    h1: clip(h1, 56),
    h2: clip(h2, 56),
    txt: clip(text, 81),
    url,
    path: '', // Редактируется пользователем в таблице
    clar: '', // Уточнения (до 4, через \n)
    sl1_text: '',
    sl1_url: '',
    sl1_anchor: '',
    sl1_desc: '',
    sl2_text: '',
    sl2_url: '',
    sl2_anchor: '',
    sl2_desc: '',
    sl3_text: '',
    sl3_url: '',
    sl3_anchor: '',
    sl3_desc: '',
    sl4_text: '',
    sl4_url: '',
    sl4_anchor: '',
    sl4_desc: '',
  };
}

/**
 * Генерирует массив объявлений из списка ключей
 */
export function generateAdsFromKeys(
  keys: string[],
  settings: GenerationSettings,
  onProgress?: (current: number, total: number) => void
): AdRow[] {
  const rows: AdRow[] = [];
  const total = keys.length;

  keys.forEach((key, index) => {
    const row = generateAdRow(key, settings);
    rows.push(row);

    if (onProgress) {
      onProgress(index + 1, total);
    }
  });

  return rows;
}

// ===== ПРАВИЛА ПОДМЕНЫ =====

/**
 * Применяет одно правило подмены к строке
 */
export function applySubstitutionRule(
  value: string,
  rule: SubstitutionRule
): string {
  if (!rule.enabled) return value;

  try {
    if (rule.type === 'plain') {
      // Обычная замена всех вхождений
      return value.replaceAll(rule.find, rule.replace);
    } else {
      // Регулярное выражение
      const regex = new RegExp(rule.find, 'g');
      return value.replace(regex, rule.replace);
    }
  } catch (error) {
    console.error('Ошибка применения правила подмены:', error);
    return value;
  }
}

/**
 * Применяет правила подмены к одному полю AdRow
 */
export function applyRulesToField(
  fieldName: keyof AdRow,
  value: string,
  rules: SubstitutionRule[]
): string {
  let result = value;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Проверяем, применяется ли правило к этому полю
    const appliesToField =
      rule.scope.includes('*') ||
      rule.scope.includes(fieldName) ||
      (fieldName.startsWith('sl') && rule.scope.includes('sl*_text')) ||
      (fieldName.startsWith('sl') && fieldName.endsWith('_desc') && rule.scope.includes('sl*_desc'));

    if (appliesToField) {
      result = applySubstitutionRule(result, rule);
    }
  }

  return result;
}

/**
 * Применяет все правила подмены к AdRow
 */
export function applyRuleSetsToRow(row: AdRow, ruleSets: RuleSet[]): AdRow {
  const newRow = { ...row };

  // Собираем все активные правила из всех наборов
  const allRules: SubstitutionRule[] = [];
  for (const ruleSet of ruleSets) {
    if (ruleSet.enabled) {
      allRules.push(...ruleSet.rules);
    }
  }

  // Применяем к каждому полю
  const textFields: Array<keyof AdRow> = [
    'key',
    'h1',
    'h2',
    'txt',
    'url',
    'path',
    'clar',
    'sl1_text',
    'sl1_url',
    'sl1_anchor',
    'sl1_desc',
    'sl2_text',
    'sl2_url',
    'sl2_anchor',
    'sl2_desc',
    'sl3_text',
    'sl3_url',
    'sl3_anchor',
    'sl3_desc',
    'sl4_text',
    'sl4_url',
    'sl4_anchor',
    'sl4_desc',
  ];

  for (const field of textFields) {
    newRow[field] = applyRulesToField(field, row[field], allRules);
  }

  return newRow;
}

// ===== БЫСТРЫЕ ССЫЛКИ =====

/**
 * Добавляет типовые быстрые ссылки к объявлению
 */
export function addDefaultQuickLinks(row: AdRow, domain: string): AdRow {
  const base = `https://${normDomain(domain)}`;

  // Не затираем существующие
  if (row.sl1_text || row.sl2_text || row.sl3_text || row.sl4_text) {
    return row;
  }

  return {
    ...row,
    sl1_text: 'Каталог',
    sl1_url: base,
    sl1_anchor: 'catalog',
    sl1_desc: 'Все модели',

    sl2_text: 'Цены',
    sl2_url: base + '/price',
    sl2_anchor: 'price',
    sl2_desc: 'Акции и скидки',

    sl3_text: 'Доставка',
    sl3_url: base + '/delivery',
    sl3_anchor: 'delivery',
    sl3_desc: 'За 1 день',

    sl4_text: 'Контакты',
    sl4_url: base + '/contacts',
    sl4_anchor: 'contacts',
    sl4_desc: 'Звонок бесплатно',
  };
}

/**
 * Обрезает все поля AdRow по лимитам
 */
export function trimRowToLimits(row: AdRow): AdRow {
  return {
    ...row,
    h1: clip(row.h1, 56),
    h2: clip(row.h2, 56),
    txt: clip(row.txt, 81),
    path: clip(row.path, 20),
    clar: row.clar, // Уточнения не обрезаем (каждая строка ≤66)
    sl1_text: clip(row.sl1_text, 30),
    sl1_desc: clip(row.sl1_desc, 60),
    sl2_text: clip(row.sl2_text, 30),
    sl2_desc: clip(row.sl2_desc, 60),
    sl3_text: clip(row.sl3_text, 30),
    sl3_desc: clip(row.sl3_desc, 60),
    sl4_text: clip(row.sl4_text, 30),
    sl4_desc: clip(row.sl4_desc, 60),
  };
}

// ===== ЭКСПОРТ CSV =====

/**
 * Экспортирует объявления в CSV для Direct Commander
 * С UTF-8 BOM и разделителем ";"
 */
export function exportToCSV(rows: AdRow[], options: ExportOptions): string {
  const { campaignName, delimiter = ';', includeBOM = true } = options;

  // Шапка CSV (точная копия формата Direct Commander)
  const headers = [
    'Кампания',
    'Группа',
    'Ключевая фраза',
    'Заголовок 1',
    'Заголовок 2',
    'Текст',
    'Ссылка',
    'Отображаемая ссылка',
    'Уточнения',
    'SL1',
    'SL1 URL',
    'SL1 Anchor',
    'SL1 Desc',
    'SL2',
    'SL2 URL',
    'SL2 Anchor',
    'SL2 Desc',
    'SL3',
    'SL3 URL',
    'SL3 Anchor',
    'SL3 Desc',
    'SL4',
    'SL4 URL',
    'SL4 Anchor',
    'SL4 Desc',
  ];

  // Экранирование ячейки для CSV
  const csvEscape = (value: string | unknown): string => {
    const str = (value ?? '').toString();
    // Если содержит delimiter, кавычки или перенос строки - экранируем
    if (new RegExp(`[${delimiter}"\n]`).test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Формируем строки
  const lines = [headers.join(delimiter)];

  for (const row of rows) {
    const adGroupName = options.adGroupName || row.key.slice(0, 80);
    const displayLink = displayUrl(row.url, row.path);
    const clarifications = (row.clar || '').replace(/\r?\n/g, ' | ');

    const values = [
      campaignName,
      adGroupName,
      row.key,
      row.h1,
      row.h2,
      row.txt,
      row.url,
      displayLink,
      clarifications,
      row.sl1_text,
      row.sl1_url,
      row.sl1_anchor,
      row.sl1_desc,
      row.sl2_text,
      row.sl2_url,
      row.sl2_anchor,
      row.sl2_desc,
      row.sl3_text,
      row.sl3_url,
      row.sl3_anchor,
      row.sl3_desc,
      row.sl4_text,
      row.sl4_url,
      row.sl4_anchor,
      row.sl4_desc,
    ].map(csvEscape);

    lines.push(values.join(delimiter));
  }

  let result = lines.join('\n');

  // Добавляем BOM для корректного отображения кириллицы в Excel
  if (includeBOM) {
    result = '\uFEFF' + result;
  }

  return result;
}

/**
 * Скачивает CSV файл
 */
export function downloadCSV(csv: string, filename: string = 'yandex_ads.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== КОПИРОВАНИЕ =====

/**
 * Копирует текст в буфер обмена
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback для старых браузеров
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Ошибка копирования:', error);
    return false;
  }
}

/**
 * Копирует таблицу как TSV (для быстрой вставки в Excel/Wordstat)
 */
export async function copyRowsAsTSV(rows: AdRow[]): Promise<boolean> {
  const headers = [
    'Ключ',
    'H1',
    'H2',
    'Текст',
    'URL',
    'Отобр. путь',
    'Уточнения',
    'SL1',
    'SL1 URL',
    'SL1 Anchor',
    'SL1 Desc',
    'SL2',
    'SL2 URL',
    'SL2 Anchor',
    'SL2 Desc',
    'SL3',
    'SL3 URL',
    'SL3 Anchor',
    'SL3 Desc',
    'SL4',
    'SL4 URL',
    'SL4 Anchor',
    'SL4 Desc',
  ];

  const lines = [headers.join('\t')];

  for (const row of rows) {
    const values = [
      row.key,
      row.h1,
      row.h2,
      row.txt,
      row.url,
      displayUrl(row.url, row.path),
      (row.clar || '').replace(/\r?\n/g, ' | '),
      row.sl1_text,
      row.sl1_url,
      row.sl1_anchor,
      row.sl1_desc,
      row.sl2_text,
      row.sl2_url,
      row.sl2_anchor,
      row.sl2_desc,
      row.sl3_text,
      row.sl3_url,
      row.sl3_anchor,
      row.sl3_desc,
      row.sl4_text,
      row.sl4_url,
      row.sl4_anchor,
      row.sl4_desc,
    ].map((v) => (v || '').toString().replace(/\t/g, ' ').replace(/\r?\n/g, ' '));

    lines.push(values.join('\t'));
  }

  return copyToClipboard(lines.join('\n'));
}

/**
 * Копирует только ключевые фразы (для вставки в Wordstat)
 */
export async function copyKeysOnly(rows: AdRow[]): Promise<boolean> {
  const keys = rows.map((r) => r.key).join('\n');
  return copyToClipboard(keys);
}
