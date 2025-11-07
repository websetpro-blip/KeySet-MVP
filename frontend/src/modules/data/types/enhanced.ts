/**
 * Расширенные типы для KeySet v5.0
 * Дополнительные интерфейсы для обработки данных
 */

import type { Phrase, Group } from './index'

// Опции обработки данных
export interface DataProcessingOptions {
  useMorphology?: boolean
  crossMinusation?: boolean
  removeMorphDuplicates?: boolean
  smartNoise?: boolean
  normalizeText?: boolean
  applyPipelines?: string[]
  createSnapshot?: boolean
  snapshotName?: string
}

// Результат обработки
export interface ProcessingResult {
  success: boolean
  processed: number
  removed: number
  modified: number
  errors: string[]
  warnings: string[]
  processingTime: number
  phrases: Phrase[]
  groups: Group[]
}

// Результат анализа качества
export interface QualityAnalysisResult {
  totalPhrases: number
  uniquePhrases: number
  duplicates: number
  morphDuplicates: number
  noiseCount: number
  stopwordCount: number
  averageLength: number
  averageWords: number
  qualityScore: number // 0-100
  recommendations: string[]
}

// Результат кросс-минусации
export interface CrossMinusationResult {
  matches: number
  phrasesAffected: number
  minusTermsAdded: number
  estimatedSavings: string
}

// Статистика морфологии
export interface MorphologyStats {
  totalTokens: number
  uniqueStems: number
  averageTokensPerPhrase: number
  mostCommonStems: Array<{ stem: string; count: number }>
}
