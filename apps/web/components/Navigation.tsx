import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LogOut,
  User,
  Settings,
  Users as UsersIcon,
  DollarSign,
  BarChart3,
  LayoutDashboard,
  KeyRound,
  Shield,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { isAuthenticated, getUser, logout, isAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { isAdminAppPath } from '@/lib/app-chrome';
import { useConfirm } from '@/components/providers/UIProvider';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Home', icon: LayoutDashboard },
  { href: '/admin/platforms', label: 'Partner APIs', icon: KeyRound },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: DollarSign },
  { href: '/admin/reconciliation', label: 'Reconciliation', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const APP_LINKS = [
  { href: '/escrows', label: 'Escrows', icon: Shield },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
];

export default function Navigation() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [admin, setAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [router.pathname]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of this account?',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;
    await logout();
    router.push('/login');
  };

  if (!mounted || !authenticated) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/admin') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  const light = isAdminAppPath(router.pathname);
  if (!light) return null;

  const sideLink = (href: string, label: string, Icon: typeof LayoutDashboard) => {
    const active = isActive(href);
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
    <aside
      className="hidden xl:flex w-[240px] shrink-0 flex-col sticky top-0 h-screen px-3 pb-4"
      style={{ paddingTop: 'max(1.5rem, var(--app-sat, env(safe-area-inset-top, 0px)))' }}
      aria-label="Admin"
    >
      <Link href="/admin" className="inline-flex min-h-[44px] items-center px-3 mb-4 text-[22px] font-bold tracking-tight text-gray-900">
        MYXCROW
      </Link>

      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
        <p className="px-3 pt-1 pb-1.5 text-[13px] text-[rgba(60,60,67,0.6)]">Admin</p>
        {ADMIN_LINKS.map(({ href, label, icon }) => sideLink(href, label, icon))}
        {admin && (
          <>
            <p className="px-3 pt-5 pb-1.5 text-[13px] text-[rgba(60,60,67,0.6)]">App</p>
            {APP_LINKS.map(({ href, label, icon }) => sideLink(href, label, icon))}
          </>
        )}
      </nav>

      <div className="flex flex-col gap-0.5 pt-3">
        <Link
          href="/profile"
          className="inline-flex min-h-[44px] items-center gap-3 px-3 rounded-[16px] text-[17px] font-medium text-[rgba(60,60,67,0.7)] hover:bg-black/[0.04]"
        >
          <User className="w-[22px] h-[22px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{user?.email || 'Account'}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex min-h-[44px] items-center gap-3 px-3 rounded-[16px] text-[17px] font-medium text-[#ff3b30] hover:bg-red-50 touch-manipulation"
        >
          <LogOut className="w-[22px] h-[22px] shrink-0" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
