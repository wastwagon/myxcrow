import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { extractArrayData } from '@/lib/api-helpers';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import {
  Users,
  FileText,
  AlertCircle,
  DollarSign,
  Settings,
  CheckCircle,
  Wallet,
  ArrowUpCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { dash } from '@/components/dashboard/lightClasses';
import { buildAdminTopUpReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';

type QueueTab = 'all' | 'disputes' | 'withdrawals' | 'escrows';

type QueueRow = {
  id: string;
  kind: 'dispute' | 'withdrawal' | 'escrow';
  title: string;
  subtitle: string;
  href: string;
  status: string;
  amountCents?: number;
  createdAt?: string;
  priority: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [mounted, setMounted] = useState(false);
  const [queueTab, setQueueTab] = useState<QueueTab>('all');

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

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery({
    queryKey: ['admin-escrows'],
    queryFn: async () => (await apiClient.get('/escrows')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0,
    refetchInterval: 30000,
  });
  const escrows: any[] = extractArrayData(escrowsData, 'escrows');

  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => (await apiClient.get('/disputes')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
  });
  const disputes: any[] = extractArrayData(disputesData, 'disputes');

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await apiClient.get('/users?limit=100')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
  });
  const users: any[] = extractArrayData(usersData, 'users');

  const { data: walletsData } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => (await apiClient.get('/wallet/admin?limit=500')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0,
    refetchInterval: 30000,
  });
  const wallets: any[] = extractArrayData(walletsData, 'wallets');

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['admin-withdrawals-home', 'REQUESTED'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/admin/withdrawals?status=REQUESTED&limit=50');
      return response.data;
    },
    enabled: mounted && isAuthenticated() && isAdmin(),
  });
  const pendingWithdrawals: any[] = withdrawalsData?.withdrawals || [];

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
  }>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await apiClient.get('/admin/stats')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 0,
    refetchInterval: 30000,
  });

  const chartData = useMemo(() => {
    const now = new Date();
    const points = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      const inMonth = escrows.filter((e: any) => {
        const created = new Date(e.createdAt);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      });
      points.push({
        label,
        values: {
          volume: inMonth.reduce((s: number, e: any) => s + (e.amountCents || 0), 0),
        },
      });
    }
    return points;
  }, [escrows]);

  const queueRows: QueueRow[] = useMemo(() => {
    const openDisputes = disputes
      .filter((d: any) => d.status === 'OPEN')
      .map(
        (d: any): QueueRow => ({
          id: `d-${d.id}`,
          kind: 'dispute',
          title: `Dispute #${String(d.id).slice(0, 8)}`,
          subtitle: d.reason || 'Open dispute',
          href: `/disputes/${d.id}`,
          status: d.status,
          createdAt: d.createdAt,
          priority: 1,
        })
      );

    const withdrawals = pendingWithdrawals.map(
      (w: any): QueueRow => ({
        id: `w-${w.id}`,
        kind: 'withdrawal',
        title: w.userEmail || `Withdrawal #${String(w.id).slice(0, 8)}`,
        subtitle: 'Pending approval',
        href: '/admin/withdrawals',
        status: w.status || 'REQUESTED',
        amountCents: w.amountCents,
        createdAt: w.createdAt,
        priority: 2,
      })
    );

    const hotEscrows = escrows
      .filter((e: any) => ['FUNDED', 'DISPUTED', 'AWAITING_RELEASE'].includes(e.status))
      .slice(0, 12)
      .map(
        (e: any): QueueRow => ({
          id: `e-${e.id}`,
          kind: 'escrow',
          title: e.description || 'Escrow agreement',
          subtitle: e.status.replace(/_/g, ' '),
          href: `/escrows/${e.id}`,
          status: e.status,
          amountCents: e.amountCents,
          createdAt: e.createdAt,
          priority: 3,
        })
      );

    return [...openDisputes, ...withdrawals, ...hotEscrows].sort((a, b) => a.priority - b.priority);
  }, [disputes, pendingWithdrawals, escrows]);

  const filteredQueue = queueRows.filter((row) => {
    if (queueTab === 'all') return true;
    if (queueTab === 'disputes') return row.kind === 'dispute';
    if (queueTab === 'withdrawals') return row.kind === 'withdrawal';
    return row.kind === 'escrow';
  });

  if (!mounted) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated() || !isAdmin()) return null;

  const stats = {
    totalEscrows: escrows.length || 0,
    activeEscrows: escrows.filter((e: any) => !COMPLETED_ESCROW_STATUSES.includes(e.status)).length || 0,
    fundedEscrows: escrows.filter((e: any) => e.status === 'FUNDED').length || 0,
    openDisputes: disputes.filter((d: any) => d.status === 'OPEN').length || 0,
    totalValue: escrows.reduce((sum: number, e: any) => sum + (e.amountCents || 0), 0) || 0,
    totalUsers: users.length || 0,
    totalWalletBalance:
      wallets.reduce((sum: number, w: any) => sum + (w.availableCents || 0), 0) || 0,
    pendingWithdrawals: pendingWithdrawals.length,
  };

  const refreshAdmin = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-escrows'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-home'] }),
    ]);
  };

  const queueLoading = escrowsLoading || disputesLoading || withdrawalsLoading;

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshAdmin} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                Operations
              </p>
              <h1 className={dash.title}>Admin dashboard</h1>
              <p className={dash.subtitle}>
                Monitor float, clear queues, and keep escrow ops healthy.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/admin/wallet/credit" variant="outline" size="sm">
                <DollarSign className="w-4 h-4" />
                Credit wallet
              </ButtonLink>
              <ButtonLink href="/admin/users" variant="maroon" size="sm">
                <Users className="w-4 h-4" />
                Manage users
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              tone="light"
              label="Open disputes"
              value={stats.openDisputes}
              hint="Needs attention"
              icon={<AlertCircle className="w-5 h-5" />}
              accent="amber"
              trend={stats.openDisputes > 0 ? 'Action needed' : 'Clear'}
              trendPositive={stats.openDisputes === 0}
            />
            <MetricCard
              tone="light"
              label="Pending withdrawals"
              value={stats.pendingWithdrawals}
              hint="Awaiting approval"
              icon={<ArrowUpCircle className="w-5 h-5" />}
              accent="gold"
            />
            <MetricCard
              tone="light"
              label="Escrow value"
              value={formatCurrency(stats.totalValue, 'GHS')}
              hint={`${stats.fundedEscrows} funded`}
              icon={<DollarSign className="w-5 h-5" />}
              accent="maroon"
            />
            <MetricCard
              tone="light"
              label="Wallet float"
              value={formatCurrency(
                statsData?.totals?.walletBalanceCents ?? stats.totalWalletBalance,
                'GHS'
              )}
              hint={`${stats.totalUsers} users`}
              icon={<Wallet className="w-5 h-5" />}
              accent="emerald"
            />
          </div>

          {statsData?.last24Hours && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <LightPanel>
                <p className={dash.label}>Top-ups (24h)</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatCurrency(statsData.last24Hours.topUpAmountCents ?? 0, 'GHS')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {statsData.last24Hours.topUpCount ?? 0} transactions
                </p>
              </LightPanel>
              <LightPanel>
                <p className={dash.label}>Escrows created (24h)</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {statsData.last24Hours.escrowsCreated ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(statsData.last24Hours.escrowValueCents ?? 0, 'GHS')} value
                </p>
              </LightPanel>
              <LightPanel>
                <p className={dash.label}>Fee revenue (24h)</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatCurrency(statsData.last24Hours.feesRevenueCents ?? 0, 'GHS')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
              </LightPanel>
              <LightPanel>
                <p className={dash.label}>Active escrows</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{stats.activeEscrows}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalEscrows} total</p>
              </LightPanel>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <LightPanel className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className={dash.sectionTitle}>Volume (6 months)</h2>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              {escrowsLoading ? (
                <div className="h-[180px] animate-pulse rounded-ios bg-gray-100" />
              ) : (
                <SimpleBarChart
                  height={180}
                  data={chartData}
                  series={[{ key: 'volume', label: 'Deal volume', color: '#8f2126' }]}
                />
              )}
            </LightPanel>

            <LightPanel flush className="lg:col-span-3">
              <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className={dash.sectionTitle}>Work queue</h2>
                <SegmentedControl
                  tone="light"
                  scrollable
                  value={queueTab}
                  onChange={setQueueTab}
                  className="sm:max-w-md"
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'disputes', label: 'Disputes' },
                    { value: 'withdrawals', label: 'Withdrawals' },
                    { value: 'escrows', label: 'Escrows' },
                  ]}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={dash.tableHead}>
                    <tr>
                      <th className={dash.th}>Item</th>
                      <th className={dash.th}>Type</th>
                      <th className={dash.th}>Amount</th>
                      <th className={dash.th}>Status</th>
                      <th className={dash.th}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueLoading ? (
                      <tr>
                        <td colSpan={5} className={dash.td}>
                          <ListRowsSkeleton rows={4} rowClassName="h-12" />
                        </td>
                      </tr>
                    ) : filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`${dash.td} text-center py-10`}>
                          <div className="flex flex-col items-center text-gray-500">
                            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                            <p className="text-sm font-medium text-gray-800">Queue clear</p>
                            <p className="text-xs mt-1">Nothing needs action in this filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredQueue.slice(0, 12).map((row) => (
                        <tr key={row.id} className={dash.trHover}>
                          <td className={dash.td}>
                            <Link href={row.href} className="block min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{row.title}</p>
                              <p className={`text-xs ${dash.tdMuted} truncate`}>{row.subtitle}</p>
                            </Link>
                          </td>
                          <td className={dash.td}>
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                              {row.kind}
                            </span>
                          </td>
                          <td className={dash.td}>
                            {row.amountCents != null ? formatCurrency(row.amountCents, 'GHS') : '—'}
                          </td>
                          <td className={dash.td}>
                            <StatusBadge status={row.status} onDark={false} />
                          </td>
                          <td className={`${dash.td} ${dash.tdMuted}`}>
                            {row.createdAt ? formatDate(row.createdAt) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </LightPanel>
          </div>

          {/* Shortcuts + recent top-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LightPanel>
              <h2 className={`${dash.sectionTitle} mb-3`}>Ops shortcuts</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
                  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
                  { href: '/escrows', label: 'Escrows', icon: FileText },
                  { href: '/admin/reconciliation', label: 'Reconciliation', icon: DollarSign },
                  { href: '/admin/wallet/debit', label: 'Debit wallet', icon: Wallet },
                  { href: '/admin/settings', label: 'Settings', icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-ios-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800 hover:border-brand-maroon/30 hover:bg-brand-maroon/[0.04]"
                  >
                    <Icon className="w-4 h-4 text-brand-maroon shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </LightPanel>

            <LightPanel flush>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className={dash.sectionTitle}>Recent top-ups</h2>
              </div>
              <div className="p-3 max-h-72 overflow-y-auto">
                {statsData?.recentTransactions?.length ? (
                  <ul className="divide-y divide-gray-100">
                    {statsData.recentTransactions.slice(0, 8).map((tx: any) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-2 py-2.5 px-1"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(tx.amountCents, 'GHS')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {tx.userEmail || '—'} · {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PrintReceiptButton
                            receipt={buildAdminTopUpReceipt(tx)}
                            iconOnly
                            variant="outline"
                            size="sm"
                            label="Print receipt"
                          />
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              tx.status === 'SUCCEEDED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    tone="light"
                    icon={<Wallet className="w-6 h-6" />}
                    title="No recent top-ups"
                    className="border-0 shadow-none py-8"
                  />
                )}
              </div>
            </LightPanel>
          </div>
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
