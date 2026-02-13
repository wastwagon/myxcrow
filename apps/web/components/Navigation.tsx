import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Wallet, LogOut, User, Menu, X, Settings, Users as UsersIcon, DollarSign, AlertCircle, BarChart3, CreditCard, ChevronDown, LayoutDashboard } from 'lucide-react';
import { isAuthenticated, getUser, clearAuth, isAdmin } from '@/lib/auth';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/kyc-review', label: 'KYC', icon: CreditCard },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: DollarSign },
  { href: '/admin/reconciliation', label: 'Reconciliation', icon: BarChart3 },
  { href: '/admin/fees', label: 'Fees', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [router.pathname]);

  // Close admin dropdown when clicking outside
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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!authenticated) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/admin') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#160f10] shadow-lg border-b border-brand-gold/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href={admin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden bg-brand-maroon-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/website-logo.gif" alt="MYXCROW" width={40} height={40} className="object-contain" />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-brand-gold transition-colors hidden sm:block">
                MYXCROW
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* User Menu Items */}
            {/* Hide Dashboard link for admins - they use Admin Dashboard instead */}
            {!admin && (
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                    : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/escrows"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/escrows')
                  ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
              }`}
            >
              Escrows
            </Link>
            <Link
              href="/wallet"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/wallet')
                  ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
              }`}
            >
              Wallet
            </Link>
            {!admin && (
              <Link
                href="/kyc"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/kyc')
                    ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                    : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                }`}
              >
                KYC
              </Link>
            )}
            <Link
              href="/disputes"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/disputes')
                  ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
              }`}
            >
              Disputes
            </Link>

            {/* Admin dropdown: one control, all admin links inside */}
            {admin && (
              <div className="relative flex items-center" ref={adminDropdownRef}>
                <div className="h-6 w-px bg-white/30 mx-2" />
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    router.pathname.startsWith('/admin')
                      ? 'bg-brand-maroon text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Admin</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {adminDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 py-2 w-56 bg-[#1f1414] border border-brand-gold/30 rounded-xl shadow-xl z-50">
                    {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAdminDropdownOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 ${
                          isActive(href) ? 'bg-brand-gold/20 text-brand-gold' : 'text-white/90 hover:text-brand-gold'
                        }`}
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

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-brand-gold rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="max-w-[150px] truncate">{user?.email || 'User'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - scrollable so all items (including admin) are visible */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
            {/* Hide Dashboard link for admins - they use Admin Dashboard instead */}
            {!admin && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-brand-gold text-brand-maroon-black'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/escrows"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/escrows')
                  ? 'bg-brand-gold text-brand-maroon-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              Escrows
            </Link>
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/wallet')
                  ? 'bg-brand-gold text-brand-maroon-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              Wallet
            </Link>
            {!admin && (
              <Link
                href="/kyc"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/kyc')
                    ? 'bg-brand-gold text-brand-maroon-black'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                KYC
              </Link>
            )}
            <Link
              href="/disputes"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/disputes')
                  ? 'bg-brand-gold text-brand-maroon-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              Disputes
            </Link>
            {admin && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-brand-gold uppercase tracking-wider">
                  Admin
                </div>
                {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive(href) ? 'bg-brand-maroon text-white' : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </>
            )}
            <div className="border-t border-white/10 pt-2 mt-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg font-medium"
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-lg font-medium"
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
