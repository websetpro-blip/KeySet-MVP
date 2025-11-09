import type { Phrase, DuplicateGroup } from '../types';

// ========== ПОИСК ДУБЛЕЙ ==========

// Нормализация фразы для сравнения
const normalizePhrase = (text: string): string => {
  return text.toLowerCase().trim();
};

// Поиск точных дублей
export const findExactDuplicates = (phrases: Phrase[]): DuplicateGroup[] => {
  const groups = new Map<string, Phrase[]>();
  
  phrases.forEach(phrase => {
    const normalized = normalizePhrase(phrase.text);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(phrase);
  });
  
  const duplicates: DuplicateGroup[] = [];
  
  groups.forEach(groupPhrases => {
    if (groupPhrases.length > 1) {
      duplicates.push({
        original: groupPhrases[0],
        duplicates: groupPhrases.slice(1),
        type: 'exact',
      });
    }
  });
  
  return duplicates;
};

// Сортировка слов в фразе для поиска неявных дублей
const sortWords = (text: string): string => {
  return text.toLowerCase().trim().split(/\s+/).sort().join(' ');
};

// Поиск неявных дублей (перестановка слов)
export const findFuzzyDuplicates = (phrases: Phrase[]): DuplicateGroup[] => {
  const groups = new Map<string, Phrase[]>();
  
  phrases.forEach(phrase => {
    const sorted = sortWords(phrase.text);
    if (!groups.has(sorted)) {
      groups.set(sorted, []);
    }
    groups.get(sorted)!.push(phrase);
  });
  
  const duplicates: DuplicateGroup[] = [];
  
  groups.forEach(groupPhrases => {
    if (groupPhrases.length > 1) {
      // Исключаем точные дубли (они уже найдены)
      const normalized = normalizePhrase(groupPhrases[0].text);
      const allSame = groupPhrases.every(p => normalizePhrase(p.text) === normalized);
      
      if (!allSame) {
        duplicates.push({
          original: groupPhrases[0],
          duplicates: groupPhrases.slice(1),
          type: 'fuzzy',
        });
      }
    }
  });
  
  return duplicates;
};

// Поиск всех дублей
export const findAllDuplicates = (phrases: Phrase[]): {
  exact: DuplicateGroup[];
  fuzzy: DuplicateGroup[];
  totalDuplicates: number;
} => {
  const exact = findExactDuplicates(phrases);
  const fuzzy = findFuzzyDuplicates(phrases);
  
  const totalDuplicates = 
    exact.reduce((sum, g) => sum + g.duplicates.length, 0) +
    fuzzy.reduce((sum, g) => sum + g.duplicates.length, 0);
  
  return { exact, fuzzy, totalDuplicates };
};

// ========== СТОП-СЛОВА ==========

// Проверка фразы на наличие стоп-слов
export const containsStopwords = (phrase: string, stopwords: string[]): boolean => {
  const normalized = normalizePhrase(phrase);
  const words = normalized.split(/\s+/);
  
  return stopwords.some(stopword => {
    const normalizedStopword = normalizePhrase(stopword);
    return words.includes(normalizedStopword);
  });
};

// Получить список стоп-слов в фразе
export const getStopwordsInPhrase = (phrase: string, stopwords: string[]): string[] => {
  const normalized = normalizePhrase(phrase);
  const words = normalized.split(/\s+/);
  
  return stopwords.filter(stopword => {
    const normalizedStopword = normalizePhrase(stopword);
    return words.includes(normalizedStopword);
  });
};

// Фильтрация фраз по стоп-словам
export const filterPhrasesByStopwords = (
  phrases: Phrase[],
  stopwords: string[]
): {
  withStopwords: Phrase[];
  withoutStopwords: Phrase[];
} => {
  const withStopwords: Phrase[] = [];
  const withoutStopwords: Phrase[] = [];
  
  phrases.forEach(phrase => {
    if (containsStopwords(phrase.text, stopwords)) {
      withStopwords.push(phrase);
    } else {
      withoutStopwords.push(phrase);
    }
  });
  
  return { withStopwords, withoutStopwords };
};

// Парсинг стоп-слов из текста (построчно)
export const parseStopwords = (text: string): string[] => {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

// ========== СТАТИСТИКА ==========

// Подсчет статистики по фразам
export interface PhraseStats {
  total: number;
  withFrequency: number;
  withoutFrequency: number;
  avgWs: number;
  avgQws: number;
  avgBws: number;
  byStatus: {
    pending: number;
    done: number;
    error: number;
  };
}

export const calculateStats = (phrases: Phrase[]): PhraseStats => {
  const stats: PhraseStats = {
    total: phrases.length,
    withFrequency: 0,
    withoutFrequency: 0,
    avgWs: 0,
    avgQws: 0,
    avgBws: 0,
    byStatus: {
      pending: 0,
      done: 0,
      error: 0,
    },
  };
  
  if (phrases.length === 0) return stats;
  
  let totalWs = 0;
  let totalQws = 0;
  let totalBws = 0;
  
  phrases.forEach(phrase => {
    // Частоты
    if (phrase.ws > 0 || phrase.qws > 0 || phrase.bws > 0) {
      stats.withFrequency++;
    } else {
      stats.withoutFrequency++;
    }
    
    totalWs += phrase.ws;
    totalQws += phrase.qws;
    totalBws += phrase.bws;
    
    // Статусы
    stats.byStatus[phrase.status]++;
  });
  
  stats.avgWs = Math.round(totalWs / phrases.length);
  stats.avgQws = Math.round(totalQws / phrases.length);
  stats.avgBws = Math.round(totalBws / phrases.length);
  
  return stats;
};
