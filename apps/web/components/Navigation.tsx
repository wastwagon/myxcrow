import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Wallet, LogOut, User, Shield, Menu, X, Settings, Users as UsersIcon, DollarSign, AlertCircle, BarChart3, CreditCard } from 'lucide-react';
import { isAuthenticated, getUser, clearAuth, isAdmin } from '@/lib/auth';

export default function Navigation() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [admin, setAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUser(getUser());
    setAdmin(isAdmin());
  }, [router.pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

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
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href={admin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                MYXCROW
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* User Menu Items */}
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/escrows"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/escrows')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Escrows
            </Link>
            <Link
              href="/wallet"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/wallet')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Wallet
            </Link>
            <Link
              href="/disputes"
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isActive('/disputes')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Disputes
            </Link>

            {/* Admin Menu Items */}
            {admin && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin') && !router.pathname.startsWith('/admin/')
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/users')
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Users
                </Link>
                <Link
                  href="/admin/kyc-review"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/kyc-review')
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  KYC
                </Link>
                <Link
                  href="/admin/withdrawals"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/withdrawals')
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Withdrawals
                </Link>
                <Link
                  href="/admin/reconciliation"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/reconciliation')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Reconciliation
                </Link>
                <Link
                  href="/admin/settings"
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive('/admin/settings')
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
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
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="max-w-[150px] truncate">{user?.email || 'User'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/escrows"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/escrows')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Escrows
            </Link>
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/wallet')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Wallet
            </Link>
            <Link
              href="/disputes"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                isActive('/disputes')
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Disputes
            </Link>
            {admin && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin') && !router.pathname.startsWith('/admin/')
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/users')
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/kyc-review"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/kyc-review')
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  KYC Review
                </Link>
                <Link
                  href="/admin/withdrawals"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/withdrawals')
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Withdrawals
                </Link>
                <Link
                  href="/admin/reconciliation"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/reconciliation')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Reconciliation
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive('/admin/settings')
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
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
