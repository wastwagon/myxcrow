import { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const DESKTOP_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/escrows', label: 'Escrows' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/profile', label: 'Account' },
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
    <div className="customer-shell flex flex-col flex-1 min-h-0 bg-[#f2f2f7] text-gray-900">
      <nav
        className="hidden xl:flex shrink-0 items-center gap-1 px-4 h-12 bg-[#f2f2f7]"
        style={{ boxShadow: 'inset 0 -0.5px 0 rgba(60,60,67,0.29)' }}
        aria-label="Main"
      >
        {DESKTOP_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'inline-flex min-h-[44px] items-center px-3 rounded-[10px] text-[15px] font-semibold touch-manipulation',
              isDesktopActive(link.href)
                ? 'text-brand-maroon'
                : 'text-[rgba(60,60,67,0.6)] hover:text-gray-900'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <header
        className="shrink-0 bg-[#f2f2f7] z-40"
        style={{ paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))' }}
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
      >
        {large && (
          <h1 className="px-4 text-[34px] font-bold tracking-tight leading-[1.15] text-gray-900 pb-3">
            {title}
          </h1>
        )}
        <div className="px-4 max-w-2xl mx-auto xl:max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
