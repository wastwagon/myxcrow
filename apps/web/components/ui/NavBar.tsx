import { type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  large?: boolean;
  className?: string;
}

export function NavBar({
  title,
  subtitle,
  showBack,
  onBack,
  trailing,
  large,
  className,
}: NavBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 pt-safe',
        'bg-[var(--app-chrome-bg)] border-b border-white/10 shadow-tab-bar',
        className
      )}
    >
      <div className="flex items-center min-h-[44px] px-2 gap-1">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-ios text-brand-gold touch-manipulation hover:bg-white/10"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          </button>
        ) : (
          <div className="w-11 shrink-0" aria-hidden />
        )}
        <div className="flex-1 min-w-0 text-center px-1">
          {title && (
            <h1
              className={cn(
                'font-semibold text-label-primary truncate tracking-tight',
                large ? 'text-ios-large-title text-left px-2 pt-1' : 'text-ios-headline'
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && !large && (
            <p className="text-ios-caption text-label-tertiary truncate">{subtitle}</p>
          )}
        </div>
        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
          {trailing}
        </div>
      </div>
      {large && subtitle && (
        <p className="text-ios-subhead text-label-secondary px-4 pb-3">{subtitle}</p>
      )}
    </header>
  );
}
