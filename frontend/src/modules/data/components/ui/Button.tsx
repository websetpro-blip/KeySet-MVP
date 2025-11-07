import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Базовые стили
          'inline-flex items-center justify-center gap-2',
          'font-medium transition-all duration-fast',
          'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Размеры
          size === 'sm' && 'px-3 py-2 text-xs rounded-sm',
          size === 'md' && 'px-4 py-2.5 text-sm rounded-sm',
          
          // Варианты
          variant === 'primary' && [
            'bg-blue-500 text-white shadow-sm',
            'hover:bg-blue-600 active:bg-blue-700',
            'disabled:hover:bg-blue-500',
          ],
          variant === 'secondary' && [
            'bg-white text-gray-700 border border-gray-300 shadow-xs',
            'hover:bg-gray-50 hover:border-gray-400',
            'active:bg-gray-100',
            'disabled:hover:bg-white disabled:hover:border-gray-300',
          ],
          variant === 'danger' && [
            'bg-white text-error-500 border border-error-300',
            'hover:bg-error-100 hover:border-error-400',
            'active:bg-error-100',
            'disabled:hover:bg-white',
          ],
          variant === 'ghost' && [
            'text-gray-600 hover:bg-gray-100',
            'active:bg-gray-200',
          ],
          
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
