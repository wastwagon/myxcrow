import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, User, Settings, Users as UsersIcon, DollarSign, BarChart3, ChevronDown, LayoutDashboard, KeyRound } from 'lucide-react';
import { isAuthenticated, getUser, clearAuth, isAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/platforms', label: 'Partner APIs', icon: KeyRound },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: DollarSign },
  { href: '/admin/reconciliation', label: 'Reconciliation', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const navLinkClass = (active: boolean) =>
  cn(
    'inline-flex min-h-[44px] items-center px-4 rounded-ios-lg font-semibold transition-all touch-manipulation',
    active
      ? 'bg-brand-gold text-brand-maroon-black shadow-sm'
      : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
  );

export default function Navigation() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [router.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };
    if (adminDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [adminDropdownOpen]);

  const handleLogout = () => {
    clearAuth();
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

  return (
    <nav className="hidden xl:block sticky top-0 z-50 bg-[var(--app-chrome-bg)] border-b border-white/10 shadow-tab-bar pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href={admin ? '/admin' : '/dashboard'} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden bg-brand-maroon-deep ring-1 ring-brand-gold/35">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-label-primary group-hover:text-brand-gold transition-colors">
              MYXCROW
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {!admin && (
              <Link href="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
                Dashboard
              </Link>
            )}
            <Link href="/escrows" className={navLinkClass(isActive('/escrows'))}>
              Escrows
            </Link>
            <Link href="/wallet" className={navLinkClass(isActive('/wallet'))}>
              Wallet
            </Link>
            <Link href="/disputes" className={navLinkClass(isActive('/disputes'))}>
              Disputes
            </Link>

            {admin && (
              <div className="relative flex items-center" ref={adminDropdownRef}>
                <div className="h-6 w-px bg-white/15 mx-2" />
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={cn(navLinkClass(router.pathname.startsWith('/admin')), 'gap-2')}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Admin</span>
                  <ChevronDown
                    className={cn('w-4 h-4 shrink-0 transition-transform', adminDropdownOpen && 'rotate-180')}
                  />
                </button>
                {adminDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 py-2 w-56 rounded-ios-xl border border-white/15 bg-[#261819] shadow-ios-card z-50">
                    {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAdminDropdownOpen(false)}
                        className={cn(
                          'flex min-h-[44px] items-center gap-2 px-4 text-sm font-medium transition-colors',
                          isActive(href)
                            ? 'bg-brand-gold/15 text-brand-gold'
                            : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 min-w-0">
            <Link
              href="/profile"
              className="inline-flex min-h-[44px] items-center gap-2 px-3 text-sm font-medium text-label-secondary hover:bg-white/10 hover:text-label-primary rounded-ios-lg transition-colors min-w-0"
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline max-w-[150px] truncate">{user?.email || 'User'}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[44px] items-center gap-2 px-3 xl:px-4 text-sm font-medium text-label-secondary hover:bg-red-500/15 hover:text-red-300 rounded-ios-lg transition-colors touch-manipulation"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
