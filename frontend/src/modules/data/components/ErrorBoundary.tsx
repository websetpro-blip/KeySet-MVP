import React from 'react';
import { apiUrl } from '../../../lib/apiClient';

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }
  return {
    message: 'Unknown error',
    details: JSON.stringify(error, null, 2)
  };
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Логируем ошибку
    console.error('KeySet Error Boundary caught an error:', error, errorInfo);

    try {
      const payload = {
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        error: serializeError(error),
        info: errorInfo,
        timestamp: Date.now(),
      };
      fetch(apiUrl('/api/debug/react-error'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // ignore telemetry issues
    }
    
    // Попытка восстановиться от ошибок данных localStorage
    const message = error?.message ?? '';
    const corruptedStoreError =
      message.includes('JSON') ||
      message.includes('parse') ||
      message.includes('Invalid hook call') ||
      message.includes('#185');

    if (corruptedStoreError) {
      try {
        const clearedKeys: string[] = [];
        Object.keys(localStorage).forEach((key) => {
          if (key.includes('keyset') || key.includes('column') || key.includes('phrase')) {
            localStorage.removeItem(key);
            clearedKeys.push(key);
          }
        });

        console.warn(
          '[KeySet][store] Cleared potentially corrupted localStorage entries:',
          clearedKeys,
        );

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e) {
        console.error('[KeySet][store] Failed to clear localStorage after crash:', e);
      }
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = serializeError(this.state.error);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-2xl w-full mx-4">
            <div className="bg-white shadow-lg rounded-lg p-6 border border-red-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-red-800">Ошибка KeySet</h2>
                  <p className="text-red-600">Приложение столкнулось с неожиданной ошибкой</p>
                </div>
              </div>
              
              <div className="bg-red-50 rounded p-4 mb-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Детали ошибки:</h3>
                <pre className="text-xs text-red-700 overflow-auto">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Перезагрузить приложение
                </button>
                
                <button 
                  onClick={() => {
                    // Полная очистка и перезагрузка
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Очистить данные и перезагрузить
                </button>
              </div>
              
              {errorDetails.stack && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer">Технические детали</summary>
                  <pre className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                    {errorDetails.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
