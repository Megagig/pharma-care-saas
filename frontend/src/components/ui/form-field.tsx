import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from './input';
import { Label } from './label';

export interface FormFieldProps extends InputProps {
  label?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false, 
    size = 'medium',
    variant = 'outlined',
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId();
    
    const sizeClasses = {
      small: 'h-8 px-2 py-1 text-xs',
      medium: 'h-10 px-3 py-2 text-sm',
      large: 'h-12 px-4 py-3 text-base'
    };

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <Label 
            htmlFor={inputId}
            className={cn(error && 'text-destructive')}
          >
            {label}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          className={cn(
            sizeClasses[size],
            error && 'border-destructive focus-visible:ring-destructive',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {helperText && (
          <p className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };