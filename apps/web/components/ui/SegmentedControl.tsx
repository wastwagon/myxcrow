import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Scroll horizontally on narrow screens */
  scrollable?: boolean;
  /** Dark glass (default) or light dashboard surface */
  tone?: 'dark' | 'light';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  scrollable,
  tone = 'light',
}: SegmentedControlProps<T>) {
  const light = tone === 'light';
  return (
    <div
      role="tablist"
      className={cn(
        'flex w-full p-1 rounded-[16px]',
        light ? 'bg-[#e5e5ea]' : 'bg-white/10 border border-white/10',
        scrollable && 'max-w-full overflow-x-auto',
        className
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-[14px] text-ios-footnote sm:text-ios-subhead font-medium',
              'whitespace-nowrap touch-manipulation transition-colors',
              selected
                ? light
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-white/20 text-label-primary shadow-sm'
                : light
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-label-secondary hover:text-label-primary'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
