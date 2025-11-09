/**
 * Поиск дублей с учётом морфологии
 */

import { generateMorphKey } from './morphology'
import type { Phrase } from '../types/index'

/**
 * Найти морфологические дубли
 * Возвращает группы дублей (где > 1 фраза)
 */
export function findMorphologicalDuplicates(
  phrases: Phrase[]
): Array<Phrase[]> {
  
  const buckets = new Map<string, Phrase[]>()

  phrases.forEach(phrase => {
    const normalizedKey = generateMorphKey(phrase.text)

    if (!buckets.has(normalizedKey)) {
      buckets.set(normalizedKey, [])
    }
    buckets.get(normalizedKey)!.push(phrase)
  })

  // Возвращаем только группы дублей
  return [...buckets.values()]
    .filter(group => group.length > 1)
    .map(group => 
      // Сортируем по ws (оставляем сильнейшую сверху)
      group.sort((a, b) => (b.ws || 0) - (a.ws || 0))
    )
}

/**
 * Найти точные дубли (текст совпадает 100%)
 */
export function findExactDuplicates(phrases: Phrase[]): Array<Phrase[]> {
  const buckets = new Map<string, Phrase[]>()

  phrases.forEach(phrase => {
    const key = phrase.text.toLowerCase()
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(phrase)
  })

  return [...buckets.values()].filter(g => g.length > 1)
}

/**
 * Удалить точные дубли (оставить только сильнейшую по ws)
 */
export function removeExactDuplicates(phrases: Phrase[]): Phrase[] {
  const seen = new Map<string, Phrase>()

  for (const phrase of phrases.sort((a, b) => (b.ws || 0) - (a.ws || 0))) {
    const key = phrase.text.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, phrase)
    }
  }

  return [...seen.values()]
}

/**
 * Удалить морфологические дубли
 */
export function removeMorphologicalDuplicates(phrases: Phrase[]): Phrase[] {
  const seen = new Map<string, Phrase>()

  for (const phrase of phrases.sort((a, b) => (b.ws || 0) - (a.ws || 0))) {
    const key = generateMorphKey(phrase.text)
    if (!seen.has(key)) {
      seen.set(key, phrase)
    }
  }

  return [...seen.values()]
}

/**
 * Статистика дублей
 */
export function getDuplicateStats(phrases: Phrase[]) {
  const exact = findExactDuplicates(phrases).reduce((sum, g) => sum + g.length - 1, 0)
  const morpho = findMorphologicalDuplicates(phrases).reduce((sum, g) => sum + g.length - 1, 0)

  return {
    exactDuplicates: exact,
    morphologicalDuplicates: morpho - exact,
    totalDuplicates: morpho,
    potentialWsSavings: phrases
      .filter((_, i, arr) => arr.slice(i + 1).some(p => generateMorphKey(p.text) === generateMorphKey(phrases[i].text)))
      .reduce((sum, p) => sum + (p.ws || 0), 0)
  }
}

export default {
  findMorphologicalDuplicates,
  findExactDuplicates,
  removeExactDuplicates,
  removeMorphologicalDuplicates,
  getDuplicateStats
}
