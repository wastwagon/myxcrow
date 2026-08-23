import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { IconWell, type IconWellColor } from '@/components/ui/IconWell';

export interface FilterCardOption<T extends string> {
  value: T;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  color: IconWellColor;
  count?: number;
}

export function FilterCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: FilterCardOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn('grid gap-2.5', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'relative flex min-h-[118px] flex-col items-center justify-center rounded-[16px] border bg-white px-2 py-4 text-center touch-manipulation',
              selected
                ? 'border-brand-gold ring-1 ring-brand-gold/35'
                : 'border-[rgba(60,60,67,0.08)] active:bg-black/[0.03]'
            )}
          >
            {option.count !== undefined && option.count > 0 && (
              <span className="absolute top-2.5 right-2.5 min-w-[20px] rounded-full bg-brand-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand-maroon-black">
                {option.count > 99 ? '99+' : option.count}
              </span>
            )}
            <IconWell icon={Icon} color={option.color} className="h-11 w-11 rounded-[14px]" />
            <span className="mt-2.5 text-[12px] font-semibold leading-tight text-brand-maroon-deep">
              {option.label}
            </span>
            <span className="mt-0.5 text-[10px] leading-tight text-[rgba(60,60,67,0.5)]">
              {option.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
