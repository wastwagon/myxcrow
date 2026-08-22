import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
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
import { Banner } from '@/components/ui/Banner';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';
import { PageSpinner } from '@/components/LoadingSkeleton';

interface ReconciliationSummary {
  escrowsByStatus: Array<{
    status: string;
    count: number;
    totalAmountCents: number;
  }>;
  escrowsByCurrency: Array<{
    currency: string;
    count: number;
    totalAmountCents: number;
    totalFeesCents: number;
    totalNetAmountCents: number;
  }>;
  totals: {
    totalEscrowValue: number;
    totalFees: number;
    totalReleased: number;
    totalPending: number;
  };
  generatedAt: string;
}

interface BalanceComparison {
  escrowHoldBalance: number;
  feesRevenue: number;
  pendingEscrows: number;
  difference: number;
  reconciled: boolean;
}

export default function ReconciliationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: summary, isLoading: summaryLoading } = useQuery<ReconciliationSummary>({
    queryKey: ['reconciliation-summary'],
    queryFn: async () => (await apiClient.get('/admin/reconciliation')).data,
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceComparison>({
    queryKey: ['reconciliation-balance'],
    queryFn: async () => (await apiClient.get('/admin/reconciliation/balance')).data,
  });

  if (!isAuthenticated() || !isAdmin()) {
    return <PageSpinner />;
  }

  const refreshReconciliation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['reconciliation-balance'] }),
    ]);
  };

  return (
    <Layout title="Reconciliation">
      <PullToRefresh onRefresh={refreshReconciliation} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className={dash.subtitle}>
              Escrow holds, fees, and balance integrity checks
            </p>
            <ButtonLink href="/admin" variant="outline" size="sm">
              Back to admin
            </ButtonLink>
          </div>

          {summaryLoading ? (
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-[20px]" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                tone="light"
                label="Total escrow value"
                value={formatCurrency(summary.totals.totalEscrowValue, 'GHS')}
                icon={<DollarSign className="w-5 h-5" />}
                accent="gold"
              />
              <MetricCard
                tone="light"
                label="Total fees"
                value={formatCurrency(summary.totals.totalFees, 'GHS')}
                icon={<BarChart3 className="w-5 h-5" />}
                accent="maroon"
              />
              <MetricCard
                tone="light"
                label="Total released"
                value={formatCurrency(summary.totals.totalReleased, 'GHS')}
                icon={<CheckCircle className="w-5 h-5" />}
                accent="emerald"
              />
              <MetricCard
                tone="light"
                label="Total pending"
                value={formatCurrency(summary.totals.totalPending, 'GHS')}
                icon={<AlertCircle className="w-5 h-5" />}
                accent="amber"
              />
            </div>
          ) : null}

          {balanceLoading ? (
            <div className="h-40 bg-gray-100 animate-pulse rounded-[20px]" />
          ) : balance ? (
            <LightPanel>
              <h2 className={`${dash.sectionTitle} mb-4`}>Balance reconciliation</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-[20px] bg-gray-50 border border-gray-100">
                    <p className={dash.label}>Escrow hold balance</p>
                    <p className={`mt-1 ${dash.value}`}>
                      {formatCurrency(balance.escrowHoldBalance, 'GHS')}
                    </p>
                  </div>
                  <div className="p-4 rounded-[20px] bg-gray-50 border border-gray-100">
                    <p className={dash.label}>Pending escrows</p>
                    <p className={`mt-1 ${dash.value}`}>
                      {formatCurrency(balance.pendingEscrows, 'GHS')}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-[20px] border border-gray-200 bg-white">
                  <p className={dash.label}>Difference</p>
                  <p
                    className={`mt-1 text-[22px] font-semibold tracking-tight ${
                      balance.difference === 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(balance.difference), 'GHS')}
                    {balance.difference !== 0 && (
                      <span className="text-sm ml-2 font-semibold">
                        ({balance.difference > 0 ? 'Over' : 'Under'})
                      </span>
                    )}
                  </p>
                </div>
                <Banner
                  tone={balance.reconciled ? 'success' : 'error'}
                  title={balance.reconciled ? 'Reconciled' : 'Not reconciled'}
                >
                  {balance.reconciled
                    ? 'Escrow hold balances match pending escrow totals.'
                    : 'Balances do not match — investigate pending holds and ledger entries.'}
                </Banner>
              </div>
            </LightPanel>
          ) : null}

          {summaryLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-[20px]" />
          ) : summary ? (
            <TableShell
              tone="light"
              toolbar={<h2 className={dash.sectionTitle}>Escrows by status</h2>}
            >
              <Table>
                <TableHead>
                  <tr>
                    <TableTh className="text-left">Status</TableTh>
                    <TableTh className="text-right">Count</TableTh>
                    <TableTh className="text-right">Total amount</TableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {summary.escrowsByStatus.length === 0 ? (
                    <TableEmpty colSpan={3}>
                      <EmptyState
                        tone="light"
                        icon={<BarChart3 className="w-6 h-6" />}
                        title="No escrow status data yet"
                        description="Funded and released deals will populate this table."
                        action={{ href: '/escrows', label: 'View escrows', variant: 'maroon' }}
                        className="py-6"
                      />
                    </TableEmpty>
                  ) : (
                    summary.escrowsByStatus.map((item) => (
                      <TableRow key={item.status}>
                        <TableTd>
                          <StatusBadge status={item.status} onDark={false} />
                        </TableTd>
                        <TableTd className="text-right font-medium">{item.count}</TableTd>
                        <TableTd className="text-right font-medium">
                          {formatCurrency(item.totalAmountCents, 'GHS')}
                        </TableTd>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableShell>
          ) : null}

          {summaryLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-[20px]" />
          ) : summary ? (
            <TableShell
              tone="light"
              toolbar={<h2 className={dash.sectionTitle}>Escrows by currency</h2>}
            >
              <Table>
                <TableHead>
                  <tr>
                    <TableTh className="text-left">Currency</TableTh>
                    <TableTh className="text-right">Count</TableTh>
                    <TableTh className="text-right">Total amount</TableTh>
                    <TableTh className="text-right">Total fees</TableTh>
                    <TableTh className="text-right">Net amount</TableTh>
                  </tr>
                </TableHead>
                <TableBody>
                  {summary.escrowsByCurrency.length === 0 ? (
                    <TableEmpty colSpan={5}>
                      <EmptyState
                        tone="light"
                        icon={<DollarSign className="w-6 h-6" />}
                        title="No currency breakdown yet"
                        description="Amounts appear here once escrows are funded."
                        action={{ href: '/escrows', label: 'View escrows', variant: 'maroon' }}
                        className="py-6"
                      />
                    </TableEmpty>
                  ) : (
                    summary.escrowsByCurrency.map((item) => (
                      <TableRow key={item.currency}>
                        <TableTd className="font-medium">₵</TableTd>
                        <TableTd className="text-right">{item.count}</TableTd>
                        <TableTd className="text-right font-medium">
                          {formatCurrency(item.totalAmountCents, 'GHS')}
                        </TableTd>
                        <TableTd muted className="text-right">
                          {formatCurrency(item.totalFeesCents, 'GHS')}
                        </TableTd>
                        <TableTd className="text-right font-medium">
                          {formatCurrency(item.totalNetAmountCents, 'GHS')}
                        </TableTd>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableShell>
          ) : null}

          {summary && (
            <p className="text-sm text-gray-500 text-center">
              Generated at: {new Date(summary.generatedAt).toLocaleString()}
            </p>
          )}
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
