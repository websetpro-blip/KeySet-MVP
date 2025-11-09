// Система минусации с морфологией
import type { Phrase, Stopword } from '../types'
import { analyzePhrase, lemmatizeWord, stemWord } from './morphology'

// База стоп-слов по категориям
export const STOPWORDS_DATABASE = {
  // Общие стоп-слова
  general: [
    'и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'у', 'о', 'а', 'но', 'как', 'что', 'или',
    'если', 'то', 'так', 'еще', 'уже', 'только', 'даже', 'все', 'всё', 'никто', 'ничто', 'никак', 'некоторый',
    'который', 'какой', 'чей', 'что', 'где', 'когда', 'почему', 'зачем', 'сколько', 'куда', 'откуда'
  ],
  
  // Предлоги и союзы
  prepositions: [
    'в', 'на', 'с', 'по', 'для', 'от', 'до', 'из', 'к', 'у', 'о', 'без', 'под', 'над', 'при', 'через',
    'между', 'среди', 'вокруг', 'внутри', 'снаружи', 'впереди', 'позади', 'рядом', 'около'
  ],
  
  // Местоимения
  pronouns: [
    'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'этот', 'эта', 'это', 'эти', 'тот', 'та', 'то', 'те',
    'мой', 'моя', 'моё', 'мои', 'твой', 'твоя', 'твоё', 'твои', 'наш', 'наша', 'наше', 'наши'
  ],
  
  // Вспомогательные глаголы
  auxiliary: [
    'быть', 'есть', 'был', 'была', 'было', 'были', 'буду', 'будешь', 'будет', 'будем', 'будете',
    'иметь', 'имею', 'имеешь', 'имеет', 'имеем', 'имеете', 'имеют', 'имел', 'имела', 'имело', 'имели'
  ],
  
  // Наречия
  adverbs: [
    'очень', 'более', 'менее', 'слишком', 'довольно', 'весьма', 'крайне', 'чрезвычайно', 'необычайно',
    'здесь', 'там', 'тут', 'где', 'куда', 'откуда', 'когда', 'как', 'почему', 'зачем', 'сколько'
  ],
  
  // Частицы
  particles: [
    'не', 'ни', 'же', 'ли', 'бы', 'ведь', 'вот', 'это', 'даже', 'только', 'уже', 'еще', 'опять', 'снова'
  ],
  
  // Междометия и звукоподражания
  interjections: [
    'о', 'ах', 'ох', 'ух', 'ах', 'эх', 'господи', 'боже', 'боже мой', 'господи боже'
  ],
  
  // Артикли и модальные слова
  articles: [
    'один', 'одна', 'одно', 'одни', 'первый', 'первая', 'первое', 'первые', 'второй', 'вторая', 'второе', 'вторые',
    'самый', 'самая', 'самое', 'самые', 'весь', 'вся', 'всё', 'все', 'другой', 'другая', 'другое', 'другие',
    'любой', 'любая', 'любое', 'любые', 'каждый', 'каждая', 'каждое', 'каждые', 'все', 'всего', 'всем', 'всех'
  ]
}

// Расширенная база стоп-слов с морфологическими вариантами
export function generateStopwordVariants(baseWord: string): string[] {
  const variants = [baseWord]
  
  // Добавляем морфологические варианты
  const analysis = analyzePhrase(baseWord)
  if (analysis.stems.length > 0) {
    const stem = analysis.stems[0]
    // Добавляем типичные окончания
    const endings = ['', 'а', 'о', 'е', 'и', 'у', 'ы', 'ов', 'ей', 'ам', 'ем', 'ах', 'ами', 'ах']
    for (const ending of endings) {
      variants.push(stem + ending)
    }
  }
  
  return [...new Set(variants)] // убираем дубликаты
}

/**
 * Проверка, является ли слово стоп-словом
 */
export function isStopword(word: string, useMorphology = true): {
  isStopword: boolean
  category?: string
  matchedForm?: string
  stem?: string
} {
  if (!word || typeof word !== 'string') {
    return { isStopword: false }
  }
  
  const cleanWord = word.toLowerCase().trim()
  const analysis = useMorphology ? analyzePhrase(cleanWord) : { stems: [cleanWord] }
  
  // Проверяем точное совпадение
  for (const [category, words] of Object.entries(STOPWORDS_DATABASE)) {
    for (const stopword of words) {
      if (cleanWord === stopword.toLowerCase()) {
        return {
          isStopword: true,
          category,
          matchedForm: stopword
        }
      }
    }
  }
  
  // Если используем морфологию, проверяем стеммы
  if (useMorphology) {
    for (const [category, words] of Object.entries(STOPWORDS_DATABASE)) {
      for (const stopword of words) {
        const stopAnalysis = analyzePhrase(stopword)
        if (stopAnalysis.stems.length > 0 && analysis.stems.length > 0) {
          const stopStem = stopAnalysis.stems[0]
          const wordStem = analysis.stems[0]
          
          if (stopStem === wordStem || wordStem.startsWith(stopStem) || stopStem.startsWith(wordStem)) {
            return {
              isStopword: true,
              category,
              matchedForm: stopword,
              stem: wordStem
            }
          }
        }
      }
    }
  }
  
  return { isStopword: false }
}

