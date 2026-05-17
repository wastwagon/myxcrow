import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Clock, ArrowUpCircle, ArrowDownCircle, Loader2, Plus, Users, Wallet as WalletIcon } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

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
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
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
    staleTime: 0,
    refetchInterval: 30000,
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

  const refreshWallet = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet-funding'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet-withdrawals'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshWallet} disabled={!isMobile} className="space-y-6">
        <PageHeader
          title="Wallet"
          subtitle="Manage your wallet balance and transactions"
          icon={<WalletIcon className="w-6 h-6" />}
        />

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Available Balance</h3>
              <DollarSign className="w-6 h-6 text-emerald-500" />
            </div>
            {walletLoading ? (
              <div className="h-10 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm text-white/60 mt-2">Ready to use</p>
          </div>

          <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">Pending Balance</h3>
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            {walletLoading ? (
              <div className="h-10 bg-white/10 animate-pulse rounded-lg" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm text-white/60 mt-2">In escrow or pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-6 shadow-xl shadow-black/10">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/wallet/topup"
              className="min-h-[48px] px-4 py-3 rounded-ios-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center gap-2 touch-manipulation font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Top Up Wallet
            </Link>
            <Link
              href="/wallet/withdraw"
              className="min-h-[48px] px-4 py-3 rounded-ios-lg bg-brand-gold text-brand-maroon-black hover:bg-brand-gold/90 flex items-center justify-center gap-2 touch-manipulation font-semibold transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Request Withdrawal
            </Link>
            {admin && (
              <Link
                href="/admin"
                className="min-h-[48px] px-4 py-3 bg-brand-maroon text-white rounded-xl hover:bg-brand-maroon-dark flex items-center justify-center gap-2 touch-manipulation font-medium transition-all"
              >
                <Users className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Funding History */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Funding History</h2>
          </div>
          <div className="p-6">
            {fundingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/10 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : fundingHistory && fundingHistory.length > 0 ? (
              <div className="space-y-4">
                {fundingHistory.map((funding) => (
                  <div key={funding.id} className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex items-center gap-4">
                      <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-white">
                          {formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                        </p>
                        <p className="text-sm text-white/70">
                          {funding.sourceType} • {formatDate(funding.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        funding.status === 'SUCCEEDED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {funding.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/60 py-8">No funding history</p>
            )}
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Withdrawal History</h2>
          </div>
          <div className="p-6">
            {withdrawalLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white/10 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
              <div className="space-y-4">
                {withdrawalHistory.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex items-center gap-4">
                      <ArrowUpCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-white">
                          {formatCurrency(withdrawal.amountCents, 'GHS')}
                        </p>
                        <p className="text-sm text-white/70">
                          {withdrawal.methodType} • {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        withdrawal.status === 'SUCCEEDED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : withdrawal.status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60 mb-4">No withdrawal history</p>
                <Link
                  href="/wallet/withdraw"
                  className="inline-flex px-4 py-2 min-h-[48px] rounded-ios-lg bg-brand-gold text-brand-maroon-black hover:bg-brand-gold/90 font-semibold items-center justify-center mx-auto gap-2 touch-manipulation transition-colors"
                >
                  Request Withdrawal
                </Link>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}

