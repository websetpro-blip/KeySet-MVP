// Кросс-минусация - автоматическое добавление минус-слов
import type { Phrase } from '../types'
import { analyzePhrase } from './morphology'

export interface CrossMinusationMatch {
  sourcePhrase: Phrase
  targetPhrase: Phrase
  sourceTokens: string[]
  targetTokens: string[]
  additionalTokens: string[]
  overlapPercentage: number
  reason: 'subset' | 'significant_overlap'
}

/**
 * Основная функция кросс-минусации
 */
export function computeCrossMinusation(
  phrases: Phrase[], 
  useMorphology = true,
  minOverlapPercentage = 50
): {
  matches: CrossMinusationMatch[]
  statistics: {
    totalComparisons: number
    foundMatches: number
    averageOverlap: number
    processingTime: number
  }
} {
  const startTime = Date.now()
  const matches: CrossMinusationMatch[] = []
  
  // Создаем индекс для оптимизации
  const phraseIndex = phrases.map(phrase => ({
    id: phrase.id,
    text: phrase.text,
    tokens: useMorphology 
      ? analyzePhrase(phrase.text).stems
      : phrase.text.toLowerCase().replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(t => t.length > 0)
  }))
  
  let comparisons = 0
  let totalOverlap = 0
  
  // O(n²) сравнение с Set-оптимизацией
  for (let i = 0; i < phraseIndex.length; i++) {
    for (let j = i + 1; j < phraseIndex.length; j++) {
      comparisons++
      
      const phraseA = phraseIndex[i]
      const phraseB = phraseIndex[j]
      
      // Преобразуем в Set для быстрой проверки включения
      const setA = new Set(phraseA.tokens)
      const setB = new Set(phraseB.tokens)
      
      // Проверяем, является ли A подмножеством B
      const isASubsetOfB = [...setA].every(token => setB.has(token))
      const isBSubsetOfA = [...setB].every(token => setA.has(token))
      
      // Вычисляем пересечение
      const intersection = [...setA].filter(token => setB.has(token))
      const union = new Set([...setA, ...setB])
      const overlapPercentage = (intersection.length / union.size) * 100
      
      if (isASubsetOfB && setB.size > setA.size) {
        // A является подмножеством B - добавляем лишние токены из B в минусы A
        const additionalTokens = [...setB].filter(token => !setA.has(token))
        
        matches.push({
          sourcePhrase: phrases[i],
          targetPhrase: phrases[j],
          sourceTokens: phraseA.tokens,
          targetTokens: phraseB.tokens,
          additionalTokens,
          overlapPercentage,
          reason: 'subset'
        })
        
        totalOverlap += overlapPercentage
      } else if (isBSubsetOfA && setA.size > setB.size) {
        // B является подмножеством A - добавляем лишние токены из A в минусы B
        const additionalTokens = [...setA].filter(token => !setB.has(token))
        
        matches.push({
          sourcePhrase: phrases[j],
          targetPhrase: phrases[i],
          sourceTokens: phraseB.tokens,
          targetTokens: phraseA.tokens,
          additionalTokens,
          overlapPercentage,
          reason: 'subset'
        })
        
        totalOverlap += overlapPercentage
      } else if (overlapPercentage >= minOverlapPercentage) {
        // Значительное пересечение (но не подмножество)
        const additionalTokensA = [...setB].filter(token => !setA.has(token))
        const additionalTokensB = [...setA].filter(token => !setB.has(token))
        
        if (additionalTokensA.length > 0) {
          matches.push({
            sourcePhrase: phrases[i],
            targetPhrase: phrases[j],
            sourceTokens: phraseA.tokens,
            targetTokens: phraseB.tokens,
            additionalTokens: additionalTokensA,
            overlapPercentage,
            reason: 'significant_overlap'
          })
          
          totalOverlap += overlapPercentage
        }
        
        if (additionalTokensB.length > 0) {
          matches.push({
            sourcePhrase: phrases[j],
            targetPhrase: phrases[i],
            sourceTokens: phraseB.tokens,
            targetTokens: phraseA.tokens,
            additionalTokens: additionalTokensB,
            overlapPercentage,
            reason: 'significant_overlap'
          })
          
          totalOverlap += overlapPercentage
        }
      }
    }
  }
  
  const processingTime = Date.now() - startTime
  const averageOverlap = matches.length > 0 ? totalOverlap / matches.length : 0
  
  return {
    matches,
    statistics: {
      totalComparisons: comparisons,
      foundMatches: matches.length,
      averageOverlap,
      processingTime
    }
  }
}

/**
 * Группировка результатов кросс-минусации по источникам
 */
export function groupCrossMinusationBySource(matches: CrossMinusationMatch[]): Record<string, {
  sourcePhrase: Phrase
  targets: Array<{
    targetPhrase: Phrase
    additionalTokens: string[]
    reason: string
    overlapPercentage: number
  }>
  totalAdditionalTokens: string[]
}> {
  const grouped: Record<string, any> = {}
  
  for (const match of matches) {
    const sourceId = match.sourcePhrase.id
    
    if (!grouped[sourceId]) {
      grouped[sourceId] = {
        sourcePhrase: match.sourcePhrase,
        targets: [],
        totalAdditionalTokens: []
      }
    }
    
    grouped[sourceId].targets.push({
      targetPhrase: match.targetPhrase,
      additionalTokens: match.additionalTokens,
      reason: match.reason,
      overlapPercentage: match.overlapPercentage
    })
    
    // Собираем все уникальные дополнительные токены
    for (const token of match.additionalTokens) {
      if (!grouped[sourceId].totalAdditionalTokens.includes(token)) {
        grouped[sourceId].totalAdditionalTokens.push(token)
      }
    }
  }
  
  return grouped
}

