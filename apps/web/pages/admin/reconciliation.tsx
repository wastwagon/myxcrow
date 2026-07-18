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
import { admin } from '@/components/admin/adminClasses';
import { StatusBadge } from '@/components/StatusBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

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
              <div
                className={`p-4 rounded-ios-lg border ${
                  balance.reconciled
                    ? 'border-emerald-500/30 bg-emerald-500/15'
                    : 'border-red-500/30 bg-red-500/15'
                }`}
              >
                <div className="flex items-center gap-2">
                  {balance.reconciled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`font-semibold ${balance.reconciled ? 'text-emerald-200' : 'text-red-200'}`}>
                    {balance.reconciled ? 'Reconciled' : 'Not Reconciled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Escrows by Status */}
        {summaryLoading ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <div className="h-64 bg-white/10 animate-pulse rounded-ios-lg" />
          </div>
        ) : summary ? (
          <div className={admin.tableWrap}>
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Escrows by Status</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={admin.tableHead}>
                  <tr>
                    <th className={`${admin.th} text-left`}>Status</th>
                    <th className={`${admin.th} text-right`}>Count</th>
                    <th className={`${admin.th} text-right`}>Total Amount</th>
                  </tr>
                </thead>
                <tbody className={admin.tbody}>
                  {summary.escrowsByStatus.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={`${admin.td} text-center py-10 text-white/55`}>
                        No escrow status data yet
                      </td>
                    </tr>
                  ) : (
                    summary.escrowsByStatus.map((item) => (
                      <tr key={item.status} className={admin.trHover}>
                        <td className={admin.td}>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className={`${admin.td} text-right font-medium`}>{item.count}</td>
                        <td className={`${admin.td} text-right font-medium`}>
                          {formatCurrency(item.totalAmountCents, 'GHS')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Escrows by Currency */}
        {summaryLoading ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <div className="h-64 bg-white/10 animate-pulse rounded-ios-lg" />
          </div>
        ) : summary ? (
          <div className={admin.tableWrap}>
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Escrows by Currency</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={admin.tableHead}>
                  <tr>
                    <th className={`${admin.th} text-left`}>Currency</th>
                    <th className={`${admin.th} text-right`}>Count</th>
                    <th className={`${admin.th} text-right`}>Total Amount</th>
                    <th className={`${admin.th} text-right`}>Total Fees</th>
                    <th className={`${admin.th} text-right`}>Net Amount</th>
                  </tr>
                </thead>
                <tbody className={admin.tbody}>
                  {summary.escrowsByCurrency.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`${admin.td} text-center py-10 text-white/55`}>
                        No currency breakdown yet
                      </td>
                    </tr>
                  ) : (
                    summary.escrowsByCurrency.map((item) => (
                      <tr key={item.currency} className={admin.trHover}>
                        <td className={`${admin.td} font-medium`}>₵</td>
                        <td className={`${admin.td} text-right`}>{item.count}</td>
                        <td className={`${admin.td} text-right font-medium`}>
                          {formatCurrency(item.totalAmountCents, 'GHS')}
                        </td>
                        <td className={`${admin.td} text-right ${admin.tdMuted}`}>
                          {formatCurrency(item.totalFeesCents, 'GHS')}
                        </td>
                        <td className={`${admin.td} text-right font-medium`}>
                          {formatCurrency(item.totalNetAmountCents, 'GHS')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

