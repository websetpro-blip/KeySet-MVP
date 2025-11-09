import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-10 px-3 py-2.5',
            'text-sm text-gray-700 placeholder:text-gray-400',
            'bg-white border rounded-sm',
            'transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            
            // Состояния
            error 
              ? 'border-error-500 bg-error-100 focus:border-error-500 focus:ring-error-300'
              : 'border-gray-300 hover:border-gray-400',
            
            className
          )}
          {...props}
        />
        
        {helperText && (
          <p className={cn(
            'mt-1.5 text-xs',
            error ? 'text-error-600' : 'text-gray-500'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
