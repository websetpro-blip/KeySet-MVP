/**
 * Нормализация русского текста
 */

import type { Phrase } from '../types/index'

/**
 * Нормализовать одну фразу
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // ё → е
    .replace(/ё/g, 'е')
    // Унифицировать кавычки
    .replace(/[«»""]/g, '"')
    .replace(/['']/g, "'")
    // Тире → дефис
    .replace(/—|–/g, '-')
    // Множественные пробелы → один
    .replace(/\s{2,}/g, ' ')
    // Пробелы вокруг пунктуации
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])+(?=[.,!?;:])/g, '')
    // Trim слева и справа
    .trim()
    // Нормализовать минус
    .replace(/[−−‐‑]/, '-')
}

/**
 * Нормализовать все фразы
 */
export function normalizeAllPhrases(phrases: Phrase[]): Phrase[] {
  return phrases.map(p => ({
    ...p,
    text: normalizeText(p.text)
  }))
}

/**
 * Капитализировать первую букву
 */
export function capitalize(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Стандартизировать кавычки
 */
export function standardizeQuotes(text: string, style: 'double' | 'single' = 'double'): string {
  const pattern = /[«»""'']/g
  const replacement = style === 'double' ? '"' : "'"
  return text.replace(pattern, replacement)
}

/**
 * Убрать дублирующиеся слова
 */
export function removeDuplicateWords(text: string): string {
  const words = text.split(/\s+/)
  const seen = new Set<string>()
  return words.filter(word => {
    if (seen.has(word.toLowerCase())) return false
    seen.add(word.toLowerCase())
    return true
  }).join(' ')
}

/**
 * Убрать все спецсимволы (оставить только буквы, цифры, пробелы)
 */
export function removeSpecialChars(text: string): string {
  return text.replace(/[^а-яёa-z0-9\s\-'"-]/gi, '').trim()
}

export default {
  normalizeText,
  normalizeAllPhrases,
  capitalize,
  standardizeQuotes,
  removeDuplicateWords,
  removeSpecialChars
}
