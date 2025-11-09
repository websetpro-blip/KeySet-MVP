import React from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export const ActivityLog: React.FC = () => {
  const { activityLog } = useStore();
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Автопрокрутка вниз при новых записях
  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-success-400';
      case 'warning':
        return 'text-warning-400';
      case 'error':
        return 'text-error-400';
      default:
        return 'text-gray-300';
    }
  };
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '•';
    }
  };
  
  return (
    <div className="h-[140px] bg-gray-900 border-t border-gray-700 px-4 py-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Журнал активности
        </h3>
        
        <div className="text-xs text-gray-500">
          {activityLog.length > 0 && `Записей: ${activityLog.length}`}
        </div>
      </div>
      
      <div
        ref={logContainerRef}
        className="h-[calc(100%-28px)] overflow-y-auto font-mono text-xs leading-relaxed"
        style={{ scrollbarWidth: 'thin' }}
      >
        {activityLog.length === 0 ? (
          <div className="text-gray-500 italic">
            Журнал пуст. Действия будут отображаться здесь.
          </div>
        ) : (
          activityLog.map((log) => (
            <div key={log.id} className="flex items-start gap-2 mb-1 hover:bg-gray-800/30 px-1 -mx-1 rounded">
              <span className="text-gray-500 flex-shrink-0">
                [{formatTime(log.timestamp)}]
              </span>
              
              <span className={cn('flex-shrink-0', getLevelColor(log.level))}>
                {getLevelIcon(log.level)}
              </span>
              
              <span className={cn(
                'flex-1',
                log.level === 'error' ? 'text-error-400' : 'text-gray-300'
              )}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
