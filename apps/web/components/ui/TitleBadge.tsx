import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function TitleBadge({
  as: Comp = 'span',
  className,
  children,
}: {
  as?: 'span' | 'p' | 'h1' | 'h2';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Comp
      className={cn(
        'inline-flex items-center rounded-full bg-white px-3.5 py-1 text-[12px] font-semibold tracking-tight text-brand-maroon ring-1 ring-black/[0.06] shadow-sm',
        className
      )}
    >
      {children}
    </Comp>
  );
}
