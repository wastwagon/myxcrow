import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FieldTone = 'dark' | 'light';

const inputTone: Record<FieldTone, string> = {
  dark: 'border-white/20 bg-white/5 text-white placeholder:text-white/45 focus:ring-brand-gold focus:border-brand-gold/50',
  light:
    'border-transparent bg-[#f2f2f7] text-gray-900 placeholder:text-[rgba(60,60,67,0.4)] focus:ring-brand-maroon/25 focus:border-brand-maroon/20',
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  tone?: FieldTone;
  error?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, tone = 'dark', error, leading, trailing, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        className={cn(
          'w-full min-h-[44px] px-4 py-3 rounded-[10px] border outline-none transition-colors',
          'focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
          inputTone[tone],
          error &&
            (tone === 'dark'
              ? 'border-red-400/60 focus:ring-red-400/40 focus:border-red-400/60'
              : 'border-red-400 focus:ring-red-400 focus:border-red-400'),
          leading && 'pl-11',
          trailing && 'pr-11',
          className
        )}
        {...props}
      />
    );

    if (!leading && !trailing) return field;

    return (
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-label-tertiary">
            {leading}
          </span>
        )}
        {field}
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
