import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Clock, ArrowUpCircle, ArrowDownCircle, Loader2, Plus, Users, Wallet as WalletIcon } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface Wallet {
  id: string;
  userId: string;
  currency: string;
  availableCents: number;
  pendingCents: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: 'funding' | 'withdrawal';
  amountCents: number;
  status: string;
  createdAt: string;
  sourceType?: string;
  methodType?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const admin = isAdmin();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet');
      return response.data;
    },
  });

  const { data: fundingHistory, isLoading: fundingLoading } = useQuery<any[]>({
    queryKey: ['wallet-funding'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/funding-history?limit=20');
      return response.data;
    },
  });

  const { data: withdrawalHistory, isLoading: withdrawalLoading } = useQuery<any[]>({
    queryKey: ['wallet-withdrawals'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet/withdrawal-history?limit=20');
      return response.data;
    },
  });

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Wallet"
          subtitle="Manage your wallet balance and transactions"
          icon={<WalletIcon className="w-6 h-6 text-white" />}
          gradient="blue"
        />

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Available Balance</h3>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            {walletLoading ? (
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">Ready to use</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Pending Balance</h3>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            {walletLoading ? (
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">In escrow or pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link
              href="/wallet/withdraw"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Request Withdrawal
            </Link>
            {admin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Funding History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Funding History</h2>
          </div>
          <div className="p-6">
            {fundingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : fundingHistory && fundingHistory.length > 0 ? (
              <div className="space-y-4">
                {fundingHistory.map((funding) => (
                  <div key={funding.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <ArrowDownCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {funding.sourceType} • {formatDate(funding.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        funding.status === 'SUCCEEDED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {funding.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No funding history</p>
            )}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Withdrawal History</h2>
          </div>
          <div className="p-6">
            {withdrawalLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
              <div className="space-y-4">
                {withdrawalHistory.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <ArrowUpCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(withdrawal.amountCents, 'GHS')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {withdrawal.methodType} • {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        withdrawal.status === 'SUCCEEDED'
                          ? 'bg-green-100 text-green-800'
                          : withdrawal.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No withdrawal history</p>
                <Link
                  href="/wallet/withdraw"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Request Withdrawal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

