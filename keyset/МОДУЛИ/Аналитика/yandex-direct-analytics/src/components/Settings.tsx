import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Link2, Unlink, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Settings() {
  const [businessType, setBusinessType] = useState('ecommerce')
  const [saved, setSaved] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [userId, setUserId] = useState<string | null>(null)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const businessTypes = [
    { value: 'ecommerce', label: 'E-commerce (интернет-магазин)' },
    { value: 'leadgen', label: 'Lead Generation (лидогенерация)' },
    { value: 'brand', label: 'Brand (бренд-кампании)' },
    { value: 'local', label: 'Local (локальный бизнес)' },
    { value: 'mobile_app', label: 'Mobile App (мобильное приложение)' },
    { value: 'b2b', label: 'B2B (бизнес для бизнеса)' },
    { value: 'finance', label: 'Finance (финансы)' },
    { value: 'travel', label: 'Travel (путешествия)' },
  ]

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = () => {
    const storedUserId = localStorage.getItem('userId')
    const storedConnectionId = localStorage.getItem('connectionId')
    const storedIsConnected = localStorage.getItem('isConnected') === 'true'

    setUserId(storedUserId)
    setConnectionId(storedConnectionId)
    setIsConnected(storedIsConnected)
    setConnectionStatus(storedIsConnected ? 'connected' : 'disconnected')
  }

  const handleSave = () => {
    // Сохраняем настройки в localStorage
    localStorage.setItem('businessType', businessType)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      // Используем фиксированный redirect URI для старого домена
      const redirectUri = 'https://el6p1zne1dhx.space.minimax.io/callback'
      
      // Вызываем Edge Function для начала OAuth
      const { data, error } = await supabase.functions.invoke('oauth-start', {
        body: {
          provider: 'direct',
          redirectUri
        }
      })

      if (error) {
        throw new Error(error.message || 'Ошибка при запуске OAuth')
      }

      if (data?.error) {
        throw new Error(data.error.message || 'Ошибка авторизации')
      }

      if (data?.data?.authUrl) {
        // Перенаправляем пользователя на страницу авторизации Яндекс
        window.location.href = data.data.authUrl
      } else {
        throw new Error('Не получен URL авторизации')
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert(error instanceof Error ? error.message : 'Ошибка подключения')
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    if (confirm('Вы уверены, что хотите отключить Яндекс.Директ?')) {
      localStorage.removeItem('userId')
      localStorage.removeItem('connectionId')
      localStorage.removeItem('isConnected')
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setUserId(null)
      setConnectionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Настройки</h1>
      </div>

      {/* Секция подключения Яндекс.Директ */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold mb-4">Подключение Яндекс.Директ</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус подключения
              </label>
              
              {connectionStatus === 'checking' && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  <span className="text-gray-600">Проверка статуса...</span>
                </div>
              )}

              {connectionStatus === 'connected' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Подключено</span>
                  </div>
                  {userId && (
                    <div className="text-sm text-gray-600">
                      <p>User ID: {userId.slice(0, 8)}...</p>
                      {connectionId && <p>Connection ID: {connectionId.slice(0, 8)}...</p>}
                    </div>
                  )}
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Unlink className="w-4 h-4" />
                    <span>Отключить</span>
                  </button>
                </div>
              )}

              {connectionStatus === 'disconnected' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Не подключено</span>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Подключение...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-5 h-5" />
                        <span>Подключить Яндекс.Директ</span>
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600">
                    Для получения данных о ваших кампаниях необходимо авторизоваться через Яндекс ID
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Секция настроек аккаунта */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold mb-4">Настройки аккаунта</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип бизнеса
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Правила оптимизации адаптируются под выбранный тип бизнеса
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Пороговые значения</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Максимальный CPA (₽)
              </label>
              <input
                type="number"
                defaultValue="1500"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Максимальные расходы без конверсий (₽)
              </label>
              <input
                type="number"
                defaultValue="2000"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальный CTR (%)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="1.5"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальная конверсия (%)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="1.0"
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {saved && (
            <span className="text-green-600 text-sm">Настройки сохранены</span>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить настройки</span>
          </button>
        </div>
      </div>

      {/* Информационная секция */}
      {!isConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-blue-700 mb-2">Как подключить Яндекс.Директ?</h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Нажмите кнопку "Подключить Яндекс.Директ"</li>
            <li>Авторизуйтесь через Яндекс ID</li>
            <li>Разрешите доступ к API Яндекс.Директ</li>
            <li>Дождитесь синхронизации данных</li>
          </ol>
        </div>
      )}
    </div>
  )
}
