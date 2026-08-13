import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  tone?: 'dark' | 'light';
}

/** Label + control + hint/error wrapper for dark or light forms. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  required,
  tone = 'dark',
}: FieldProps) {
  const light = tone === 'light';
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            'block',
            light ? 'text-[13px] font-medium text-[rgba(60,60,67,0.6)]' : 'text-ios-footnote text-label-secondary'
          )}
        >
          {label}
          {required && (
            <span className={cn('ml-0.5', light ? 'text-brand-maroon' : 'text-brand-gold')}>*</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className={cn('text-sm', light ? 'text-red-600' : 'text-red-400')}>{error}</p>
      ) : hint ? (
        <p className={cn('text-[13px]', light ? 'text-[rgba(60,60,67,0.6)]' : 'text-ios-caption text-label-tertiary')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
