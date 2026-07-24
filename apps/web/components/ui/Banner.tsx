import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BannerTone = 'info' | 'success' | 'warning' | 'error' | 'brand';

const toneStyles: Record<BannerTone, string> = {
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  warning: 'border-amber-500/35 bg-amber-500/15 text-amber-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  brand: 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold',
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
}

export function Banner({
  tone = 'info',
  title,
  children,
  onDismiss,
  className,
  icon,
}: BannerProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      role="status"
      className={cn(
        'rounded-ios-lg border p-4 flex items-start gap-3',
        toneStyles[tone],
        className
      )}
    >
      <span className="mt-0.5 shrink-0 opacity-90" aria-hidden>
        {icon ?? <Icon className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0 text-sm">
        {title && <p className="font-semibold text-label-primary mb-0.5">{title}</p>}
        <div className="text-label-secondary [&_a]:text-brand-gold [&_a]:underline">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-ios text-label-tertiary hover:bg-white/10 hover:text-label-primary touch-manipulation"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
