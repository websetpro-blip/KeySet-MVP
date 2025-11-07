import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, Target, RefreshCw } from 'lucide-react'

interface Metrics {
  totalCost: string
  totalClicks: number
  totalImpressions: number
  totalConversions: number
  avgCtr: string
  avgCpa: string
  avgCpc: string
  conversionRate: string
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [potentialSaving, setPotentialSaving] = useState('0')
  const [isConnected, setIsConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
    const storedTime = localStorage.getItem('lastSyncTime')
    if (storedTime) {
      setLastSyncTime(storedTime)
    }
  }, [])

  useEffect(() => {
    if (accountId) {
      loadData()
    }
  }, [accountId])

  const checkConnection = async () => {
    const userId = localStorage.getItem('userId')
    const connected = localStorage.getItem('isConnected') === 'true'
    
    setIsConnected(connected)

    if (connected && userId) {
      // Получаем первый аккаунт пользователя
      try {
        const { data: accounts, error } = await supabase
          .from('accounts')
          .select('id')
          .eq('org_id', userId)
          .limit(1)

        if (!error && accounts && accounts.length > 0) {
          setAccountId(accounts[0].id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching account:', error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const loadData = async () => {
    if (!accountId) return

    try {
      // Получаем аналитику через Edge Function
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: {
          accountId: accountId,
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0]
        }
      })

      if (error) throw error

      if (data?.data) {
        setMetrics(data.data.metrics)
        setPotentialSaving(data.data.potentialSaving || '0')
      } else {
        // Если нет данных, возможно они еще не синхронизированы
        setMetrics(null)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!accountId || syncing) return
    
    setSyncing(true)
    try {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dateTo = new Date().toISOString().split('T')[0]

      await supabase.functions.invoke('sync-direct-data', {
        body: {
          accountId,
          dateFrom,
          dateTo,
          reportType: 'search-queries'
        }
      })

      const syncTime = new Date().toISOString()
      localStorage.setItem('lastSyncTime', syncTime)
      setLastSyncTime(syncTime)

      // Перезагружаем данные
      await loadData()
    } catch (error) {
      console.error('Sync error:', error)
      alert('Ошибка синхронизации. Попробуйте позже.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Яндекс.Директ не подключен
          </h3>
          <p className="text-gray-700 mb-4">
            Для просмотра аналитики необходимо подключить ваш аккаунт Яндекс.Директ
          </p>
          <a
            href="/settings"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Перейти в настройки
          </a>
        </div>
      </div>
    )
  }

  if (!accountId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Аккаунты не найдены
          </h3>
          <p className="text-gray-700 mb-4">
            Не удалось найти аккаунты Яндекс.Директ. Возможно, данные еще синхронизируются.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  if (!metrics && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Синхронизация...' : 'Синхронизировать'}</span>
          </button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Данные отсутствуют
          </h3>
          <p className="text-gray-700 mb-4">
            Данные кампаний еще не загружены. Нажмите кнопку "Синхронизировать" для загрузки данных из Яндекс.Директ.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          {lastSyncTime && (
            <span className="text-sm text-gray-600">
              Последняя синхронизация: {new Date(lastSyncTime).toLocaleString('ru-RU')}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Синхронизация...' : 'Обновить данные'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Общие расходы"
          value={`${parseFloat(metrics?.totalCost || '0').toLocaleString('ru-RU')} ₽`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: '-12%', isPositive: true }}
          color="blue"
        />

        <MetricCard
          title="Клики"
          value={metrics?.totalClicks.toLocaleString('ru-RU') || '0'}
          icon={<MousePointerClick className="w-6 h-6" />}
          trend={{ value: '+8%', isPositive: true }}
          color="green"
        />

        <MetricCard
          title="Показы"
          value={metrics?.totalImpressions.toLocaleString('ru-RU') || '0'}
          icon={<Eye className="w-6 h-6" />}
          trend={{ value: '+15%', isPositive: true }}
          color="purple"
        />

        <MetricCard
          title="Конверсии"
          value={metrics?.totalConversions.toLocaleString('ru-RU') || '0'}
          icon={<Target className="w-6 h-6" />}
          trend={{ value: '+5%', isPositive: true }}
          color="orange"
        />

        <MetricCard
          title="CTR"
          value={`${metrics?.avgCtr || '0'}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: '+0.3%', isPositive: true }}
          color="cyan"
        />

        <MetricCard
          title="CPA"
          value={`${parseFloat(metrics?.avgCpa || '0').toLocaleString('ru-RU')} ₽`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: '-18%', isPositive: true }}
          color="pink"
        />
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">Потенциальная экономия</h3>
            <p className="text-4xl font-bold text-green-600">
              {parseFloat(potentialSaving).toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-sm text-gray-600 mt-2">на основе {metrics?.totalClicks || 0} кликов за последние 7 дней</p>
          </div>
          <div className="bg-green-100 rounded-full p-4">
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: { value: string; isPositive: boolean }
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink'
}

function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-600',
    green: 'from-green-50 to-green-100/50 border-green-200 text-green-600',
    purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-600',
    orange: 'from-orange-50 to-orange-100/50 border-orange-200 text-orange-600',
    cyan: 'from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-600',
    pink: 'from-pink-50 to-pink-100/50 border-pink-200 text-pink-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}
