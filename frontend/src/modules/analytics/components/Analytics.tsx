import { useEffect, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'

interface SearchQuery {
  id: number
  query: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  cpa: number | null
}

interface AnalyticsResponse {
  topWastefulQueries: SearchQuery[]
  topExpensiveConversions: SearchQuery[]
}

export function Analytics() {
  const [topWastefulQueries, setTopWastefulQueries] = useState<SearchQuery[]>([])
  const [topExpensiveConversions, setTopExpensiveConversions] = useState<SearchQuery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.status}`)
      }

      const data = (await response.json()) as AnalyticsResponse
      setTopWastefulQueries(data.topWastefulQueries ?? [])
      setTopExpensiveConversions(data.topExpensiveConversions ?? [])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
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
      <h1 className="text-3xl font-bold">Аналитика</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-700 mb-1">Проблемные зоны выявлены</h3>
          <p className="text-sm text-gray-700">
            Обнаружены запросы с высокими расходами без конверсий и дорогие конверсии. Просмотрите рекомендации для оптимизации.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold">Топ запросов без конверсий (потери бюджета)</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Запрос</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Показы</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Клики</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Расходы</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Конверсии</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topWastefulQueries.map((query, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{query.query}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.impressions.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.clicks.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                      {query.cost.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{query.conversions}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.ctr?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold">Топ дорогих конверсий (высокий CPA)</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Запрос</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Показы</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Клики</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Расходы</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Конверсии</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">CPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topExpensiveConversions.map((query, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{query.query}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.impressions.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.clicks.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.cost.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{query.conversions}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                      {query.cpa?.toLocaleString('ru-RU')} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
