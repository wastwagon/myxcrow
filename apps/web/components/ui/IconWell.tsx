import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const wells = {
  maroon: 'bg-brand-maroon',
  blue: 'bg-[#007aff]',
  teal: 'bg-[#32ade6]',
  gray: 'bg-[#8e8e93]',
  orange: 'bg-[#ff9500]',
  green: 'bg-[#34c759]',
  indigo: 'bg-[#5856d6]',
} as const;

export type IconWellColor = keyof typeof wells;

export function IconWell({
  icon: Icon,
  color,
  className,
}: {
  icon: LucideIcon;
  color: IconWellColor;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-[29px] w-[29px] items-center justify-center rounded-[7px] text-white shrink-0',
        wells[color],
        className
      )}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
    </span>
  );
}
