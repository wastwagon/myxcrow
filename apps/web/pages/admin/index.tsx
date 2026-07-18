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
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { AdminIconBadge } from '@/components/admin/AdminIconBadge';
import { admin } from '@/components/admin/adminClasses';
import { buildAdminTopUpReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';

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
      <PullToRefresh onRefresh={refreshAdmin} disabled={!isMobile} className="space-y-5">
        {/* Header */}
        <PageHeader
          eyebrow="Admin"
          title="Admin Dashboard"
          subtitle="Platform overview and management"
          icon={<Settings className="w-6 h-6" />}
          action={
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-maroon-black rounded-lg hover:bg-brand-gold/90 font-semibold shadow-sm transition-all"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </Link>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
            <h2 className={admin.sectionTitle}>Last 24 Hours</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div>
          <h2 className={admin.sectionTitle}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/wallet/credit" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="emerald" className="group-hover:scale-105 transition-transform shrink-0">
                  <DollarSign />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Credit Wallet</h3>
                  <p className="text-sm text-white/65">Add funds to user wallet</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/wallet/debit" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="destructive" className="group-hover:scale-105 transition-transform shrink-0">
                  <DollarSign />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Debit Wallet</h3>
                  <p className="text-sm text-white/65">Deduct funds from wallet</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="maroon" className="group-hover:scale-105 transition-transform shrink-0">
                  <Users />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">User Management</h3>
                  <p className="text-sm text-white/65">View and manage users</p>
                </div>
              </div>
            </Link>

            <Link href="/disputes" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="amber" className="group-hover:scale-105 transition-transform shrink-0">
                  <AlertCircle />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Manage Disputes</h3>
                  <p className="text-sm text-white/65">Resolve conflicts</p>
                </div>
              </div>
            </Link>

            <Link href="/escrows" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="gold" className="group-hover:scale-105 transition-transform shrink-0">
                  <FileText />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">All Escrows</h3>
                  <p className="text-sm text-white/65">View all agreements</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/withdrawals" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="gold" className="group-hover:scale-105 transition-transform shrink-0">
                  <ArrowUpCircle />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Withdrawals</h3>
                  <p className="text-sm text-white/65">Approve/deny requests</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/settings" className={admin.actionCard}>
              <div className="flex items-center gap-3">
                <AdminIconBadge variant="muted" className="group-hover:scale-105 transition-transform shrink-0">
                  <Settings />
                </AdminIconBadge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Settings</h3>
                  <p className="text-sm text-white/65">Platform configuration</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Top-ups */}
          {statsData?.recentTransactions && statsData.recentTransactions.length > 0 && (
            <div className={admin.panel}>
              <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-base font-semibold text-white">Recent Top-ups</h2>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {statsData.recentTransactions.slice(0, 8).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{formatCurrency(tx.amountCents, 'GHS')}</p>
                        <p className="text-xs text-white/55 truncate">{tx.userEmail || '—'} • {new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PrintReceiptButton
                          receipt={buildAdminTopUpReceipt(tx)}
                          iconOnly
                          variant="plain"
                          size="sm"
                          label="Print receipt"
                        />
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Escrows */}
          <div className={admin.panel}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Recent Escrows</h2>
              <Link href="/escrows" className={admin.linkAccent}>
                View all →
              </Link>
            </div>
            <div className="p-4">
              {escrowsLoading ? (
                <div className="space-y-4">
                  <ListRowsSkeleton rows={3} rowClassName="h-16" />
                </div>
              ) : recentEscrows.length > 0 ? (
                <div className="space-y-2">
                  {recentEscrows.map((escrow: any) => (
                    <Link
                      key={escrow.id}
                      href={`/escrows/${escrow.id}`}
                      className="block p-3 border border-white/10 rounded-ios-lg hover:border-brand-gold/35 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">
                            {escrow.description || 'Escrow Agreement'}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5">
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
          <div className={admin.panel}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Open Disputes</h2>
              <Link href="/disputes" className={admin.linkAccent}>
                View all →
              </Link>
            </div>
            <div className="p-4">
              {disputesLoading ? (
                <div className="space-y-3">
                  <ListRowsSkeleton rows={3} rowClassName="h-14" />
                </div>
              ) : recentDisputes.length > 0 ? (
                <div className="space-y-2">
                  {recentDisputes.map((dispute: any) => (
                    <Link
                      key={dispute.id}
                      href={`/disputes/${dispute.id}`}
                      className="block p-3 border border-amber-500/35 rounded-ios-lg hover:border-amber-500/55 hover:bg-amber-500/10 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm">Dispute #{dispute.id.slice(0, 8)}</p>
                          <p className="text-xs text-white/60 mt-0.5 truncate">
                            {dispute.reason} • {dispute.escrowId.slice(0, 8)}
                          </p>
                        </div>
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-white/55">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">No open disputes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
