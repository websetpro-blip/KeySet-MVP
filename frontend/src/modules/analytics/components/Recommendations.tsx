import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, AlertCircle, PlayCircle, Lightbulb } from 'lucide-react'

interface Recommendation {
  id: string
  type: string
  entity_id: string
  priority: string
  status: string
  estimated_saving: number
  confidence: number
  reason: string
  params: any
}

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('account_id', '33333333-3333-3333-3333-333333333333')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setRecommendations(data || [])
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          accountId: '33333333-3333-3333-3333-333333333333',
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0]
        }
      })

      if (error) throw error
      await loadRecommendations()
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setGenerating(false)
    }
  }

  const applyRecommendation = async (recId: string, mode: 'sandbox' | 'production') => {
    setApplying(recId)
    try {
      const { data, error } = await supabase.functions.invoke('apply-action', {
        body: {
          recommendationId: recId,
          mode
        }
      })

      if (error) throw error
      await loadRecommendations()
    } catch (error) {
      console.error('Error applying recommendation:', error)
    } finally {
      setApplying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Рекомендации по оптимизации</h1>
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Lightbulb className="w-4 h-4" />
          <span>{generating ? 'Генерация...' : 'Сгенерировать рекомендации'}</span>
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Рекомендаций пока нет</p>
          <button
            onClick={generateRecommendations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Сгенерировать рекомендации
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onApply={applyRecommendation}
              isApplying={applying === rec.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onApply: (recId: string, mode: 'sandbox' | 'production') => void
  isApplying: boolean
}

function RecommendationCard({ recommendation, onApply, isApplying }: RecommendationCardProps) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50',
    low: 'border-blue-200 bg-blue-50',
  }

  const statusIcons = {
    proposed: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    approved: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    sandbox_applied: <PlayCircle className="w-5 h-5 text-blue-600" />,
    applied: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  }

  const typeLabels = {
    add_negative_keyword: 'Добавить минус-слово',
    pause_keyword: 'Поставить ключ на паузу',
    optimize_ad: 'Оптимизировать объявление',
  }

  return (
    <div className={`border rounded-lg p-6 shadow-sm ${priorityColors[recommendation.priority as keyof typeof priorityColors] || priorityColors.low}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {statusIcons[recommendation.status as keyof typeof statusIcons]}
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {typeLabels[recommendation.type as keyof typeof typeLabels] || recommendation.type}
            </h3>
            <p className="text-sm text-gray-600">
              Приоритет: <span className="capitalize">{recommendation.priority}</span> | 
              Статус: <span className="capitalize">{recommendation.status}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Экономия</p>
          <p className="text-2xl font-bold text-green-600">
            {recommendation.estimated_saving.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-xs text-gray-500">Уверенность: {recommendation.confidence}%</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{recommendation.reason}</p>

      {recommendation.status === 'proposed' && (
        <div className="flex space-x-3">
          <button
            onClick={() => onApply(recommendation.id, 'sandbox')}
            disabled={isApplying}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
          >
            {isApplying ? 'Применение...' : 'Применить в песочнице'}
          </button>
          <button
            onClick={() => onApply(recommendation.id, 'production')}
            disabled={isApplying}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
          >
            Применить в продакшене
          </button>
        </div>
      )}

      {recommendation.status === 'sandbox_applied' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Применено в песочнице. Результаты будут доступны через 24 часа.
        </div>
      )}

      {recommendation.status === 'applied' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Успешно применено в продакшене.
        </div>
      )}
    </div>
  )
}
