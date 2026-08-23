import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Home,
  LogIn,
  UserPlus,
  HelpCircle,
  Shield,
  Wallet,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { isCustomerMorePath } from '@/lib/app-chrome';
import { isAuthenticated } from '@/lib/auth';
import { TabBar, type TabBarItem } from '@/components/ui/TabBar';

const LOGGED_OUT_ITEMS: Omit<TabBarItem, 'isActive'>[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/login', label: 'Sign In', icon: LogIn },
  { href: '/register', label: 'Register', icon: UserPlus },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

const getLoggedInItems = (): Omit<TabBarItem, 'isActive'>[] => [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/escrows/new', label: 'New', icon: Plus, raised: true },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'More', icon: MoreHorizontal },
];

function pathIsActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/');
  if (href === '/escrows/new') return pathname === '/escrows/new';
  if (href === '/escrows') {
    return (
      pathname === '/escrows' ||
      (pathname.startsWith('/escrows/') && pathname !== '/escrows/new')
    );
  }
  if (href === '/profile') return isCustomerMorePath(pathname);
  if (href === '/support') {
    return pathname === '/support' || pathname === '/terms' || pathname === '/privacy';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
  }, [router.pathname]);

  if (!mounted) return null;

  const baseItems = authenticated ? getLoggedInItems() : LOGGED_OUT_ITEMS;
  const items: TabBarItem[] = baseItems.map((item) => ({
    ...item,
    isActive: pathIsActive(router.pathname, item.href),
  }));

  return <TabBar items={items} tone={router.pathname === '/' ? 'dark' : 'ios'} />;
}
