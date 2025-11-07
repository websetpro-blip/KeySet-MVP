/**
 * Умный фильтр мусора
 * Удаляет бесполезные фразы по умным правилам
 */

import type { Phrase } from '../types/index'

/**
 * Определить, является ли фраза мусором
 */
export function isNoise(phrase: string): {
  isNoise: boolean
  reason?: string
} {
  const text = phrase.trim()

  // 1. Пустая или слишком короткая
  if (text.length < 2) {
    return { isNoise: true, reason: 'too_short' }
  }

  // 2. Слишком много цифр (>40%)
  const digitCount = (text.match(/\d/g) || []).length
  const digitPercent = digitCount / text.length
  if (digitPercent > 0.4) {
    return { isNoise: true, reason: 'too_many_digits' }
  }

  // 3. URL или UTM параметры
  if (/https?:\/\/|utm_|www\.|\.com|\.ru/.test(text)) {
    return { isNoise: true, reason: 'looks_like_url' }
  }

  // 4. Телефонные номера
  if (/\+?\d{10,}|8\(\d{3}\)|\(\d{3}\)\d{3}/.test(text)) {
    return { isNoise: true, reason: 'looks_like_phone' }
  }

  // 5. Артикулы (много цифр вперемешку с буквами)
  if (/[a-z]{1,3}\d{3,}|sku\d+|model\d+/i.test(text)) {
    return { isNoise: true, reason: 'looks_like_sku' }
  }

  // 6. Слишком много спецсимволов (>20%)
  const specialCount = (text.match(/[^а-яёa-z0-9\s]/gi) || []).length
  const specialPercent = specialCount / text.length
  if (specialPercent > 0.2) {
    return { isNoise: true, reason: 'too_many_special_chars' }
  }

  // 7. Только цифры и спецсимволы (нет букв)
  if (!/[а-яёa-z]/i.test(text)) {
    return { isNoise: true, reason: 'no_letters' }
  }

  // 8. Повторение одного символа
  if (/(.)\1{3,}/.test(text)) {
    return { isNoise: true, reason: 'repeating_chars' }
  }

  return { isNoise: false }
}

/**
 * Отфильтровать фразы мусора
 */
export function removeNoise(phrases: Phrase[]): {
  cleaned: Phrase[]
  removed: Array<{ phrase: Phrase; reason: string }>
} {
  const cleaned: Phrase[] = []
  const removed: Array<{ phrase: Phrase; reason: string }> = []

  for (const phrase of phrases) {
    const result = isNoise(phrase.text)
    if (result.isNoise) {
      removed.push({ phrase, reason: result.reason || 'unknown' })
    } else {
      cleaned.push(phrase)
    }
  }

  return { cleaned, removed }
}

/**
 * Статистика мусора
 */
export function getNoiseStats(phrases: Phrase[]) {
  const reasons = new Map<string, number>()
  let totalNoise = 0

  for (const phrase of phrases) {
    const result = isNoise(phrase.text)
    if (result.isNoise) {
      totalNoise++
      const reason = result.reason || 'unknown'
      reasons.set(reason, (reasons.get(reason) || 0) + 1)
    }
  }

  return {
    totalNoise,
    percentage: ((totalNoise / phrases.length) * 100).toFixed(2) + '%',
    byReason: Object.fromEntries(reasons)
  }
}

export default { isNoise, removeNoise, getNoiseStats }
