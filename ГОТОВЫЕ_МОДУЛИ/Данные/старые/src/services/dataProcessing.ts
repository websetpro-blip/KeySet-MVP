/**
 * Data Processing Service - интеграция всех v5.0 функций
 */

import type { Phrase, Group } from '../types/index'
import { findMorphologicalDuplicates, findExactDuplicates, removeExactDuplicates, removeMorphologicalDuplicates } from '../utils/duplicates'
import { computeCrossMinusation, applyCrossMinusation, type CrossMinusationMatch } from '../utils/crossMinusate'
import { removeNoise } from '../utils/smartNoise'
import { normalizeAllPhrases } from '../utils/normalize'
import { analyzePhrase, generateMorphKey } from '../utils/morphology'
import { isStopword, removePhrasesWithStopwords } from '../utils/stopwords'
import type { DataProcessingOptions, ProcessingResult, QualityAnalysisResult, CrossMinusationResult, MorphologyStats } from '../types/enhanced'

/**
 * Основной сервис обработки данных v5.0
 */
export class DataProcessor {
  private phrases: Phrase[]
  private groups: Group[]
  private options: DataProcessingOptions

  constructor(phrases: Phrase[], groups: Group[], options: DataProcessingOptions = {}) {
    this.phrases = phrases
    this.groups = groups
    this.options = {
      useMorphology: true,
      crossMinusation: false,
      removeMorphDuplicates: false,
      smartNoise: false,
      normalizeText: false,
      applyPipelines: [],
      createSnapshot: false,
      snapshotName: '',
      ...options
    }
  }

  /**
   * Выполнить полную обработку
   */
  async process(): Promise<ProcessingResult> {
    const startTime = Date.now()
    let currentPhrases = [...this.phrases]
    let processed = 0
    let removed = 0
    let modified = 0
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 1. Нормализация текста
      if (this.options.normalizeText) {
        const beforeCount = currentPhrases.length
        currentPhrases = normalizeAllPhrases(currentPhrases)
        processed += beforeCount
        modified += beforeCount
        warnings.push(`Нормализировано: ${beforeCount} фраз`)
      }

      // 2. Smart-Noise фильтр
      if (this.options.smartNoise) {
        const noiseResult = removeNoise(currentPhrases)
        const beforeCount = currentPhrases.length
        currentPhrases = noiseResult.cleaned
        removed += beforeCount - currentPhrases.length
        processed += beforeCount
        warnings.push(`Удалено мусора: ${beforeCount - currentPhrases.length} фраз`)
      }

      // 3. Удаление дублей
      if (this.options.removeMorphDuplicates) {
        const beforeCount = currentPhrases.length
        currentPhrases = this.options.useMorphology 
          ? removeMorphologicalDuplicates(currentPhrases)
          : removeExactDuplicates(currentPhrases)
        removed += beforeCount - currentPhrases.length
        processed += beforeCount
        warnings.push(`Удалено дублей: ${beforeCount - currentPhrases.length}`)
      }

      // 4. Кросс-минусация
      if (this.options.crossMinusation) {
        const beforeCount = currentPhrases.length
        currentPhrases = applyCrossMinusation(currentPhrases, this.options.useMorphology || false)
        modified += beforeCount
        processed += beforeCount
        warnings.push(`Применена кросс-минусация`)
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        processed,
        removed,
        modified,
        errors,
        warnings,
        processingTime,
        phrases: currentPhrases,
        groups: this.groups
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Неизвестная ошибка')
      return {
        success: false,
        processed,
        removed,
        modified,
        errors,
        warnings,
        processingTime: Date.now() - startTime,
        phrases: currentPhrases,
        groups: this.groups
      }
    }
  }

