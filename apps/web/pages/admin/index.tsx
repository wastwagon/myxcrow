import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { extractArrayData } from '@/lib/api-helpers';
import { ESCROW_STATUS_COLORS, ACTIVE_ESCROW_STATUSES, COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import {
  Users,
  FileText,
  AlertCircle,
  DollarSign,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowUpCircle,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  // Always call hooks in the same order - don't return early before hooks
  // Use 'enabled' option to prevent queries from running until mounted
  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<{ data?: any[]; escrows?: any[]; total?: number } | any[]>({
    queryKey: ['admin-escrows'],
    queryFn: async () => {
      const response = await apiClient.get('/escrows');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0,
    refetchInterval: 30000,
  });

  // Extract escrows array from response (handle both formats)
  const escrows: any[] = extractArrayData(escrowsData, 'escrows');

  const { data: disputesData, isLoading: disputesLoading } = useQuery<{ data?: any[]; disputes?: any[]; total?: number } | any[]>({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const response = await apiClient.get('/disputes');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
  });

  // Extract disputes array from response (handle both formats)
  const disputes: any[] = extractArrayData(disputesData, 'disputes');

  const { data: usersData, isLoading: usersLoading } = useQuery<{ data?: any[]; users?: any[]; total?: number } | any[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/users?limit=100');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
  });

  // Extract users array from response (handle both formats)
  const users: any[] = extractArrayData(usersData, 'users');

  const { data: walletsData, isLoading: walletsLoading } = useQuery<{ data?: any[]; wallets?: any[]; total?: number } | any[]>({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/admin?limit=500');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0, // Always fetch fresh data from database
    refetchInterval: 30000, // Refetch every 30s when dashboard is visible
  });

  // Extract wallets array from response (handle both formats)
  const wallets: any[] = extractArrayData(walletsData, 'wallets');

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const stats = {
    totalEscrows: escrows.length || 0,
    activeEscrows: escrows.filter((e: any) => !COMPLETED_ESCROW_STATUSES.includes(e.status)).length || 0,
    fundedEscrows: escrows.filter((e: any) => e.status === 'FUNDED').length || 0,
    openDisputes: disputes.filter((d: any) => d.status === 'OPEN').length || 0,
    totalValue: escrows.reduce((sum: number, e: any) => sum + e.amountCents, 0) || 0,
    totalUsers: users.length || 0,
    activeUsers: users.filter((u: any) => u.isActive).length || 0,
    totalWalletBalance: wallets.reduce(
      (sum: number, w: any) => sum + (w.availableCents || 0),
      0,
    ) || 0,
  };

  const recentEscrows = escrows.slice(0, 5);
  const recentDisputes = disputes.filter((d: any) => d.status === 'OPEN').slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Admin Dashboard"
          subtitle="Platform overview and management"
          icon={<Settings className="w-6 h-6 text-white" />}
          gradient="purple"
          action={
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 font-medium shadow-lg transition-all border border-white/30"
            >
              <Users className="w-4 h-4 inline mr-2" />
              Manage Users
            </Link>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 opacity-90" />
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Escrows</h3>
            <p className="text-3xl font-bold">{stats.totalEscrows}</p>
            <p className="text-sm opacity-75 mt-2">{stats.activeEscrows} active</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 opacity-90" />
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Value</h3>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalValue, 'GHS')}</p>
            <p className="text-sm opacity-75 mt-2">{stats.fundedEscrows} funded</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-8 h-8 opacity-90" />
              <Clock className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Open Disputes</h3>
            <p className="text-3xl font-bold">{stats.openDisputes}</p>
            <p className="text-sm opacity-75 mt-2">Requires attention</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-90" />
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Users</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm opacity-75 mt-2">{stats.activeUsers} active</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Active Escrows</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeEscrows}</p>
            <p className="text-xs text-gray-500 mt-1">In progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Wallet Balance</h3>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalWalletBalance, 'GHS')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all users</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Funded Escrows</h3>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.fundedEscrows}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting completion</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/wallet/credit"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Credit Wallet</h3>
                  <p className="text-sm text-gray-600">Add funds to user wallet</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/wallet/debit"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-red-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Debit Wallet</h3>
                  <p className="text-sm text-gray-600">Deduct funds from wallet</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">View and manage users</p>
                </div>
              </div>
            </Link>

            <Link
              href="/disputes"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Manage Disputes</h3>
                  <p className="text-sm text-gray-600">Resolve conflicts</p>
                </div>
              </div>
            </Link>

            <Link
              href="/escrows"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">All Escrows</h3>
                  <p className="text-sm text-gray-600">View all agreements</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Withdrawals</h3>
                  <p className="text-sm text-gray-600">Approve/deny requests</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-gray-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">Platform configuration</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Escrows */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Escrows</h2>
                <Link
                  href="/escrows"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {escrowsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentEscrows.length > 0 ? (
                <div className="space-y-4">
                  {recentEscrows.map((escrow: any) => (
                    <Link
                      key={escrow.id}
                      href={`/escrows/${escrow.id}`}
                      className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {escrow.description || 'Escrow Agreement'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatCurrency(escrow.amountCents, 'GHS')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            ESCROW_STATUS_COLORS[escrow.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {escrow.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No escrows yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Disputes */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Open Disputes</h2>
                <Link
                  href="/disputes"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {disputesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentDisputes.length > 0 ? (
                <div className="space-y-4">
                  {recentDisputes.map((dispute: any) => (
                    <Link
                      key={dispute.id}
                      href={`/disputes/${dispute.id}`}
                      className="block p-4 border-2 border-orange-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Dispute #{dispute.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {dispute.reason} • {dispute.escrowId.slice(0, 8)}
                          </p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>No open disputes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
