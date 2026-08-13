import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BannerTone = 'info' | 'success' | 'warning' | 'error' | 'brand';

const darkToneStyles: Record<BannerTone, string> = {
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-500/35 bg-amber-500/15 text-amber-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  brand: 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold',
};

const lightToneStyles: Record<BannerTone, string> = {
  info: 'bg-blue-50 text-blue-900',
  success: 'bg-green-50 text-green-900',
  warning: 'bg-amber-50 text-amber-900',
  error: 'bg-red-50 text-red-800',
  brand: 'bg-brand-gold/10 text-gray-900',
};

const toneIcons: Record<BannerTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  brand: Info,
};

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
  icon?: ReactNode;
  /** Grouped iOS surface (customer / public). Default dark for admin. */
  light?: boolean;
}

export function Banner({
  tone = 'info',
  title,
  children,
  onDismiss,
  className,
  icon,
  light = false,
}: BannerProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      role="status"
      className={cn(
        'rounded-[12px] p-4 flex items-start gap-3',
        light ? lightToneStyles[tone] : cn('border', darkToneStyles[tone]),
        className
      )}
    >
      <span className="mt-0.5 shrink-0 opacity-90" aria-hidden>
        {icon ?? <Icon className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0 text-sm">
        {title && (
          <p className={cn('font-semibold mb-0.5', light ? 'text-gray-900' : 'text-label-primary')}>
            {title}
          </p>
        )}
        <div
          className={cn(
            light
              ? 'text-inherit [&_a]:text-brand-maroon [&_a]:font-semibold'
              : 'text-label-secondary [&_a]:text-brand-gold [&_a]:underline'
          )}
        >
          {children}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'shrink-0 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-[10px] touch-manipulation',
            light
              ? 'text-[rgba(60,60,67,0.6)] hover:bg-black/5'
              : 'text-label-tertiary hover:bg-white/10 hover:text-label-primary'
          )}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
