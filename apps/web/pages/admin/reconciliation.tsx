import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
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
    queryFn: async () => {
      const response = await apiClient.get('/admin/reconciliation');
      return response.data;
    },
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceComparison>({
    queryKey: ['reconciliation-balance'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/reconciliation/balance');
      return response.data;
    },
  });

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const refreshReconciliation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['reconciliation-balance'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshReconciliation} disabled={!isMobile} className="space-y-5">
        <PageHeader
          eyebrow="Admin"
          title="Reconciliation Dashboard"
          subtitle="Financial overview and balance reconciliation"
          icon={<BarChart3 className="w-6 h-6 text-white" />}
        />

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/10 animate-pulse rounded-ios-lg" />
            ))}
          </div>
                ) : summary ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total escrow value"
              value={formatCurrency(summary.totals.totalEscrowValue, 'GHS')}
              icon={<DollarSign className="w-5 h-5" />}
              accent="gold"
            />
            <MetricCard
              label="Total fees"
              value={formatCurrency(summary.totals.totalFees, 'GHS')}
              icon={<BarChart3 className="w-5 h-5" />}
              accent="maroon"
            />
            <MetricCard
              label="Total released"
              value={formatCurrency(summary.totals.totalReleased, 'GHS')}
              icon={<CheckCircle className="w-5 h-5" />}
              accent="emerald"
            />
            <MetricCard
              label="Total pending"
              value={formatCurrency(summary.totals.totalPending, 'GHS')}
              icon={<AlertCircle className="w-5 h-5" />}
              accent="amber"
            />
          </div>
        ) : null}

        {/* Balance Reconciliation */}
        {balanceLoading ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <div className="h-32 bg-white/10 animate-pulse rounded-ios-lg" />
          </div>
        ) : balance ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Balance Reconciliation</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/70 mb-1">Escrow Hold Balance</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(balance.escrowHoldBalance, 'GHS')}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/70 mb-1">Pending Escrows</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(balance.pendingEscrows, 'GHS')}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-ios-lg border border-white/10 bg-white/[0.06]">
                <p className="text-sm text-white/70 mb-1">Difference</p>
                <p className={`text-xl font-bold ${balance.difference === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(balance.difference), 'GHS')}
                  {balance.difference !== 0 && (
                    <span className="text-sm ml-2">
                      ({balance.difference > 0 ? 'Over' : 'Under'})
                    </span>
                  )}
                </p>
              </div>
              <Banner
                tone={balance.reconciled ? 'success' : 'error'}
                title={balance.reconciled ? 'Reconciled' : 'Not Reconciled'}
              >
                {balance.reconciled
                  ? 'Escrow hold balances match pending escrow totals.'
                  : 'Balances do not match — investigate pending holds and ledger entries.'}
              </Banner>
            </div>
          </div>
        ) : null}

        {/* Escrows by Status */}
        {summaryLoading ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <div className="h-64 bg-white/10 animate-pulse rounded-ios-lg" />
          </div>
        ) : summary ? (
          <TableShell
            toolbar={<h2 className="text-base font-semibold text-white">Escrows by Status</h2>}
          >
            <Table>
              <TableHead>
                <tr>
                  <TableTh className="text-left">Status</TableTh>
                  <TableTh className="text-right">Count</TableTh>
                  <TableTh className="text-right">Total Amount</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {summary.escrowsByStatus.length === 0 ? (
                  <TableEmpty colSpan={3}>No escrow status data yet</TableEmpty>
                ) : (
                  summary.escrowsByStatus.map((item) => (
                    <TableRow key={item.status}>
                      <TableTd>
                        <StatusBadge status={item.status} />
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

        {/* Escrows by Currency */}
        {summaryLoading ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <div className="h-64 bg-white/10 animate-pulse rounded-ios-lg" />
          </div>
        ) : summary ? (
          <TableShell
            toolbar={<h2 className="text-base font-semibold text-white">Escrows by Currency</h2>}
          >
            <Table>
              <TableHead>
                <tr>
                  <TableTh className="text-left">Currency</TableTh>
                  <TableTh className="text-right">Count</TableTh>
                  <TableTh className="text-right">Total Amount</TableTh>
                  <TableTh className="text-right">Total Fees</TableTh>
                  <TableTh className="text-right">Net Amount</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {summary.escrowsByCurrency.length === 0 ? (
                  <TableEmpty colSpan={5}>No currency breakdown yet</TableEmpty>
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
          <div className="text-sm text-white/55 text-center">
            Generated at: {new Date(summary.generatedAt).toLocaleString()}
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}

