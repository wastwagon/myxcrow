import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional uppercase eyebrow label above the title */
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** @deprecated Kept for call-site compatibility; visual style is unified in V2 */
  gradient?: 'brand' | 'gold' | 'maroon' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div className="mt-1 hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-gold/25 bg-brand-gold/10 text-brand-gold [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              {eyebrow}
            </p>
          )}
          <h1
            className={`text-2xl md:text-3xl font-bold tracking-tight text-white ${
              eyebrow ? 'mt-1' : ''
            }`}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
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
