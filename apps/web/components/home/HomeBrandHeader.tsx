import Link from 'next/link';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { Bell, ChevronLeft, CircleUser, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

export type HomeHeaderLeading = 'account' | 'close' | 'back';

export function HomeBrandHeader({
  badge,
  onBell,
  greeting,
  accountLabel,
  avatarLabel,
  leading = 'account',
  closeHref = '/dashboard',
  onLeadingClick,
  trailing,
  pageTitle,
  screenTitle,
  overlapBand = true,
  bellExpanded = false,
}: {
  badge: number;
  onBell: () => void;
  greeting: string;
  accountLabel: string;
  avatarLabel: string;
  leading?: HomeHeaderLeading;
  closeHref?: string;
  onLeadingClick?: () => void;
  trailing?: ReactNode;
  pageTitle?: string;
  /** Accessible page name (defaults to pageTitle, greeting, or Home). */
  screenTitle?: string;
  /** Extra maroon band under the mobile toolbar (wallet-card overlap on Home). */
  overlapBand?: boolean;
  bellExpanded?: boolean;
}) {
  const accessibleTitle = screenTitle ?? pageTitle ?? greeting ?? 'Home';
  return (
    <>
      <header
        className="mx-on-maroon bg-brand-maroon-deep xl:hidden"
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
      >
        <h1 className="sr-only">{accessibleTitle}</h1>
        <div className="flex items-center min-h-[52px] px-1">
          <HeaderLeading
            leading={leading}
            closeHref={closeHref}
            onLeadingClick={onLeadingClick}
            className="text-brand-gold"
          />
          <div className="flex flex-1 min-w-0 items-center justify-center px-2">
            {leading === 'back' && pageTitle ? (
              <p className="truncate text-center text-[17px] font-semibold text-white">{pageTitle}</p>
            ) : (
              <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-brand-maroon-black ring-1 ring-brand-gold/40">
                <Image
                  src="/logo/MYXCROWLOGO.png"
                  alt="MYXCROW"
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>
          <div className="flex items-center shrink-0">
            {trailing}
            <HomeBell badge={badge} onBell={onBell} expanded={bellExpanded} />
          </div>
        </div>
        {overlapBand ? <div className="h-[72px]" aria-hidden /> : null}
      </header>

      <header
        className="mx-on-maroon hidden xl:block bg-brand-maroon-deep"
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center min-h-[72px] gap-5 px-6 xl:px-8">
          {leading === 'back' ? (
            <>
              <HeaderLeading
                leading={leading}
                closeHref={closeHref}
                onLeadingClick={onLeadingClick}
                className="text-brand-gold shrink-0"
              />
              <h1 className="min-w-0 flex-1 truncate text-[22px] font-semibold tracking-tight text-white">
                {pageTitle || greeting}
              </h1>
              <div className="flex items-center shrink-0">
                {trailing}
                <HomeBell badge={badge} onBell={onBell} expanded={bellExpanded} />
              </div>
              <Link
                href="/profile"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center touch-manipulation"
                aria-label="Account"
              >
                <UserAvatar label={avatarLabel} variant="gold" size="md" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="sr-only">{accessibleTitle}</h1>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[22px] font-semibold tracking-tight text-white">{greeting}</p>
                <p className="mt-0.5 truncate text-[13px] text-brand-gold">{accountLabel}</p>
              </div>
              {trailing}
              <HomeBell badge={badge} onBell={onBell} expanded={bellExpanded} />
              <Link
                href="/profile"
                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center touch-manipulation"
                aria-label="Account"
              >
                <UserAvatar label={avatarLabel} variant="gold" size="md" />
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}

function HeaderLeading({
  leading,
  closeHref,
  onLeadingClick,
  className,
}: {
  leading: HomeHeaderLeading;
  closeHref: string;
  onLeadingClick?: () => void;
  className?: string;
}) {
  const buttonClass = `inline-flex min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation focus-visible:rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${className}`;

  if (leading === 'back') {
    return (
      <button
        type="button"
        onClick={onLeadingClick}
        className={buttonClass}
        aria-label="Go back"
      >
        <ChevronLeft className="h-7 w-7" strokeWidth={2.25} />
      </button>
    );
  }

  if (leading === 'close') {
    if (onLeadingClick) {
      return (
        <button type="button" onClick={onLeadingClick} className={buttonClass} aria-label="Close">
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
      );
    }
    return (
      <Link href={closeHref} className={buttonClass} aria-label="Close">
        <X className="h-6 w-6" strokeWidth={2} />
      </Link>
    );
  }

  return (
    <Link href="/profile" className={buttonClass} aria-label="Account">
      <CircleUser className="h-7 w-7" strokeWidth={1.7} />
    </Link>
  );
}

function HomeBell({
  badge,
  onBell,
  expanded,
}: {
  badge: number;
  onBell: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onBell}
      className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-brand-gold touch-manipulation focus-visible:rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      aria-label="Approvals"
      aria-haspopup="dialog"
      aria-expanded={expanded}
    >
      <Bell className="h-6 w-6" strokeWidth={1.7} />
      {badge > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-semibold leading-4 text-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
