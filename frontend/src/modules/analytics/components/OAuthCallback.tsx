import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Обработка авторизации...')

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      if (error) {
        throw new Error(`Ошибка авторизации: ${error}`)
      }

      if (!code || !state) {
        throw new Error('Отсутствуют необходимые параметры')
      }

      setMessage('Обмен кода на токены...')

      // Вызываем Edge Function для обработки callback
      const { data, error: callbackError } = await supabase.functions.invoke('oauth-callback', {
        body: { code, state }
      })

      if (callbackError) {
        throw new Error(callbackError.message || 'Ошибка при обмене кода на токены')
      }

      if (data?.error) {
        throw new Error(data.error.message || 'Ошибка авторизации')
      }

      // Сохраняем ID пользователя и подключения в localStorage
      if (data?.data) {
        localStorage.setItem('userId', data.data.userId)
        localStorage.setItem('connectionId', data.data.connectionId)
        localStorage.setItem('isConnected', 'true')
      }

      setMessage('Авторизация успешна! Загружаем ваши аккаунты...')

      // Получаем аккаунты пользователя
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('org_id', data.data.userId)

      if (accountsError || !accounts || accounts.length === 0) {
        setStatus('success')
        setMessage('Авторизация завершена! Аккаунтов не найдено.')
        setTimeout(() => navigate('/dashboard'), 2000)
        return
      }

      setMessage(`Найдено аккаунтов: ${accounts.length}. Синхронизируем данные...`)

      // Запускаем синхронизацию для первого аккаунта
      const accountId = accounts[0].id
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dateTo = new Date().toISOString().split('T')[0]

      try {
        // Синхронизируем поисковые запросы
        await supabase.functions.invoke('sync-direct-data', {
          body: {
            accountId,
            dateFrom,
            dateTo,
            reportType: 'search-queries'
          }
        })

        setStatus('success')
        setMessage('Данные успешно синхронизированы!')
        
        // Сохраняем время последней синхронизации
        localStorage.setItem('lastSyncTime', new Date().toISOString())
      } catch (syncError) {
        console.warn('Data sync warning:', syncError)
        setStatus('success')
        setMessage('Авторизация завершена. Синхронизация выполнится в фоне.')
      }

      // Перенаправляем на dashboard через 2 секунды
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('OAuth callback error:', error)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Неизвестная ошибка')

      // Перенаправляем на settings через 3 секунды
      setTimeout(() => {
        navigate('/settings')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900">Авторизация</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Успешно!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Перенаправление на dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 mx-auto text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Ошибка</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Перенаправление на настройки...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
