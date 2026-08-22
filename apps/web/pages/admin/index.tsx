import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
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
import { ListRowsSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { dash } from '@/components/dashboard/lightClasses';
import { buildAdminTopUpReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
} from '@/components/ui/Table';

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

type AdminStats = {
  last24Hours?: {
    topUpAmountCents?: number;
    topUpCount?: number;
    escrowsCreated?: number;
    escrowValueCents?: number;
    feesRevenueCents?: number;
  };
  totals?: {
    walletBalanceCents?: number;
    userCount?: number;
    escrowCount?: number;
    activeEscrowCount?: number;
    fundedEscrowCount?: number;
    openDisputeCount?: number;
    escrowValueCents?: number;
    pendingWithdrawalCount?: number;
  };
  monthlyVolume?: { label: string; amountCents: number }[];
  queue?: {
    disputes?: { id: string; reason?: string; status: string; createdAt?: string }[];
    withdrawals?: {
      id: string;
      amountCents?: number;
      status: string;
      createdAt?: string;
      userEmail?: string;
    }[];
    escrows?: {
      id: string;
      description?: string | null;
      status: string;
      amountCents?: number;
      createdAt?: string;
    }[];
  };
  recentTransactions?: any[];
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

  const { data: statsData, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await apiClient.get('/admin/stats')).data,
    enabled: mounted && isAuthenticated() && isAdmin(),
    staleTime: 30 * 1000,
    refetchInterval: 30000,
  });

  const chartData = useMemo(() => {
    const months = statsData?.monthlyVolume;
    if (months?.length) {
      return months.map((m) => ({
        label: m.label,
        values: { volume: m.amountCents || 0 },
      }));
    }
    const now = new Date();
    const points = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({
        label: d.toLocaleString('en', { month: 'short' }),
        values: { volume: 0 },
      });
    }
    return points;
  }, [statsData?.monthlyVolume]);

  const queueRows: QueueRow[] = useMemo(() => {
    const openDisputes = (statsData?.queue?.disputes || []).map(
      (d): QueueRow => ({
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

    const withdrawals = (statsData?.queue?.withdrawals || []).map(
      (w): QueueRow => ({
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

    const hotEscrows = (statsData?.queue?.escrows || []).map(
      (e): QueueRow => ({
        id: `e-${e.id}`,
        kind: 'escrow',
        title: e.description || 'Escrow agreement',
        subtitle: (e.status || '').replace(/_/g, ' '),
        href: `/escrows/${e.id}`,
        status: e.status,
        amountCents: e.amountCents,
        createdAt: e.createdAt,
        priority: 3,
      })
    );

    return [...openDisputes, ...withdrawals, ...hotEscrows].sort((a, b) => a.priority - b.priority);
  }, [statsData?.queue]);

  const filteredQueue = queueRows.filter((row) => {
    if (queueTab === 'all') return true;
    if (queueTab === 'disputes') return row.kind === 'dispute';
    if (queueTab === 'withdrawals') return row.kind === 'withdrawal';
    return row.kind === 'escrow';
  });

  if (!mounted) {
    return (
      <Layout title="Admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-maroon" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated() || !isAdmin()) return <PageSpinner />;

  const stats = {
    totalEscrows: statsData?.totals?.escrowCount || 0,
    activeEscrows: statsData?.totals?.activeEscrowCount || 0,
    fundedEscrows: statsData?.totals?.fundedEscrowCount || 0,
    openDisputes: statsData?.totals?.openDisputeCount || 0,
    totalValue: statsData?.totals?.escrowValueCents || 0,
    totalUsers: statsData?.totals?.userCount || 0,
    totalWalletBalance: statsData?.totals?.walletBalanceCents || 0,
    pendingWithdrawals: statsData?.totals?.pendingWithdrawalCount || 0,
  };

  const refreshAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const queueLoading = statsLoading;

  return (
    <Layout title="Admin">
      <PullToRefresh onRefresh={refreshAdmin} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className={dash.subtitle}>
              Monitor float, clear queues, and keep escrow ops healthy.
            </p>
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <LightPanel className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className={dash.sectionTitle}>Volume (6 months)</h2>
                <Clock className="w-4 h-4 text-[rgba(60,60,67,0.55)]" />
              </div>
              {statsLoading ? (
                <div className="h-[180px] animate-pulse rounded-[20px] bg-black/5" />
              ) : (
                <SimpleBarChart
                  height={180}
                  data={chartData}
                  series={[{ key: 'volume', label: 'Deal volume', color: '#8f2126' }]}
                />
              )}
            </LightPanel>

            <div className="lg:col-span-3 min-w-0">
              <TableShell
                tone="light"
                toolbar={
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                }
              >
                <Table>
                  <TableHead>
                    <tr>
                      <TableTh>Item</TableTh>
                      <TableTh>Type</TableTh>
                      <TableTh numeric>Amount</TableTh>
                      <TableTh>Status</TableTh>
                      <TableTh>When</TableTh>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {queueLoading ? (
                      <TableEmpty colSpan={5}>
                        <ListRowsSkeleton rows={4} rowClassName="h-12" />
                      </TableEmpty>
                    ) : filteredQueue.length === 0 ? (
                      <TableEmpty colSpan={5}>
                        <div className="flex flex-col items-center py-2">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-[17px] font-semibold text-gray-900">Queue clear</p>
                          <p className="text-[13px] mt-1 mb-4 text-[rgba(60,60,67,0.6)]">
                            Nothing needs action in this filter
                          </p>
                          <ButtonLink
                            href={
                              queueTab === 'withdrawals'
                                ? '/admin/withdrawals'
                                : queueTab === 'disputes'
                                  ? '/disputes'
                                  : '/escrows'
                            }
                            variant="maroon"
                            size="sm"
                          >
                            {queueTab === 'withdrawals'
                              ? 'View withdrawals'
                              : queueTab === 'disputes'
                                ? 'View disputes'
                                : 'View escrows'}
                          </ButtonLink>
                        </div>
                      </TableEmpty>
                    ) : (
                      filteredQueue.slice(0, 12).map((row) => (
                        <TableRow key={row.id}>
                          <TableTd>
                            <Link href={row.href} className="block min-w-0 min-h-[44px] py-1">
                              <p className="font-semibold text-gray-900 truncate">{row.title}</p>
                              <p className={`text-[13px] ${dash.tdMuted} truncate`}>{row.subtitle}</p>
                            </Link>
                          </TableTd>
                          <TableTd>
                            <span className="text-[15px] capitalize text-[rgba(60,60,67,0.6)]">
                              {row.kind}
                            </span>
                          </TableTd>
                          <TableTd numeric>
                            {row.amountCents != null ? formatCurrency(row.amountCents, 'GHS') : '—'}
                          </TableTd>
                          <TableTd>
                            <StatusBadge status={row.status} onDark={false} />
                          </TableTd>
                          <TableTd muted>
                            {row.createdAt ? formatDate(row.createdAt) : '—'}
                          </TableTd>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableShell>
            </div>
          </div>

          {/* Shortcuts + recent top-ups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LightPanel>
              <h2 className={`${dash.sectionTitle} mb-3`}>Ops shortcuts</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
                  { href: '/admin/platforms', label: 'Partner APIs', icon: FileText },
                  { href: '/disputes', label: 'Disputes', icon: AlertCircle },
                  { href: '/escrows', label: 'Escrows', icon: FileText },
                  { href: '/admin/reconciliation', label: 'Reconciliation', icon: DollarSign },
                  { href: '/admin/wallet/debit', label: 'Debit wallet', icon: Wallet },
                  { href: '/admin/settings', label: 'Settings', icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-[20px] bg-white px-3 py-3 min-h-[44px] text-[15px] font-semibold text-gray-900 active:bg-black/[0.04] touch-manipulation"
                  >
                    <Icon className="w-4 h-4 text-brand-maroon shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </LightPanel>

            <LightPanel flush>
              <div className="px-4 py-3 border-b border-[rgba(60,60,67,0.12)] flex items-center justify-between">
                <h2 className={dash.sectionTitle}>Recent top-ups</h2>
              </div>
              <div className="p-3 max-h-72 overflow-y-auto">
                {statsData?.recentTransactions?.length ? (
                  <ul className="divide-y divide-[rgba(60,60,67,0.12)]">
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
                    description="Credit a wallet to record a top-up."
                    action={{ href: '/admin/wallet/credit', label: 'Credit a wallet', variant: 'maroon' }}
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
