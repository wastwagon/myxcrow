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
        'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-4 shadow-ios-card',
        'ring-1',
        accentRing[accent],
        className
      )}
    >
      {icon && (
        <div className="w-9 h-9 rounded-ios-lg bg-brand-gold/15 flex items-center justify-center text-brand-gold shrink-0 mb-2">
          {icon}
        </div>
      )}
      <p className="text-xs font-medium text-white/65 mb-0.5">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-white/10 animate-pulse rounded-ios" />
      ) : (
        <p className="text-2xl text-white font-bold tracking-tight">{value}</p>
      )}
      {hint && <p className="text-xs text-white/50 mt-1">{hint}</p>}
    </div>
  );
}
