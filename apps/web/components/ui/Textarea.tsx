import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { FieldTone } from './Input';

const textareaTone: Record<FieldTone, string> = {
  dark: 'border-white/20 bg-white/5 text-white placeholder:text-white/45 focus:ring-brand-gold focus:border-brand-gold/50',
  light:
    'border-transparent bg-[#f2f2f7] text-gray-900 placeholder:text-[rgba(60,60,67,0.5)] focus:ring-brand-maroon/25 focus:border-brand-maroon/20',
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: FieldTone;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, tone = 'light', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-[96px] px-4 py-3 rounded-[16px] border outline-none transition-colors resize-y',
          'focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
          textareaTone[tone],
          error &&
            (tone === 'dark'
              ? 'border-red-400/60 focus:ring-red-400/40'
              : 'border-red-400 focus:ring-red-400'),
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
