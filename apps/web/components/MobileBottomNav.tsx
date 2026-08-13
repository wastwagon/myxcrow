import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Home,
  LogIn,
  UserPlus,
  HelpCircle,
  Shield,
  Wallet,
  User,
  AlertCircle,
} from 'lucide-react';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { isCustomerAppPath } from '@/lib/app-chrome';
import { TabBar, type TabBarItem } from '@/components/ui/TabBar';

const LOGGED_OUT_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/login', label: 'Sign In', icon: LogIn },
  { href: '/register', label: 'Register', icon: UserPlus },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

const getLoggedInItems = (admin: boolean): Omit<TabBarItem, 'isActive'>[] => [
  { href: admin ? '/admin' : '/dashboard', label: 'Home', icon: Home },
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
  { href: '/profile', label: 'Account', icon: User },
];

export default function MobileBottomNav() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setAdmin(isAdmin());
  }, [router.pathname]);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    if (href === '/dashboard') return router.pathname === '/dashboard';
    if (href === '/admin')
      return router.pathname === '/admin' || router.pathname.startsWith('/admin/');
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const baseItems = authenticated ? getLoggedInItems(admin) : LOGGED_OUT_ITEMS;
  const items: TabBarItem[] = baseItems.map((item) => ({
    ...item,
    isActive: isActive(item.href),
  }));

  return <TabBar items={items} tone={isCustomerAppPath(router.pathname) ? 'ios' : 'dark'} />;
}