/**
 * Проверка всей фразы на наличие стоп-слов
 */
export function phraseContainsStopwords(phrase: string, useMorphology = true): {
  containsStopwords: boolean
  stopwords: Array<{
    word: string
    position: number
    category: string
    matchedForm: string
  }>
} {
  if (!phrase || typeof phrase !== 'string') {
    return { containsStopwords: false, stopwords: [] }
  }
  
  const tokens = phrase
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0)
  
  const foundStopwords = []
  
  for (let i = 0; i < tokens.length; i++) {
    const result = isStopword(tokens[i], useMorphology)
    if (result.isStopword) {
      foundStopwords.push({
        word: tokens[i],
        position: i,
        category: result.category || 'unknown',
        matchedForm: result.matchedForm || tokens[i]
      })
    }
  }
  
  return {
    containsStopwords: foundStopwords.length > 0,
    stopwords: foundStopwords
  }
}

/**
 * Фильтрация фраз с минус-словами
 */
export function filterPhrasesByStopwords(phrases: Phrase[], useMorphology = true): {
  validPhrases: Phrase[]
  filteredPhrases: Array<{
    phrase: Phrase
    reason: string
    stopwords: string[]
  }>
} {
  const validPhrases: Phrase[] = []
  const filteredPhrases: Array<{
    phrase: Phrase
    reason: string
    stopwords: string[]
  }> = []
  
  for (const phrase of phrases) {
    const check = phraseContainsStopwords(phrase.text, useMorphology)
    
    if (check.containsStopwords) {
      filteredPhrases.push({
        phrase,
        reason: 'contains_stopwords',
        stopwords: check.stopwords.map(sw => sw.matchedForm)
      })
    } else {
      validPhrases.push(phrase)
    }
  }
  
  return { validPhrases, filteredPhrases }
}

/**
 * Подсчет статистики по стоп-словам
 */
export function analyzeStopwords(phrases: Phrase[], useMorphology = true): {
  totalPhrases: number
  phrasesWithStopwords: number
  percentage: number
  topStopwords: Array<{
    word: string
    count: number
    category: string
  }>
  categories: Record<string, number>
} {
  const stopwordStats: Record<string, { count: number; category: string }> = {}
  let phrasesWithStopwords = 0
  
  for (const phrase of phrases) {
    const check = phraseContainsStopwords(phrase.text, useMorphology)
    if (check.containsStopwords) {
      phrasesWithStopwords++
      
      for (const stopword of check.stopwords) {
        if (!stopwordStats[stopword.matchedForm]) {
          stopwordStats[stopword.matchedForm] = {
            count: 0,
            category: stopword.category
          }
        }
        stopwordStats[stopword.matchedForm].count++
      }
    }
  }
  
  const topStopwords = Object.entries(stopwordStats)
    .map(([word, stats]) => ({
      word,
      count: stats.count,
      category: stats.category
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
  
  const categories: Record<string, number> = {}
  for (const [, stats] of Object.entries(stopwordStats)) {
    categories[stats.category] = (categories[stats.category] || 0) + stats.count
  }
  
  return {
    totalPhrases: phrases.length,
    phrasesWithStopwords,
    percentage: phrases.length > 0 ? (phrasesWithStopwords / phrases.length) * 100 : 0,
    topStopwords,
    categories
  }
}

/**
 * Удалить фразы содержащие стоп-слова (для pipelines)
 */
export function removePhrasesWithStopwords(
  phrases: Phrase[],
  stopwords: Stopword[]
): Phrase[] {
  return phrases.filter(phrase => {
    const hasStopword = stopwords.some(sw => {
      const lowerText = phrase.text.toLowerCase();
      const lowerSw = sw.text.toLowerCase();
      
      switch (sw.matchType) {
        case 'exact':
          return lowerText.split(/\s+/).includes(lowerSw);
        case 'partial':
          return lowerText.includes(lowerSw);
        case 'independent':
          return lowerText.split(/\s+/).some(word => word === lowerSw);
        default:
          return false;
      }
    });
    
    return !hasStopword;
  });
}
