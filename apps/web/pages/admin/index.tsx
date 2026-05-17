import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { MetricCard } from '@/components/ui/MetricCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { AdminIconBadge } from '@/components/admin/AdminIconBadge';

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
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

  const { data: statsData } = useQuery<{
    last24Hours?: {
      topUpAmountCents?: number;
      topUpCount?: number;
      escrowsCreated?: number;
      escrowValueCents?: number;
      feesRevenueCents?: number;
    };
    totals?: { walletBalanceCents?: number };
    recentTransactions?: any[];
    recentEscrows?: any[];
  }>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0,
    refetchInterval: 30000,
  });

  // Extract wallets array from response (handle both formats)
  const wallets: any[] = extractArrayData(walletsData, 'wallets');

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
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

  const refreshAdmin = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-escrows'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshAdmin} disabled={!isMobile} className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Admin Dashboard"
          subtitle="Platform overview and management"
          icon={<Settings className="w-6 h-6" />}
          action={
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-brand-maroon text-white rounded-lg hover:bg-brand-maroon-dark font-medium shadow-sm transition-all"
            >
              <Users className="w-4 h-4 inline mr-2" />
              Manage Users
            </Link>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total escrows"
            value={stats.totalEscrows}
            hint={`${stats.activeEscrows} active`}
            icon={<FileText className="w-5 h-5" />}
            accent="maroon"
          />
          <MetricCard
            label="Total value"
            value={formatCurrency(stats.totalValue, 'GHS')}
            hint={`${stats.fundedEscrows} funded`}
            icon={<DollarSign className="w-5 h-5" />}
            accent="emerald"
          />
          <MetricCard
            label="Open disputes"
            value={stats.openDisputes}
            hint="Requires attention"
            icon={<AlertCircle className="w-5 h-5" />}
            accent="amber"
          />
          <MetricCard
            label="Total users"
            value={stats.totalUsers}
            hint={`${stats.activeUsers} active`}
            icon={<Users className="w-5 h-5" />}
            accent="gold"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Active escrows"
            value={stats.activeEscrows}
            hint="In progress"
            icon={<CheckCircle className="w-5 h-5" />}
            accent="emerald"
          />
          <MetricCard
            label="Total wallet balance"
            value={formatCurrency(stats.totalWalletBalance, 'GHS')}
            hint="Across all users"
            icon={<Wallet className="w-5 h-5" />}
            accent="gold"
          />
          <MetricCard
            label="Funded escrows"
            value={stats.fundedEscrows}
            hint="Awaiting completion"
            icon={<DollarSign className="w-5 h-5" />}
            accent="amber"
          />
        </div>

        {/* Last 24 Hours Stats */}
        {statsData && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Last 24 Hours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 border-l-4 border-emerald-500">
                <h3 className="text-xs font-semibold text-white/55 uppercase">Wallet Top-ups</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrency(statsData.last24Hours?.topUpAmountCents ?? 0, 'GHS')}
                </p>
                <p className="text-xs text-white/55 mt-1">{statsData.last24Hours?.topUpCount ?? 0} transactions</p>
              </div>
              <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 border-l-4 border-blue-500">
                <h3 className="text-xs font-semibold text-white/55 uppercase">Escrows Created</h3>
                <p className="text-xl font-bold text-white mt-1">{statsData.last24Hours?.escrowsCreated ?? 0}</p>
                <p className="text-xs text-white/55 mt-1">
                  {formatCurrency(statsData.last24Hours?.escrowValueCents ?? 0, 'GHS')} value
                </p>
              </div>
              <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 border-l-4 border-amber-500">
                <h3 className="text-xs font-semibold text-white/55 uppercase">System Earnings</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrency(statsData.last24Hours?.feesRevenueCents ?? 0, 'GHS')}
                </p>
                <p className="text-xs text-white/55 mt-1">Fees last 24h</p>
              </div>
              <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 border-l-4 border-purple-500">
                <h3 className="text-xs font-semibold text-white/55 uppercase">Total Wallet Balance</h3>
                <p className="text-xl font-bold text-white mt-1">
                  {formatCurrency(statsData.totals?.walletBalanceCents ?? 0, 'GHS')}
                </p>
                <p className="text-xs text-white/55 mt-1">Across all users</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/wallet/credit"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="emerald" className="group-hover:scale-110 transition-transform">
                  <DollarSign />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Credit Wallet</h3>
                  <p className="text-sm text-white/70">Add funds to user wallet</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/wallet/debit"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-red-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="destructive" className="group-hover:scale-110 transition-transform">
                  <DollarSign />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Debit Wallet</h3>
                  <p className="text-sm text-white/70">Deduct funds from wallet</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="maroon" className="group-hover:scale-110 transition-transform">
                  <Users />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">User Management</h3>
                  <p className="text-sm text-white/70">View and manage users</p>
                </div>
              </div>
            </Link>

            <Link
              href="/disputes"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="amber" className="group-hover:scale-110 transition-transform">
                  <AlertCircle />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Manage Disputes</h3>
                  <p className="text-sm text-white/70">Resolve conflicts</p>
                </div>
              </div>
            </Link>

            <Link
              href="/escrows"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="gold" className="group-hover:scale-110 transition-transform">
                  <FileText />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">All Escrows</h3>
                  <p className="text-sm text-white/70">View all agreements</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-200 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="gold" className="group-hover:scale-110 transition-transform">
                  <ArrowUpCircle />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Withdrawals</h3>
                  <p className="text-sm text-white/70">Approve/deny requests</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-white/10 group"
            >
              <div className="flex items-center gap-4">
                <AdminIconBadge variant="muted" className="group-hover:scale-110 transition-transform">
                  <Settings />
                </AdminIconBadge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Settings</h3>
                  <p className="text-sm text-white/70">Platform configuration</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Top-ups */}
          {statsData?.recentTransactions && statsData.recentTransactions.length > 0 && (
            <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Recent Top-ups</h2>
                </div>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {statsData.recentTransactions.slice(0, 8).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                      <div>
                        <p className="font-medium text-white">{formatCurrency(tx.amountCents, 'GHS')}</p>
                        <p className="text-xs text-white/55">{tx.userEmail || '—'} • {new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          tx.status === 'SUCCEEDED'
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                            : 'bg-white/10 text-white/70 border-white/15'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Escrows */}
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Recent Escrows</h2>
                <Link
                  href="/escrows"
                  className="text-brand-gold hover:text-brand-gold/80 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {escrowsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/10 animate-pulse rounded-ios-lg" />
                  ))}
                </div>
              ) : recentEscrows.length > 0 ? (
                <div className="space-y-4">
                  {recentEscrows.map((escrow: any) => (
                    <Link
                      key={escrow.id}
                      href={`/escrows/${escrow.id}`}
                      className="block p-4 border border-white/10 rounded-ios-lg hover:border-brand-gold/35 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {escrow.description || 'Escrow Agreement'}
                          </p>
                          <p className="text-sm text-white/70 mt-1">
                            {formatCurrency(escrow.amountCents, 'GHS')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            ESCROW_STATUS_COLORS[escrow.status] || 'bg-white/10 text-white/80 border-white/15'
                          }`}
                        >
                          {escrow.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/55">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-white/50" />
                  <p>No escrows yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Disputes */}
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Open Disputes</h2>
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
                    <div key={i} className="h-16 bg-white/10 animate-pulse rounded-ios-lg" />
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
                          <p className="font-medium text-white">Dispute #{dispute.id.slice(0, 8)}</p>
                          <p className="text-sm text-white/70 mt-1">
                            {dispute.reason} • {dispute.escrowId.slice(0, 8)}
                          </p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/55">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p>No open disputes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
