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
}

/** Label + control + hint/error wrapper for dark or light forms. */
export function Field({ label, htmlFor, hint, error, children, className, required }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-ios-footnote font-medium text-label-secondary">
          {label}
          {required && <span className="text-brand-gold ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-ios-caption text-label-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
