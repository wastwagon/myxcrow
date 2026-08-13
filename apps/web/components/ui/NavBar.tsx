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
  tone?: 'dark' | 'light';
}

export function NavBar({
  title,
  subtitle,
  showBack,
  onBack,
  trailing,
  large,
  className,
  tone = 'dark',
}: NavBarProps) {
  const router = useRouter();
  const light = tone === 'light';

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        light
          ? 'bg-[#f2f2f7] pt-[var(--app-sat,env(safe-area-inset-top,0px))]'
          : 'pt-safe bg-[var(--app-chrome-bg)] border-b border-white/10 shadow-tab-bar',
        className
      )}
    >
      <div className="flex items-center min-h-[44px] px-2 gap-1">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[10px] touch-manipulation',
              light ? 'text-brand-maroon hover:bg-black/5' : 'text-brand-gold hover:bg-white/10'
            )}
            aria-label="Go back"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2.25} />
          </button>
        ) : (
          <div className="w-11 shrink-0" aria-hidden />
        )}
        <div className="flex-1 min-w-0 text-center px-1">
          {title && (
            <h1
              className={cn(
                'font-semibold truncate tracking-tight',
                light ? 'text-[17px] text-gray-900' : 'text-label-primary',
                large && !light ? 'text-ios-large-title text-left px-2 pt-1' : 'text-ios-headline'
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && !large && (
            <p className={cn('text-ios-caption truncate', light ? 'text-[rgba(60,60,67,0.6)]' : 'text-label-tertiary')}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
          {trailing}
        </div>
      </div>
      {large && subtitle && (
        <p className={cn('text-ios-subhead px-4 pb-3', light ? 'text-[rgba(60,60,67,0.6)]' : 'text-label-secondary')}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
