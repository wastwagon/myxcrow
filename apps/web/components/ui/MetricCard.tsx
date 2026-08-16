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
  /** Dark glass (default) or light dashboard surface */
  tone?: 'dark' | 'light';
  trend?: string;
  trendPositive?: boolean;
}

const accentRingDark: Record<NonNullable<MetricCardProps['accent']>, string> = {
  gold: 'ring-brand-gold/25',
  amber: 'ring-amber-500/25',
  emerald: 'ring-emerald-500/25',
  maroon: 'ring-brand-maroon/40',
};

const accentIconLight: Record<NonNullable<MetricCardProps['accent']>, string> = {
  gold: 'bg-brand-maroon/10 text-brand-maroon',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  maroon: 'bg-brand-maroon/10 text-brand-maroon',
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = 'gold',
  loading,
  className,
  tone = 'light',
  trend,
  trendPositive = true,
}: MetricCardProps) {
  const light = tone === 'light';
  return (
    <div
      className={cn(
        'rounded-[12px] p-4',
        light
          ? 'bg-white'
          : cn('border border-white/10 bg-white/[0.07] backdrop-blur-sm ring-1', accentRingDark[accent]),
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0',
              light ? accentIconLight[accent] : 'bg-brand-gold/15 text-brand-gold'
            )}
          >
            {icon}
          </div>
        )}
        {trend && (
          <span className={cn('text-xs font-semibold', trendPositive ? 'text-emerald-600' : 'text-red-600')}>
            {trend}
          </span>
        )}
      </div>
      <p className={cn('text-xs font-medium mb-0.5', light ? 'text-gray-500' : 'text-white/65')}>{label}</p>
      {loading ? (
        <div className={cn('h-8 w-24 animate-pulse rounded-[12px]', light ? 'bg-gray-100' : 'bg-white/10')} />
      ) : (
        <p className={cn('text-2xl font-bold tracking-tight', light ? 'text-gray-900' : 'text-white')}>{value}</p>
      )}
      {hint && (
        <p className={cn('text-xs mt-1', light ? 'text-gray-500' : 'text-white/50')}>{hint}</p>
      )}
    </div>
  );
}
