import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FileText, Wallet, LogOut, User, Menu, X, Settings, Users as UsersIcon, DollarSign, AlertCircle, BarChart3, CreditCard } from 'lucide-react';
import { isAuthenticated, getUser, clearAuth, isAdmin } from '@/lib/auth';

export default function Navigation() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [router.pathname]);

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
                <Image src="/logo/website-logo.gif" alt="MYXCROW" width={40} height={40} className="object-contain" unoptimized />
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

            {/* Admin Menu Items */}
            {admin && (
              <>
                <div className="h-6 w-px bg-white/30 mx-2" />
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin') && !router.pathname.startsWith('/admin/')
                      ? 'bg-brand-maroon text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/users')
                      ? 'bg-brand-maroon text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Users
                </Link>
                <Link
                  href="/admin/kyc-review"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/kyc-review')
                      ? 'bg-brand-maroon-rust text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  KYC
                </Link>
                <Link
                  href="/admin/withdrawals"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/withdrawals')
                      ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Withdrawals
                </Link>
                <Link
                  href="/admin/reconciliation"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/reconciliation')
                      ? 'bg-brand-maroon-dark text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Reconciliation
                </Link>
                <Link
                  href="/admin/fees"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/fees')
                      ? 'bg-brand-gold text-brand-maroon-black shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Fees
                </Link>
                <Link
                  href="/admin/settings"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/settings')
                      ? 'bg-brand-maroon-darker text-white shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </>
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1">
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
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin') && !router.pathname.startsWith('/admin/')
                      ? 'bg-brand-maroon text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/users')
                      ? 'bg-brand-maroon text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/kyc-review"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/kyc-review')
                      ? 'bg-brand-maroon-rust text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  KYC Review
                </Link>
                <Link
                  href="/admin/withdrawals"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/withdrawals')
                      ? 'bg-brand-gold text-brand-maroon-black'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Withdrawals
                </Link>
                <Link
                  href="/admin/reconciliation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/reconciliation')
                      ? 'bg-brand-maroon-dark text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Reconciliation
                </Link>
                <Link
                  href="/admin/fees"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/fees')
                      ? 'bg-brand-gold text-brand-maroon-black'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Fees
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/settings')
                      ? 'bg-brand-maroon-darker text-white'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  Settings
                </Link>
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
