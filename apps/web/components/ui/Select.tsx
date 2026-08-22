import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { FieldTone } from './Input';

const selectTone: Record<FieldTone, string> = {
  dark: 'border-white/20 bg-[#2a1c1e] text-white focus:ring-brand-gold focus:border-brand-gold/50',
  light:
    'border-transparent bg-[#f2f2f7] text-gray-900 focus:ring-brand-maroon/25 focus:border-brand-maroon/20',
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  tone?: FieldTone;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, tone = 'light', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full min-h-[44px] px-4 py-3 rounded-[16px] border outline-none appearance-none transition-colors',
          'focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
          selectTone[tone],
          error &&
            (tone === 'dark'
              ? 'border-red-400/60 focus:ring-red-400/40'
              : 'border-red-400 focus:ring-red-400'),
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
