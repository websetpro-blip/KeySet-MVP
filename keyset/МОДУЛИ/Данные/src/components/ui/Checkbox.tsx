import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, indeterminate, checked, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);
    
    return (
      <div className="inline-flex items-center">
        <div className="relative inline-flex items-center">
          <input
            ref={inputRef}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className={cn(
              'peer h-4 w-4 cursor-pointer appearance-none',
              'border-1.5 border-gray-300 rounded-[3px]',
              'bg-white transition-all duration-fast',
              'hover:border-blue-500',
              'checked:bg-blue-500 checked:border-blue-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          
          {(checked || indeterminate) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {indeterminate ? (
                <div className="w-2 h-0.5 bg-white rounded" />
              ) : (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </div>
          )}
        </div>
        
        {label && (
          <label
            htmlFor={checkboxId}
            className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
