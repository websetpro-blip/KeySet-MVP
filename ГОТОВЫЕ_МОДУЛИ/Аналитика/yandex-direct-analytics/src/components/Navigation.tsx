import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Home, Settings as SettingsIcon, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Navigation() {
  const location = useLocation()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      const connected = localStorage.getItem('isConnected') === 'true'
      setIsConnected(connected)
    }
    
    checkConnection()
    
    // Слушаем изменения localStorage
    window.addEventListener('storage', checkConnection)
    return () => window.removeEventListener('storage', checkConnection)
  }, [])

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Яндекс.Директ Аналитика</span>
            </div>
            
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/analytics"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/analytics')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Аналитика</span>
              </Link>
              
              <Link
                to="/recommendations"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/recommendations')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Рекомендации</span>
              </Link>
              
              <Link
                to="/settings"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Настройки</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Подключено</span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-300">
                Не подключено
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
