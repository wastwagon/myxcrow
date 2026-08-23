import { type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export type HomeCategory = 'foryou' | 'protect' | 'wallet';

const TABS: { value: HomeCategory; label: string }[] = [
  { value: 'foryou', label: 'For you' },
  { value: 'protect', label: 'Protect' },
  { value: 'wallet', label: 'Wallet' },
];

export const HOME_TABPANEL_ID = 'home-tabpanel';

export function HomeCategoryTabs({
  value,
  onChange,
}: {
  value: HomeCategory;
  onChange: (value: HomeCategory) => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = TABS.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const tab = TABS[next];
    onChange(tab.value);
    requestAnimationFrame(() => {
      document.getElementById(`home-tab-${tab.value}`)?.focus();
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Home sections"
      className="-mx-4 grid grid-cols-3 border-b border-[rgba(60,60,67,0.12)] px-4"
    >
      {TABS.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`home-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={HOME_TABPANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'relative flex min-h-[48px] items-center justify-center px-1 text-[11px] font-semibold uppercase tracking-[0.1em] touch-manipulation',
              'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-gold',
              selected ? 'text-brand-maroon-deep' : 'text-[rgba(60,60,67,0.62)]'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'absolute inset-x-0 bottom-0 h-[2px]',
                selected ? 'bg-brand-gold' : 'bg-transparent'
              )}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
