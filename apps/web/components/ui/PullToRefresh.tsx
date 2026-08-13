import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, className, disabled }: PullToRefreshProps) {
  const { pull, refreshing, pullHandlers, pullProgress } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  return (
    <div className={cn('relative', className)} {...pullHandlers}>
      <div
        className={cn(
          'pointer-events-none absolute left-0 right-0 flex justify-center z-10 transition-opacity duration-150',
          pull > 0 || refreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{ top: Math.max(pull - 36, 0) }}
        aria-hidden
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[rgba(60,60,67,0.12)] shadow-sm backdrop-blur-sm">
          <Loader2
            className={cn('w-4 h-4 text-brand-maroon', refreshing && 'animate-spin')}
            style={{
              transform: refreshing ? undefined : `rotate(${pullProgress * 180}deg)`,
            }}
          />
          <span className="text-[11px] text-[rgba(60,60,67,0.6)]">
            {refreshing ? 'Refreshing…' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull}px)` : undefined,
          transition: pull > 0 ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
