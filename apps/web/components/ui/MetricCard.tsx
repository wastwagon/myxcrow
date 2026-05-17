import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: 'gold' | 'amber' | 'emerald' | 'maroon';
  loading?: boolean;
  className?: string;
}

const accentRing: Record<NonNullable<MetricCardProps['accent']>, string> = {
  gold: 'ring-brand-gold/25',
  amber: 'ring-amber-500/25',
  emerald: 'ring-emerald-500/25',
  maroon: 'ring-brand-maroon/40',
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = 'gold',
  loading,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-5 shadow-ios-card',
        'ring-1',
        accentRing[accent],
        className
      )}
    >
      {icon && (
        <div className="w-10 h-10 rounded-ios-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0 mb-3">
          {icon}
        </div>
      )}
      <p className="text-ios-footnote font-medium text-label-secondary mb-1">{label}</p>
      {loading ? (
        <div className="h-9 w-28 bg-white/10 animate-pulse rounded-ios" />
      ) : (
        <p className="text-ios-title-1 text-label-primary font-bold tracking-tight">{value}</p>
      )}
      {hint && <p className="text-ios-caption text-label-tertiary mt-2">{hint}</p>}
    </div>
  );
}
