import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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

  const statusColors: Record<string, string> = {
    AWAITING_FUNDING: 'bg-yellow-100 text-yellow-800',
    FUNDED: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    RELEASED: 'bg-gray-100 text-gray-800',
    DISPUTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Reconciliation Dashboard"
          subtitle="Financial overview and balance reconciliation"
          icon={<BarChart3 className="w-6 h-6 text-white" />}
          gradient="green"
        />

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Escrow Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalEscrowValue, 'GHS')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalFees, 'GHS')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Released</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalReleased, 'GHS')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <TrendingDown className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totals.totalPending, 'GHS')}
              </p>
            </div>
          </div>
        ) : null}

        {/* Balance Reconciliation */}
        {balanceLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-32 bg-gray-200 animate-pulse rounded" />
          </div>
        ) : balance ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Reconciliation</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Escrow Hold Balance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(balance.escrowHoldBalance, 'GHS')}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pending Escrows</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(balance.pendingEscrows, 'GHS')}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Difference</p>
                <p className={`text-xl font-bold ${balance.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(balance.difference), 'GHS')}
                  {balance.difference !== 0 && (
                    <span className="text-sm ml-2">
                      ({balance.difference > 0 ? 'Over' : 'Under'})
                    </span>
                  )}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${balance.reconciled ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {balance.reconciled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`font-semibold ${balance.reconciled ? 'text-green-800' : 'text-red-800'}`}>
                    {balance.reconciled ? 'Reconciled' : 'Not Reconciled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Escrows by Status */}
        {summaryLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 animate-pulse rounded" />
          </div>
        ) : summary ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Escrows by Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Count</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.escrowsByStatus.map((item) => (
                    <tr key={item.status} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{item.count}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.totalAmountCents, 'GHS')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Escrows by Currency */}
        {summaryLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 animate-pulse rounded" />
          </div>
        ) : summary ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Escrows by Currency</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Currency</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Count</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Fees</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.escrowsByCurrency.map((item) => (
                    <tr key={item.currency} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">₵</td>
                      <td className="py-3 px-4 text-right">{item.count}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.totalAmountCents, 'GHS')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatCurrency(item.totalFeesCents, 'GHS')}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.totalNetAmountCents, 'GHS')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {summary && (
          <div className="text-sm text-gray-500 text-center">
            Generated at: {new Date(summary.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </Layout>
  );
}

