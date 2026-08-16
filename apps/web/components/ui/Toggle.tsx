import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  tone?: 'dark' | 'light';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onCheckedChange, disabled, label, id, tone = 'light', ...props }, ref) => {
    const light = tone === 'light';
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex h-[44px] w-[51px] shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          light
            ? 'focus-visible:ring-[#34C759]/40 focus-visible:ring-offset-[#f2f2f7]'
            : 'focus-visible:ring-brand-gold focus-visible:ring-offset-transparent',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors',
            light ? (checked ? 'bg-[#34C759]' : 'bg-[#e5e5ea]') : checked ? 'bg-brand-gold' : 'bg-white/20'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-transform',
              checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
            )}
          />
        </span>
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';
