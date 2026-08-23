import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CircleHelp,
  Home,
  LayoutDashboard,
  LogOut,
  Plus,
  Scale,
  Shield,
  User,
  Wallet,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/BrandMark';
import { useConfirm } from '@/components/providers/UIProvider';
import { isAdmin, logout } from '@/lib/auth';
import { isCustomerAccountPath, isCustomerHelpPath } from '@/lib/app-chrome';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';

type DesktopLink = {
  href: string;
  label: string;
  icon: typeof Home;
};

const PRIMARY_LINKS: DesktopLink[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/disputes', label: 'Disputes', icon: Scale },
];

const SECONDARY_LINKS: DesktopLink[] = [
  { href: '/profile', label: 'Account', icon: User },
  { href: '/help', label: 'Help', icon: CircleHelp },
];

interface CustomerLayoutProps {
  title: string;
  trailing?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  children: ReactNode;
  /** Full-bleed maroon chrome (Home, Escrows hub, and back pages). */
  variant?: 'page' | 'home' | 'hub';
}

export default function CustomerLayout({
  title,
  trailing,
  back,
  onBack,
  children,
  variant = 'page',
}: CustomerLayoutProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const maroonChrome = variant === 'home' || variant === 'hub' || !!back;
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('customer-app');
    if (maroonChrome) document.documentElement.classList.add('customer-home');
    return () => {
      document.documentElement.classList.remove('customer-app');
      document.documentElement.classList.remove('customer-home');
    };
  }, [maroonChrome]);

  useEffect(() => {
    setAdmin(isAdmin());
  }, [router.pathname]);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const isDesktopActive = (href: string) => {
    if (href === '/dashboard') return router.pathname === '/dashboard';
    if (href === '/escrows') {
      return (
        router.pathname === '/escrows' ||
        (router.pathname.startsWith('/escrows/') && router.pathname !== '/escrows/new')
      );
    }
    if (href === '/disputes') {
      return router.pathname === '/disputes' || router.pathname.startsWith('/disputes/');
    }
    if (href === '/profile') return isCustomerAccountPath(router.pathname);
    if (href === '/help') return isCustomerHelpPath(router.pathname);
    if (href === '/admin') {
      return router.pathname === '/admin' || router.pathname.startsWith('/admin/');
    }
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of this account?',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  const navLink = ({ href, label, icon: Icon }: DesktopLink) => {
    const active = isDesktopActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'inline-flex min-h-[44px] items-center gap-3 px-3 rounded-[16px] text-[17px] touch-manipulation',
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
        {label}
      </Link>
    );
  };

  return (
    <div className="customer-shell flex flex-1 min-h-0 overflow-hidden bg-[#f2f2f7] text-gray-900">
      <aside
        className="hidden xl:flex w-[232px] shrink-0 flex-col px-3 pb-4"
        style={{ paddingTop: 'max(1.5rem, var(--app-sat, env(safe-area-inset-top, 0px)))' }}
      >
        <div className="px-1 mb-4">
          <BrandMark href="/dashboard" tone="light" />
        </div>
        <Link
          href="/escrows/new"
          className="mx-cta mb-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[16px] bg-brand-maroon px-3 text-[15px] font-semibold touch-manipulation"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} />
          New escrow
        </Link>
        <nav className="flex flex-col gap-0.5 overflow-y-auto" aria-label="Main">
          {PRIMARY_LINKS.map(navLink)}
          <div className="mt-3 flex flex-col gap-0.5">
            {SECONDARY_LINKS.map(navLink)}
            {admin && navLink({ href: '/admin', label: 'Admin', icon: LayoutDashboard })}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center gap-3 px-3 rounded-[16px] text-[17px] font-medium text-[#ff3b30] hover:bg-red-50 touch-manipulation"
            >
              <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        </nav>
      </aside>

      <div className="relative flex flex-col flex-1 min-h-0 min-w-0">
        <div
          id="customer-scroll"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        >
          {back ? (
            <>
              <CustomerShellChrome
                leading="back"
                onLeadingClick={handleBack}
                pageTitle={title}
                trailing={
                  trailing ? (
                    <div className="[&_button]:text-brand-gold [&_a]:text-brand-gold">{trailing}</div>
                  ) : undefined
                }
              />
              <div className={SHELL_CONTENT_CLASS}>{children}</div>
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
