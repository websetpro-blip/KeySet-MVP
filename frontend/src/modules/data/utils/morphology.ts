// Морфологический анализ через natural
// ВНИМАНИЕ: natural библиотека может вызывать проблемы в браузере
// Временно отключаем natural импорт и используем простые эвристики
// import natural from 'natural'

// Базовая функция для русского языка
const toTokens = (phrase: string): string[] => {
  return phrase.toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[.,!?;:"]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.replace(/^[^а-яa-z0-9]+|[^а-яa-z0-9]+$/gi, ''))
    .filter(word => word.length > 0)
}

// Защищенная функция для стемминга
let stemCache = new Map<string, string>()

/**
 * Простой стемминг слова без natural
 */
export function stemWord(word: string): string {
  if (!word || typeof word !== 'string') return ''
  
  // Проверяем кеш
  if (stemCache.has(word)) {
    return stemCache.get(word)!
  }
  
  const cleanWord = word.toLowerCase().replace(/[^а-яa-z]/gi, '')
  if (!cleanWord) return ''
  
  // Простые эвристики для русского языка
  const result = cleanWord
    .replace(/(?:а|я|о|е|и|у|ы)$/, '') // глагольные окончания
    .replace(/(?:ый|ая|ое|ие|ой|ая|ею|ями|ами)$/, '') // прилагательные
    .replace(/(?:ы|и|ов|ам|ах|ами)$/, '') // множественное число
  
  const finalResult = result.length >= 3 ? result : cleanWord
  
  // Сохраняем в кеш
  stemCache.set(word, finalResult)
  
  return finalResult
}

/**
 * Лемматизация через эвристики (упрощенная)
 */
export function lemmatizeWord(word: string): string {
  if (!word || typeof word !== 'string') return ''
  
  const cleanWord = word.toLowerCase().replace(/[^а-яё]/gi, '')
  if (!cleanWord) return ''
  
  // Словари для разных частей речи
  const nounDict: Record<string, string> = {
    'машина': 'машина',
    'машины': 'машина',
    'машину': 'машина',
    'машин': 'машина',
    'машиной': 'машина',
    'машиною': 'машина',
    'машинах': 'машина'
  }
  
  const adjDict: Record<string, string> = {
    'хороший': 'хороший',
    'хорошая': 'хороший',
    'хорошее': 'хороший',
    'хорошие': 'хороший',
    'хорошего': 'хороший',
    'хорошей': 'хороший',
    'хорошему': 'хороший',
    'хороших': 'хороший',
    'хорошим': 'хороший',
    'хорошею': 'хороший'
  }
  
  const verbDict: Record<string, string> = {
    'быть': 'быть',
    'есть': 'быть',
    'был': 'быть',
    'была': 'быть',
    'было': 'быть',
    'были': 'быть',
    'буду': 'быть',
    'будешь': 'быть',
    'будет': 'быть',
    'будем': 'быть',
    'будете': 'быть'
  }
  
  // Проверяем словари
  if (nounDict[cleanWord]) return nounDict[cleanWord]
  if (adjDict[cleanWord]) return adjDict[cleanWord]
  if (verbDict[cleanWord]) return verbDict[cleanWord]
  
  // Если не нашли в словарях, используем стемминг
  return stemWord(cleanWord)
}

/**
 * Анализ морфологии фразы
 */
export function analyzePhrase(phrase: string): {
  original: string
  tokens: string[]
  stems: string[]
  lemmas: string[]
} {
  try {
    if (!phrase || typeof phrase !== 'string') {
      return {
        original: '',
        tokens: [],
        stems: [],
        lemmas: []
      }
    }
    
    // Токенизация с ограничением по длине
    const tokens = phrase
      .toLowerCase()
      .replace(/[^\w\sа-яё]/gi, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0 && token.length < 50) // Ограничиваем длину токенов
      .slice(0, 20) // Ограничиваем количество токенов
    
    const stems = tokens.map(stemWord).filter(stem => stem.length > 0)
    const lemmas = tokens.map(lemmatizeWord).filter(lemma => lemma.length > 0)
    
    return {
      original: phrase,
      tokens,
      stems,
      lemmas
    }
  } catch (error) {
    console.warn('Ошибка при анализе фразы:', phrase, error)
    return {
      original: phrase || '',
      tokens: [],
      stems: [],
      lemmas: []
    }
  }
}

/**
 * Сравнение фраз по морфологии
 */
export function comparePhrasesMorphology(phrase1: string, phrase2: string): {
  stemSimilarity: number
  lemmaSimilarity: number
  areSimilar: boolean
} {
  const analysis1 = analyzePhrase(phrase1)
  const analysis2 = analyzePhrase(phrase2)
  
  // Сравниваем стеммы
  const commonStems = analysis1.stems.filter(stem => 
    analysis2.stems.includes(stem)
  )
  const stemSimilarity = commonStems.length / Math.max(analysis1.stems.length, analysis2.stems.length)
  
  // Сравниваем леммы
  const commonLemmas = analysis1.lemmas.filter(lemma => 
    analysis2.lemmas.includes(lemma)
  )
  const lemmaSimilarity = commonLemmas.length / Math.max(analysis1.lemmas.length, analysis2.lemmas.length)
  
  // Считаем похожими, если 80% лемм совпадает
  const areSimilar = lemmaSimilarity >= 0.8
  
  return {
    stemSimilarity,
    lemmaSimilarity,
    areSimilar
  }
}

/**
 * Генерация морфологического ключа для поиска дублей
 */
export function generateMorphKey(phrase: string): string {
  try {
    if (!phrase || typeof phrase !== 'string') {
      return ''
    }
    
    const analysis = analyzePhrase(phrase)
    
    // Ограничиваем леммы для предотвращения больших ключей
    const limitedLemmas = [...analysis.lemmas]
      .filter(lemma => lemma && lemma.length > 0)
      .slice(0, 15) // Максимум 15 лемм
      .sort()
    
    const key = limitedLemmas.join('|')
    return key || 'empty'
  } catch (error) {
    console.warn('Ошибка при генерации морфологического ключа:', phrase, error)
    return 'error'
  }
}

/**
 * Подготовка текста для морфологического анализа
 */
export function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}