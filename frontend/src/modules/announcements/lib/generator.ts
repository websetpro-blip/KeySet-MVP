// Логика генерации объявлений из ключевых фраз и шаблонов

import type { AdTemplate, GeneratedAd, QuickLink } from '../types';

// Ограничения Яндекс Директ
const LIMITS = {
  TITLE1_MAX: 35,
  TITLE2_MAX: 30,
  TEXT_MAX: 81,
  QUICKLINK_TITLE_MAX: 30,
  QUICKLINK_DESC_MAX: 60,
  DISPLAY_URL_MAX: 20,
};

// Транслитерация ключа для отображаемой ссылки
export function transliteratePath(text: string, maxLength: number = 20): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, maxLength);
}

// Построение URL с UTM
export function buildUrl(domain: string, utm: string | undefined, key: string): string {
  if (!domain) return '';
  const base = domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
  let url = `https://${base}`;

  if (utm && utm.trim()) {
    const utmParams = utm
      .replace(/{key}/g, encodeURIComponent(key))
      .replace(/{group}/g, encodeURIComponent(key.substring(0, 40)));
    url += `?${utmParams}`;
  }

  return url;
}

// Отображаемая ссылка на основе URL и path
export function buildDisplayUrl(url: string, path?: string): string {
  if (!url) return '';
  const domain = url.split('?')[0].replace(/^https?:\/\//i, '');
  return path ? `${domain}/${path}` : domain;
}

/**
 * Капитализирует первую букву строки
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Обрезает строку до максимальной длины
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Подставляет ключевую фразу в шаблон
 * Поддерживает плейсхолдеры: {phrase}, {Phrase}, {PHRASE}
 */
function substitutePhrase(template: string, phrase: string): string {
  let result = template;

  // {phrase} - как есть
  result = result.replace(/\{phrase\}/g, phrase);

  // {Phrase} - с большой буквы
  result = result.replace(/\{Phrase\}/g, capitalize(phrase));

  // {PHRASE} - все заглавные
  result = result.replace(/\{PHRASE\}/g, phrase.toUpperCase());

  return result;
}

type TextValidationResult = {
  text: string;
  warning?: string;
};

/**
 * Валидирует и очищает текст объявления
 */
function validateText(text: string, maxLength: number): TextValidationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { text: '', warning: 'Пустой текст' };
  }

  if (trimmed.length > maxLength) {
    return {
      text: truncate(trimmed, maxLength),
      warning: `Текст обрезан с ${trimmed.length} до ${maxLength} символов`,
    };
  }

  return { text: trimmed };
}

export function buildTitle1FromPhrase(phrase: string): TextValidationResult {
  const trimmed = phrase.trim();
  if (!trimmed) {
    return { text: '' };
  }
  const words = trimmed.split(/\s+/);
  let candidate = '';

  for (const word of words) {
    const nextValue = candidate ? `${candidate} ${word}` : word;
    if (nextValue.length <= LIMITS.TITLE1_MAX) {
      candidate = nextValue;
    } else {
      break;
    }
  }

  if (!candidate) {
    candidate = trimmed;
  }

  return validateText(candidate, LIMITS.TITLE1_MAX);
}

export function buildTitle2FromAddons(
  addons: string[],
  index: number,
  title1: string
): TextValidationResult | null {
  if (!addons || addons.length === 0) {
    return null;
  }
  const addon = addons[index % addons.length]?.trim();
  if (!addon) {
    return null;
  }
  const combinedLimit = Math.max(0, 65 - title1.length);
  if (combinedLimit === 0) {
    return null;
  }
  const maxLength = Math.min(LIMITS.TITLE2_MAX, combinedLimit);
  if (maxLength <= 0) {
    return null;
  }
  return validateText(addon, maxLength);
}

export function sanitizeBodyText(bodyText?: string): TextValidationResult | undefined {
  if (!bodyText) {
    return undefined;
  }
  return validateText(bodyText, LIMITS.TEXT_MAX);
}

/**
 * Генерирует одно объявление из фразы и шаблона
 */