/**
 * Фильтрация результатов кросс-минусации
 */
export function filterCrossMinusationResults(
  matches: CrossMinusationMatch[],
  filters: {
    minTokens?: number
    maxTokens?: number
    minOverlapPercentage?: number
    reason?: 'subset' | 'significant_overlap'
    sourcePhraseIds?: string[]
  }
): CrossMinusationMatch[] {
  return matches.filter(match => {
    // Фильтр по количеству дополнительных токенов
    if (filters.minTokens !== undefined && match.additionalTokens.length < filters.minTokens) {
      return false
    }
    
    if (filters.maxTokens !== undefined && match.additionalTokens.length > filters.maxTokens) {
      return false
    }
    
    // Фильтр по проценту пересечения
    if (filters.minOverlapPercentage !== undefined && match.overlapPercentage < filters.minOverlapPercentage) {
      return false
    }
    
    // Фильтр по типу причины
    if (filters.reason && match.reason !== filters.reason) {
      return false
    }
    
    // Фильтр по ID исходных фраз
    if (filters.sourcePhraseIds && !filters.sourcePhraseIds.includes(match.sourcePhrase.id)) {
      return false
    }
    
    return true
  })
}

/**
 * Генерация отчета по кросс-минусации
 */
export function generateCrossMinusationReport(
  matches: CrossMinusationMatch[],
  phrases: Phrase[]
): {
  summary: {
    totalMatches: number
    uniqueSourcePhrases: number
    averageAdditionalTokens: number
    topTokenCandidates: string[]
  }
  bySourcePhrase: Array<{
    phrase: Phrase
    matchCount: number
    topTargets: Array<{
      phrase: Phrase
      additionalTokens: string[]
      overlapPercentage: number
    }>
  }>
  recommendations: string[]
} {
  // Статистика
  const uniqueSourcePhrases = new Set(matches.map(m => m.sourcePhrase.id)).size
  const averageAdditionalTokens = matches.length > 0 
    ? matches.reduce((sum, m) => sum + m.additionalTokens.length, 0) / matches.length 
    : 0
  
  // Топ токены-кандидаты
  const tokenCounts: Record<string, number> = {}
  for (const match of matches) {
    for (const token of match.additionalTokens) {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1
    }
  }
  
  const topTokenCandidates = Object.entries(tokenCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([token]) => token)
  
  // Группировка по исходным фразам
  const grouped = groupCrossMinusationBySource(matches)
  const bySourcePhrase = Object.values(grouped).map((group: any) => {
    const sortedTargets = group.targets
      .sort((a: any, b: any) => b.additionalTokens.length - a.additionalTokens.length)
      .slice(0, 5) // топ 5 целей
    
    return {
      phrase: group.sourcePhrase,
      matchCount: group.targets.length,
      topTargets: sortedTargets
    }
  }).sort((a, b) => b.matchCount - a.matchCount)
  
  // Рекомендации
  const recommendations: string[] = []
  
  if (uniqueSourcePhrases < phrases.length * 0.1) {
    recommendations.push('Низкий процент фраз участвует в кросс-минусации. Возможно, стоит снизить порог пересечения.')
  }
  
  if (averageAdditionalTokens > 5) {
    recommendations.push('Среднее количество дополнительных токенов высокое. Проверьте качество исходных фраз.')
  }
  
  if (topTokenCandidates.length > 0) {
    recommendations.push(`Топ кандидаты для минусации: ${topTokenCandidates.slice(0, 5).join(', ')}`)
  }
  
  recommendations.push('Рекомендуется применять кросс-минусацию только к проверенным и релевантным фразам.')
  
  return {
    summary: {
      totalMatches: matches.length,
      uniqueSourcePhrases,
      averageAdditionalTokens: Math.round(averageAdditionalTokens * 100) / 100,
      topTokenCandidates
    },
    bySourcePhrase,
    recommendations
  }
}

/**
 * Применить кросс-минусацию к фразам (для pipelines)
 */
export function applyCrossMinusation(
  phrases: Phrase[],
  useMorphology = true
): Phrase[] {
  const { matches } = computeCrossMinusation(phrases, useMorphology);
  
  // Создаем карту минус-слов для каждой фразы
  const minusMap = new Map<string, Set<string>>();
  
  matches.forEach(match => {
    // Для исходной фразы добавляем дополнительные токены из целевой
    if (!minusMap.has(match.sourcePhrase.id)) {
      minusMap.set(match.sourcePhrase.id, new Set());
    }
    match.additionalTokens.forEach(token => {
      minusMap.get(match.sourcePhrase.id)!.add(token);
    });
  });
  
  // Применяем минус-слова к фразам
  return phrases.map(phrase => {
    const minusTerms = minusMap.get(phrase.id);
    if (minusTerms && minusTerms.size > 0) {
      return {
        ...phrase,
        minusTerms: [...(phrase.minusTerms || []), ...Array.from(minusTerms)]
      };
    }
    return phrase;
  });
}
