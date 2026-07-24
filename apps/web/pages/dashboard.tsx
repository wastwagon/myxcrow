import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  FileText,
  Clock,
  CheckCircle,
  Plus,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import Link from 'next/link';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { DonutMetric } from '@/components/dashboard/DonutMetric';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { dash } from '@/components/dashboard/lightClasses';

type Period = '12m' | '30d' | '7d' | '24h';

interface WalletData {
  availableCents: number;
  pendingCents: number;
  currency: string;
}

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  fundingAmountCents?: number;
  netAmountCents?: number;
  buyerFeeCents?: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
}

function buildMonthlyBars(escrows: Escrow[], months = 12) {
  const now = new Date();
  const points = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString('en', { month: 'short' });
    const inMonth = escrows.filter((e) => {
      const created = new Date(e.createdAt);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    });
    const active = inMonth
      .filter((e) => !COMPLETED_ESCROW_STATUSES.includes(e.status) && e.status !== 'CANCELLED')
      .reduce((s, e) => s + e.amountCents, 0);
    const completed = inMonth
      .filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status))
      .reduce((s, e) => s + e.amountCents, 0);
    points.push({ label, values: { active, completed }, _key: key });
  }
  return points.map(({ label, values }) => ({ label, values }));
}

function filterByPeriod(escrows: Escrow[], period: Period) {
  const now = Date.now();
  const ms =
    period === '24h'
      ? 24 * 60 * 60 * 1000
      : period === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : period === '30d'
          ? 30 * 24 * 60 * 60 * 1000
          : 365 * 24 * 60 * 60 * 1000;
  return escrows.filter((e) => now - new Date(e.createdAt).getTime() <= ms);
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [userName, setUserName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>('12m');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      if (isAdmin()) {
        router.push('/admin');
        return;
      }
      const user = getUser();
      if (user) {
        setUserName(user.firstName || user.email?.split('@')[0] || 'User');
      }
    }
  }, [router, mounted]);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
    staleTime: 0,
    refetchInterval: 30000,
    enabled: mounted && isAuthenticated(),
  });

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => (await apiClient.get('/escrows')).data,
    enabled: mounted && isAuthenticated(),
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  const periodEscrows = useMemo(() => filterByPeriod(escrows, period), [escrows, period]);
  const chartMonths = period === '12m' ? 12 : period === '30d' ? 4 : period === '7d' ? 7 : 1;
  const barData = useMemo(
    () => buildMonthlyBars(period === '12m' ? escrows : periodEscrows, period === '12m' ? 12 : Math.max(chartMonths, 3)),
    [escrows, periodEscrows, period, chartMonths]
  );

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-brand-gold" />
      </div>
    );
  }

  const user = getUser();
  const available = wallet?.availableCents ?? 0;
  const pending = wallet?.pendingCents ?? 0;
  const walletTotal = available + pending || 1;
  const activeEscrows = escrows.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status));
  const awaiting = escrows.filter((e) =>
    ['AWAITING_FUNDING', 'AWAITING_SHIPMENT', 'AWAITING_RELEASE'].includes(e.status)
  );
  const completed = escrows.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status));
  const recentEscrows = [...escrows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['escrows'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshDashboard} disabled={!isMobile}>
        <LightShell>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                Wallet & escrow
              </p>
              <h1 className={dash.title}>Welcome back, {userName || 'there'}</h1>
              <p className={dash.subtitle}>
                Track balances, fund deals, and release when delivery is confirmed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <ButtonLink href="/wallet/topup" variant="outline" size="sm">
                <ArrowUpRight className="w-4 h-4" />
                Top up
              </ButtonLink>
              <ButtonLink href="/escrows/new" variant="maroon" size="sm">
                <Plus className="w-4 h-4" />
                Create escrow
              </ButtonLink>
            </div>
          </div>

          {/* Period + KYC */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              tone="light"
              scrollable
              value={period}
              onChange={setPeriod}
              className="sm:max-w-md"
              options={[
                { value: '12m', label: '12 months' },
                { value: '30d', label: '30 days' },
                { value: '7d', label: '7 days' },
                { value: '24h', label: '24 hours' },
              ]}
            />
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
            >
              <ShieldCheck className="w-4 h-4" />
              {user?.kycStatus === 'VERIFIED' ? 'Identity verified' : 'Complete profile'}
            </Link>
          </div>

          {/* Mobile balance hero */}
          <LightPanel className="sm:hidden">
            <p className={dash.label}>Available balance</p>
            {walletLoading ? (
              <div className="mt-2 h-9 w-36 animate-pulse rounded-ios bg-gray-100" />
            ) : (
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {formatCurrency(available, 'GHS')}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Pending in escrow:{' '}
              <span className="font-semibold text-gray-800">{formatCurrency(pending, 'GHS')}</span>
            </p>
          </LightPanel>

          {/* Account cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LightPanel className="flex items-center gap-4">
              <DonutMetric ratio={available / walletTotal} color="#8f2126" />
              <div className="min-w-0 flex-1">
                <p className={dash.label}>Available balance</p>
                {walletLoading ? (
                  <div className="mt-1 h-8 w-28 animate-pulse rounded-ios bg-gray-100" />
                ) : (
                  <p className={dash.value}>{formatCurrency(available, 'GHS')}</p>
                )}
                <Link href="/wallet" className={`${dash.link} mt-1 inline-flex items-center gap-1`}>
                  <Wallet className="w-3.5 h-3.5" />
                  Open wallet
                </Link>
              </div>
            </LightPanel>
            <LightPanel className="flex items-center gap-4">
              <DonutMetric ratio={pending / walletTotal} color="#d0ab63" />
              <div className="min-w-0 flex-1">
                <p className={dash.label}>Pending in escrow</p>
                {walletLoading ? (
                  <div className="mt-1 h-8 w-28 animate-pulse rounded-ios bg-gray-100" />
                ) : (
                  <p className={dash.value}>{formatCurrency(pending, 'GHS')}</p>
                )}
                <Link href="/escrows" className={`${dash.link} mt-1 inline-block`}>
                  Track funds
                </Link>
              </div>
            </LightPanel>
          </div>

          {/* Chart + recent */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <LightPanel className="lg:col-span-3">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className={dash.sectionTitle}>Escrow volume over time</h2>
                <ButtonLink href="/escrows" variant="outline" size="sm" className="!min-h-[32px] text-xs">
                  View report
                </ButtonLink>
              </div>
              {escrowsLoading ? (
                <div className="h-[200px] animate-pulse rounded-ios bg-gray-100" />
              ) : (
                <SimpleBarChart
                  data={barData}
                  series={[
                    { key: 'active', label: 'Active / open', color: '#8f2126' },
                    { key: 'completed', label: 'Completed', color: '#d0ab63' },
                  ]}
                />
              )}
            </LightPanel>

            <LightPanel flush className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className={dash.sectionTitle}>Recent activity</h2>
                <Link href="/escrows" className={dash.link}>
                  View all
                </Link>
              </div>
              <div className="flex-1 p-2">
                {escrowsLoading ? (
                  <ListRowsSkeleton rows={4} rowClassName="h-14" />
                ) : recentEscrows.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {recentEscrows.map((escrow) => {
                      const isBuyer = user?.id === escrow.buyerId;
                      const displayCents = isBuyer
                        ? escrow.fundingAmountCents ||
                          escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                        : escrow.netAmountCents ?? escrow.amountCents;
                      return (
                        <li key={escrow.id}>
                          <Link
                            href={`/escrows/${escrow.id}`}
                            className="flex items-center justify-between gap-3 px-3 py-3 rounded-ios-lg hover:bg-gray-50"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {escrow.description || 'Escrow agreement'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(escrow.createdAt)} · {isBuyer ? 'Funded' : 'Receive'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-emerald-700">
                                {formatCurrency(displayCents, 'GHS')}
                              </p>
                              <StatusBadge status={escrow.status} onDark={false} className="mt-1" />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    tone="light"
                    icon={<FileText className="w-6 h-6" />}
                    title="No escrows yet"
                    description="Create your first escrow to protect a transaction"
                    action={{ href: '/escrows/new', label: 'Create escrow', variant: 'maroon' }}
                    className="border-0 shadow-none"
                  />
                )}
              </div>
            </LightPanel>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              tone="light"
              label="Active"
              value={activeEscrows.length}
              hint="In progress"
              icon={<Activity className="w-5 h-5" />}
              accent="maroon"
              loading={escrowsLoading}
            />
            <MetricCard
              tone="light"
              label="Awaiting you"
              value={awaiting.length}
              hint="Needs action"
              icon={<Clock className="w-5 h-5" />}
              accent="amber"
              loading={escrowsLoading}
            />
            <MetricCard
              tone="light"
              label="Completed"
              value={completed.length}
              hint="All time"
              icon={<CheckCircle className="w-5 h-5" />}
              accent="emerald"
              loading={escrowsLoading}
            />
          </div>

          {/* Quick links */}
          <LightPanel>
            <h2 className={`${dash.sectionTitle} mb-3`}>Quick actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { href: '/wallet', label: 'My wallet', icon: Wallet },
                { href: '/escrows', label: 'All escrows', icon: FileText },
                { href: '/disputes', label: 'Disputes', icon: Scale },
                { href: '/wallet/withdraw', label: 'Withdraw', icon: ArrowUpRight },
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
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
