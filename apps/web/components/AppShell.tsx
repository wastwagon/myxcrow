import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAuthenticated } from '@/lib/auth';
import { isCustomerAppPath } from '@/lib/app-chrome';
import { cn } from '@/lib/utils';

const PremiumFooter = dynamic(() => import('@/components/PremiumFooter'));
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false });

/** Routes that use the authenticated app chrome (tab bar, no marketing footer). */
const APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/escrows',
  '/wallet',
  '/disputes',
  '/profile',
  '/kyc',
  '/change-password',
  '/admin',
  '/payments',
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
  }, [router.pathname]);

  const onAppRoute = isAppRoute(router.pathname);
  const showTabBar = mounted && authenticated && onAppRoute;
  const showFooter = mounted && router.pathname === '/';
  const customerShell = mounted && authenticated && isCustomerAppPath(router.pathname);

  return (
    <>
      <div
        className={cn(
            customerShell
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden'
            : showTabBar
              ? 'min-h-screen flex flex-col pb-tab-bar xl:pb-0'
              : 'min-h-screen flex flex-col'
        )}
      >
        <div className={customerShell ? 'flex-1 min-h-0' : 'flex-1'}>{children}</div>
        {showFooter && <PremiumFooter />}
      </div>
      {showTabBar && <MobileBottomNav />}
    </>
  );
}
