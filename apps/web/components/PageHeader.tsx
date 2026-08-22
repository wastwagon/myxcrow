import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional 13pt secondary label above the title */
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Dark glass (default) or light dashboard surface */
  tone?: 'dark' | 'light';
  /** @deprecated Kept for call-site compatibility; visual style is unified in V2 */
  gradient?: 'brand' | 'gold' | 'maroon' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
  tone = 'light',
}: PageHeaderProps) {
  const light = tone === 'light';
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div
            className={cn(
              'mt-1 hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full border [&>svg]:h-5 [&>svg]:w-5',
              light
                ? 'border-brand-maroon/20 bg-brand-maroon/10 text-brand-maroon'
                : 'border-brand-gold/25 bg-brand-gold/10 text-brand-gold'
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p
              className={cn(
                'text-[13px] font-normal',
                light ? 'text-[rgba(60,60,67,0.6)]' : 'text-white/70'
              )}
            >
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              'text-[17px] font-semibold tracking-tight',
              light ? 'text-gray-900' : 'text-white',
              eyebrow && 'mt-1'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={cn('mt-1 text-sm', light ? 'text-gray-500' : 'text-white/55')}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 [&_a]:min-h-[48px] [&_a]:inline-flex [&_a]:items-center [&_button]:min-h-[48px] [&_button]:inline-flex [&_button]:items-center touch-manipulation">
          {action}
        </div>
      )}
    </header>
  );
}
