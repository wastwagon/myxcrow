import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { FieldTone } from './Input';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  tone?: FieldTone;
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, tone = 'dark', label, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border focus:ring-2 focus:ring-offset-0 touch-manipulation',
          tone === 'dark'
            ? 'border-white/25 bg-white/5 text-brand-gold focus:ring-brand-gold'
            : 'border-gray-300 bg-white text-brand-maroon focus:ring-brand-maroon',
          className
        )}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer select-none',
          tone === 'dark' ? 'text-sm text-label-secondary' : 'text-sm text-gray-700'
        )}
      >
        {input}
        <span>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
