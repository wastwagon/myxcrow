import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  LogIn,
  UserPlus,
  HelpCircle,
  Shield,
  Wallet,
  User,
} from 'lucide-react';
import { isAuthenticated, isAdmin } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const LOGGED_OUT_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/login', label: 'Sign In', icon: LogIn },
  { href: '/register', label: 'Register', icon: UserPlus },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

const getLoggedInItems = (admin: boolean): NavItem[] => [
  { href: admin ? '/admin' : '/dashboard', label: 'Home', icon: Home },
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User },
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

  const items = authenticated ? getLoggedInItems(admin) : LOGGED_OUT_ITEMS;

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    if (href === '/dashboard') return router.pathname === '/dashboard';
    if (href === '/admin') return router.pathname === '/admin' || router.pathname.startsWith('/admin/');
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 transition-colors ${
                active
                  ? 'text-brand-maroon'
                  : 'text-gray-500 hover:text-brand-maroon'
              }`}
            >
              <Icon
                className="flex-shrink-0"
                size={22}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