  /**
   * Анализ качества данных
   */
  async analyzeQuality(): Promise<QualityAnalysisResult> {
    const totalPhrases = this.phrases.length
    
    // Точные дубли
    const exactDupes = findExactDuplicates(this.phrases)
    const duplicates = exactDupes.reduce((sum, group) => sum + group.length - 1, 0)
    
    // Морфологические дубли
    const morphDupes = findMorphologicalDuplicates(this.phrases)
    const morphDuplicates = morphDupes.reduce((sum, group) => sum + group.length - 1, 0)
    
    // Мусор
    const noiseResult = removeNoise(this.phrases)
    const noiseCount = noiseResult.removed.length
    
    // Стоп-слова (упрощенная проверка)
    const stopwordCount = this.phrases.filter(p => {
      const words = p.text.toLowerCase().split(/\s+/)
      return words.some(w => isStopword(w))
    }).length
    
    // Средние показатели
    const lengths = this.phrases.map(p => p.text.length)
    const averageLength = lengths.reduce((a, b) => a + b, 0) / totalPhrases
    
    const wordCounts = this.phrases.map(p => p.text.split(/\s+/).length)
    const averageWords = wordCounts.reduce((a, b) => a + b, 0) / totalPhrases
    
    // Уникальные фразы
    const uniqueTexts = new Set(this.phrases.map(p => p.text.toLowerCase()))
    const uniquePhrases = uniqueTexts.size
    
    // Расчет качества (0-100)
    const uniquenessScore = (uniquePhrases / totalPhrases) * 30
    const cleanScore = ((totalPhrases - noiseCount) / totalPhrases) * 30
    const morphScore = ((totalPhrases - morphDuplicates) / totalPhrases) * 20
    const stopwordScore = ((totalPhrases - stopwordCount) / totalPhrases) * 20
    const qualityScore = Math.round(uniquenessScore + cleanScore + morphScore + stopwordScore)
    
    // Рекомендации
    const recommendations: string[] = []
    if (duplicates > 0) recommendations.push(`Найдено ${duplicates} точных дублей. Рекомендуется удалить.`)
    if (morphDuplicates > duplicates) recommendations.push(`Найдено ${morphDuplicates - duplicates} морфологических дублей дополнительно.`)
    if (noiseCount > 0) recommendations.push(`Найдено ${noiseCount} мусорных фраз (URL, номера, SKU).`)
    if (stopwordCount > totalPhrases * 0.3) recommendations.push(`Более 30% фраз содержат стоп-слова.`)
    if (averageWords < 2) recommendations.push(`Средняя длина фразы менее 2 слов. Возможно, много низкокачественных запросов.`)
    if (qualityScore >= 80) recommendations.push(`Качество данных отличное!`)
    else if (qualityScore >= 60) recommendations.push(`Качество данных хорошее. Рекомендуется небольшая очистка.`)
    else if (qualityScore >= 40) recommendations.push(`Качество данных среднее. Рекомендуется очистка.`)
    else recommendations.push(`Качество данных низкое. Требуется глубокая очистка.`)
    
    return {
      totalPhrases,
      uniquePhrases,
      duplicates,
      morphDuplicates,
      noiseCount,
      stopwordCount,
      averageLength: Math.round(averageLength * 10) / 10,
      averageWords: Math.round(averageWords * 10) / 10,
      qualityScore,
      recommendations
    }
  }

  /**
   * Выполнить кросс-минусацию и получить результат
   */
  computeCrossMinusation(minOverlapPercentage = 50): CrossMinusationResult {
    const result = computeCrossMinusation(this.phrases, this.options.useMorphology || false, minOverlapPercentage)
    
    const phrasesAffected = new Set(result.matches.map(m => m.sourcePhrase.id)).size
    const minusTermsAdded = result.matches.reduce((sum, m) => sum + m.additionalTokens.length, 0)
    
    // Примерная экономия на основе частоты и стоимости клика
    const avgWs = this.phrases.reduce((sum, p) => sum + (p.ws || 0), 0) / this.phrases.length
    const estimatedSavings = `${Math.round(minusTermsAdded * avgWs * 0.1)} RUB/месяц`
    
    return {
      matches: result.matches.length,
      phrasesAffected,
      minusTermsAdded,
      estimatedSavings
    }
  }

  /**
   * Морфологическая статистика
   */
  getMorphologyStats(): MorphologyStats {
    const stemMap = new Map<string, number>()
    let totalTokens = 0
    
    this.phrases.forEach(phrase => {
      const analysis = analyzePhrase(phrase.text)
      totalTokens += analysis.stems.length
      analysis.stems.forEach(stem => {
        stemMap.set(stem, (stemMap.get(stem) || 0) + 1)
      })
    })
    
    const mostCommonStems = Array.from(stemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([stem, count]) => ({ stem, count }))
    
    return {
      totalTokens,
      uniqueStems: stemMap.size,
      averageTokensPerPhrase: Math.round((totalTokens / this.phrases.length) * 10) / 10,
      mostCommonStems
    }
  }
}

/**
 * Быстрая очистка - удаление дублей и мусора
 */
export async function quickCleanup(phrases: Phrase[], useMorphology = true): Promise<ProcessingResult> {
  const processor = new DataProcessor(phrases, [], {
    useMorphology,
    removeMorphDuplicates: true,
    smartNoise: true,
    normalizeText: true
  })
  return processor.process()
}

/**
 * Глубокая очистка - полная обработка
 */
export async function deepCleanup(phrases: Phrase[], useMorphology = true): Promise<ProcessingResult> {
  const processor = new DataProcessor(phrases, [], {
    useMorphology,
    removeMorphDuplicates: true,
    smartNoise: true,
    normalizeText: true,
    crossMinusation: true
  })
  return processor.process()
}

/**
 * Только анализ качества без изменений
 */
export async function analyzeDataQuality(phrases: Phrase[]): Promise<QualityAnalysisResult> {
  const processor = new DataProcessor(phrases, [])
  return processor.analyzeQuality()
}
