import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAuthenticated } from '@/lib/auth';
import { isCustomerAppPath } from '@/lib/app-chrome';
import { cn } from '@/lib/utils';

const PremiumFooter = dynamic(() => import('@/components/PremiumFooter'));
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false });

/** Focused payment flow — no tab bar so the keypad / Paystack redirect stays unobstructed. */
function hideTabBar(pathname: string): boolean {
  return pathname.startsWith('/partner/checkout');
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

  const showTabBar = mounted && !hideTabBar(router.pathname);
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
        <div className={customerShell ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'flex-1'}>
          {children}
        </div>
        {showFooter && <PremiumFooter />}
      </div>
      {showTabBar && <MobileBottomNav />}
    </>
  );
}
