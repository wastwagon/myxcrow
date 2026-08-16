import { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AlertCircle, ChevronLeft, Home, Shield, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

const DESKTOP_LINKS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
  { href: '/profile', label: 'Account', icon: User },
];

interface CustomerLayoutProps {
  title: string;
  trailing?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  large?: boolean;
  children: ReactNode;
}

export default function CustomerLayout({
  title,
  trailing,
  back,
  onBack,
  large = true,
  children,
}: CustomerLayoutProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(!large);

  useEffect(() => {
    document.documentElement.classList.add('customer-app');
    return () => {
      document.documentElement.classList.remove('customer-app');
    };
  }, []);

  useEffect(() => {
    if (!large) {
      setCompact(true);
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setCompact(el.scrollTop > 28);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [large, title]);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const isDesktopActive = (href: string) => {
    if (href === '/dashboard') return router.pathname === '/dashboard';
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  return (
    <div className="customer-shell flex flex-1 min-h-0 overflow-hidden bg-[#f2f2f7] text-gray-900">
      <aside
        className="hidden xl:flex w-[220px] shrink-0 flex-col px-3 pb-4"
        style={{ paddingTop: 'max(1.5rem, var(--app-sat, env(safe-area-inset-top, 0px)))' }}
      >
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center px-3 mb-4 text-[22px] font-bold tracking-tight text-gray-900 touch-manipulation"
        >
          MYXCROW
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Main">
          {DESKTOP_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isDesktopActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-3 px-3 rounded-[12px] text-[17px] touch-manipulation',
                  active
                    ? 'bg-white font-semibold text-gray-900'
                    : 'font-medium text-[rgba(60,60,67,0.7)] hover:bg-black/[0.04]'
                )}
              >
                <Icon
                  className="w-[22px] h-[22px] shrink-0"
                  strokeWidth={active ? 2.2 : 1.75}
                  fill={active ? 'currentColor' : 'none'}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="relative flex flex-col flex-1 min-h-0 min-w-0">
        <header
          className="absolute top-0 left-0 right-0 z-40"
          style={{
            paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))',
            background: compact ? 'rgba(242,242,247,0.72)' : 'transparent',
            backdropFilter: compact ? 'blur(28px) saturate(1.8)' : 'none',
            WebkitBackdropFilter: compact ? 'blur(28px) saturate(1.8)' : 'none',
            boxShadow: compact ? 'inset 0 -0.5px 0 rgba(60,60,67,0.18)' : 'none',
          }}
        >
          <div className="flex items-center min-h-[44px] px-1">
            {back ? (
              <button
                type="button"
                onClick={handleBack}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-brand-maroon touch-manipulation"
                aria-label="Go back"
              >
                <ChevronLeft className="w-7 h-7" strokeWidth={2.25} />
              </button>
            ) : (
              <div className="w-2 shrink-0" aria-hidden />
            )}
            <div className="flex-1 min-w-0 text-center px-1">
              <p
                className={cn(
                  'text-[17px] font-semibold truncate text-gray-900 transition-opacity duration-200',
                  compact ? 'opacity-100' : 'opacity-0'
                )}
              >
                {title}
              </p>
            </div>
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
              {trailing}
            </div>
          </div>
        </header>

        <div
          id="customer-scroll"
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{ paddingTop: 'calc(var(--app-sat, env(safe-area-inset-top, 0px)) + 44px)' }}
        >
          {large && (
            <h1 className="px-4 text-[34px] font-bold tracking-tight leading-[1.15] text-gray-900 pb-3">
              {title}
            </h1>
          )}
          <div className="px-4 max-w-2xl mx-auto xl:max-w-4xl">
            <ImpersonationBanner />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
