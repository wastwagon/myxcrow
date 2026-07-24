import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { FieldTone } from './Input';

const selectTone: Record<FieldTone, string> = {
  dark: 'border-white/20 bg-[#2a1c1e] text-white focus:ring-brand-gold focus:border-brand-gold/50',
  light:
    'border-2 border-gray-200 bg-white text-gray-900 focus:ring-brand-gold focus:border-brand-gold',
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  tone?: FieldTone;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, tone = 'dark', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full min-h-[44px] px-4 py-3 rounded-ios-lg outline-none appearance-none transition-colors',
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
