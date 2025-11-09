/**
 * Предустановленные пайплайны очистки "под ключ"
 * Выполняют целую цепь операций в 1 клик
 */

import { removeExactDuplicates, removeMorphologicalDuplicates } from './duplicates'
import { removePhrasesWithStopwords } from './stopwords'
import { applyCrossMinusation } from './crossMinusate'
import { removeNoise } from './smartNoise'
import { normalizeAllPhrases } from './normalize'
import type { Phrase, Stopword } from '../types/index'

export interface PipelineContext {
  phrases: Phrase[]
  stopwords: Stopword[]
}

export type PipelineStep = (ctx: PipelineContext) => Promise<PipelineContext> | PipelineContext

/**
 * ПАЙПЛАЙН 1: Очистка для PPC (рекламная кампания)
 * Быстро подготовить запросы к загрузке в Яндекс.Директ / Google Ads
 */
export const ppcCleanupPipeline: PipelineStep[] = [
  // Шаг 1: Удалить точные дубли
  (ctx) => ({
    ...ctx,
    phrases: removeExactDuplicates(ctx.phrases)
  }),

  // Шаг 2: Нормализовать текст
  (ctx) => ({
    ...ctx,
    phrases: normalizeAllPhrases(ctx.phrases)
  }),

  // Шаг 3: Удалить мусор
  (ctx) => {
    const { cleaned } = removeNoise(ctx.phrases)
    return { ...ctx, phrases: cleaned }
  },

  // Шаг 4: Удалить морфологические дубли
  (ctx) => ({
    ...ctx,
    phrases: removeMorphologicalDuplicates(ctx.phrases)
  }),

  // Шаг 5: Удалить коммерческий мусор (стоп-слова)
  (ctx) => ({
    ...ctx,
    phrases: removePhrasesWithStopwords(ctx.phrases, ctx.stopwords)
  }),

  // Шаг 6: Кросс-минусация
  (ctx) => ({
    ...ctx,
    phrases: applyCrossMinusation(ctx.phrases, true)
  }),

  // Шаг 7: Удалить низкочастотные (<100)
  (ctx) => ({
    ...ctx,
    phrases: ctx.phrases.filter(p => (p.ws || 0) >= 100)
  })
]

/**
 * ПАЙПЛАЙН 2: Информационные запросы (SEO)
 * Оставить только информационные, убрать брендовые/коммерческие
 */
export const infoCleanupPipeline: PipelineStep[] = [
  // Шаг 1: Нормализовать
  (ctx) => ({
    ...ctx,
    phrases: normalizeAllPhrases(ctx.phrases)
  }),

  // Шаг 2: Удалить точные дубли
  (ctx) => ({
    ...ctx,
    phrases: removeExactDuplicates(ctx.phrases)
  }),

  // Шаг 3: Удалить мусор
  (ctx) => {
    const { cleaned } = removeNoise(ctx.phrases)
    return { ...ctx, phrases: cleaned }
  },

  // Шаг 4: Отметить информационные (содержат "как", "что", "где", "почему")
  (ctx) => ({
    ...ctx,
    phrases: ctx.phrases.map(p => ({
      ...p,
      tags: [
        ...(p.tags || []),
        /\b(как|что|где|почему|зачем|какой|какие|какая)\b/i.test(p.text) ? 'info' : 'commercial'
      ]
    }))
  }),

  // Шаг 5: Удалить явно коммерческие ("купить", "цена", "стоимость")
  (ctx) => ({
    ...ctx,
    phrases: ctx.phrases.filter(p => !/\b(купить|цена|стоимость|заказать|доставка|оплата)\b/i.test(p.text))
  }),

  // Шаг 6: Удалить очень низкочастотные (<50 для инфо запросов)
  (ctx) => ({
    ...ctx,
    phrases: ctx.phrases.filter(p => (p.ws || 0) >= 50)
  })
]

/**
 * ПАЙПЛАЙН 3: Быстрая базовая чистка
 * Минимум - удалить только явный мусор
 */
export const quickCleanupPipeline: PipelineStep[] = [
  (ctx) => ({
    ...ctx,
    phrases: removeExactDuplicates(ctx.phrases)
  }),
  (ctx) => ({
    ...ctx,
    phrases: normalizeAllPhrases(ctx.phrases)
  }),
  (ctx) => {
    const { cleaned } = removeNoise(ctx.phrases)
    return { ...ctx, phrases: cleaned }
  }
]

/**
 * Запустить пайплайн
 */
export async function runPipeline(
  steps: PipelineStep[],
  context: PipelineContext
): Promise<{ result: PipelineContext; log: string[] }> {
  const log: string[] = []
  let current = { ...context }
  const initialCount = current.phrases.length

  for (let i = 0; i < steps.length; i++) {
    const before = current.phrases.length
    current = await steps[i](current)
    const after = current.phrases.length
    const diff = before - after

    if (diff > 0) {
      log.push(`Шаг ${i + 1}: Удалено ${diff} фраз (осталось ${after})`)
    } else {
      log.push(`Шаг ${i + 1}: Обработано (осталось ${after})`)
    }
  }

  const totalRemoved = initialCount - current.phrases.length
  log.push(`✅ Готово! Удалено: ${totalRemoved}/${initialCount} (${((totalRemoved/initialCount)*100).toFixed(1)}%)`)

  return { result: current, log }
}

/**
 * Предпросмотр пайплайна (сухой запуск)
 */
export async function previewPipeline(
  steps: PipelineStep[],
  context: PipelineContext
): Promise<{ preview: string; removed: number; remaining: number }> {
  const result = await runPipeline(steps, context)
  return {
    preview: result.log.join('\n'),
    removed: context.phrases.length - result.result.phrases.length,
    remaining: result.result.phrases.length
  }
}

export default { ppcCleanupPipeline, infoCleanupPipeline, quickCleanupPipeline, runPipeline, previewPipeline }