export function generateAd(
  phrase: { id: string; text: string },
  template: AdTemplate
): GeneratedAd {
  const warnings: string[] = [];

  // Генерация заголовка 1
  let title1 = template.title1;
  if (template.usePhraseInTitle) {
    title1 = substitutePhrase(title1, phrase.text);
  }
  const title1Result = validateText(title1, LIMITS.TITLE1_MAX);
  if (title1Result.warning) warnings.push(`Заголовок 1: ${title1Result.warning}`);

  // Генерация заголовка 2
  let title2: string | undefined;
  if (template.title2) {
    title2 = template.usePhraseInTitle
      ? substitutePhrase(template.title2, phrase.text)
      : template.title2;
    const title2Result = validateText(title2, LIMITS.TITLE2_MAX);
    if (title2Result.warning) warnings.push(`Заголовок 2: ${title2Result.warning}`);
    title2 = title2Result.text;
  }

  // Генерация текста объявления
  let text = template.text;
  if (template.usePhraseInText) {
    text = substitutePhrase(text, phrase.text);
  }
  const textResult = validateText(text, LIMITS.TEXT_MAX);
  if (textResult.warning) warnings.push(`Текст: ${textResult.warning}`);

  // Обработка быстрых ссылок
  const quickLinks: QuickLink[] | undefined = template.quickLinks?.map((ql) => {
    const linkTitle = substitutePhrase(ql.title, phrase.text);
    const linkDesc = ql.description ? substitutePhrase(ql.description, phrase.text) : undefined;

    return {
      title: truncate(linkTitle, LIMITS.QUICKLINK_TITLE_MAX),
      description: linkDesc ? truncate(linkDesc, LIMITS.QUICKLINK_DESC_MAX) : undefined,
      url: ql.url,
    };
  });

  // Отображаемая ссылка
  const displayUrl = template.displayUrl
    ? truncate(substitutePhrase(template.displayUrl, phrase.text), LIMITS.DISPLAY_URL_MAX)
    : undefined;

  return {
    id: `ad_${phrase.id}_${template.id}_${Date.now()}`,
    phraseId: phrase.id,
    phrase: phrase.text,
    templateId: template.id,
    title1: title1Result.text,
    title2,
    text: textResult.text,
    displayUrl,
    quickLinks,
    status: warnings.length > 0 ? 'draft' : 'ready',
    warnings: warnings.length > 0 ? warnings : undefined,
    createdAt: Date.now(),
  };
}

/**
 * Генерирует массив объявлений из массива фраз и одного шаблона
 */
export function generateAdsFromPhrases(
  phrases: Array<{ id: string; text: string }>,
  template: AdTemplate,
  onProgress?: (current: number, total: number) => void
): GeneratedAd[] {
  const ads: GeneratedAd[] = [];
  const total = phrases.length;

  phrases.forEach((phrase, index) => {
    const ad = generateAd(phrase, template);
    ads.push(ad);

    if (onProgress) {
      onProgress(index + 1, total);
    }
  });

  return ads;
}

/**
 * Экспортирует объявления в формат CSV для Яндекс Директ
 */
export function exportToYandexDirectCSV(
  ads: GeneratedAd[],
  campaignName: string = 'Кампания',
  adGroupName: string = 'Группа объявлений'
): string {
  const headers = [
    'Campaign',
    'AdGroup',
    'Keyword',
    'Title1',
    'Title2',
    'Text',
    'DisplayUrl',
    'QuickLink1Title',
    'QuickLink1Desc',
    'QuickLink2Title',
    'QuickLink2Desc',
    'QuickLink3Title',
    'QuickLink3Desc',
    'QuickLink4Title',
    'QuickLink4Desc',
  ];

  const rows = ads.map((ad) => {
    const row = [
      campaignName,
      adGroupName,
      ad.phrase,
      ad.title1,
      ad.title2 || '',
      ad.text,
      ad.displayUrl || '',
    ];

    // Добавляем быстрые ссылки (до 4 штук)
    for (let i = 0; i < 4; i++) {
      const quickLink = ad.quickLinks?.[i];
      row.push(quickLink?.title || '');
      row.push(quickLink?.description || '');
    }

    return row;
  });

  // Формируем CSV
  const csvRows = [headers, ...rows];
  return csvRows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
}

/**
 * Проверяет качество сгенерированных объявлений
 */
export function analyzeAdQuality(ad: GeneratedAd): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Проверка длины заголовка 1
  if (ad.title1.length < 20) {
    issues.push('Заголовок 1 слишком короткий');
    suggestions.push('Используйте всю доступную длину заголовка (до 35 символов)');
    score -= 10;
  }

  // Проверка наличия заголовка 2
  if (!ad.title2) {
    issues.push('Отсутствует заголовок 2');
    suggestions.push('Добавьте второй заголовок для увеличения CTR');
    score -= 15;
  }

  // Проверка длины текста
  if (ad.text.length < 50) {
    issues.push('Текст объявления слишком короткий');
    suggestions.push('Расширьте описание до 60-81 символов');
    score -= 10;
  }

  // Проверка наличия быстрых ссылок
  if (!ad.quickLinks || ad.quickLinks.length === 0) {
    suggestions.push('Добавьте быстрые ссылки для увеличения кликабельности');
    score -= 10;
  }

  // Проверка наличия ключевой фразы в тексте
  const phraseInText = ad.text.toLowerCase().includes(ad.phrase.toLowerCase());
  if (!phraseInText) {
    issues.push('Ключевая фраза не найдена в тексте объявления');
    suggestions.push('Включите ключевую фразу в текст для повышения релевантности');
    score -= 20;
  }

  // Проверка предупреждений
  if (ad.warnings && ad.warnings.length > 0) {
    score -= ad.warnings.length * 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}
