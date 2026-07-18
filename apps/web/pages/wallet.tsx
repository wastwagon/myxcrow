import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatPayoutSummary, formatWithdrawalStatusLabel } from '@/lib/withdrawal-payout';
import { getUser } from '@/lib/auth';
import { buildWalletFundingReceipt, buildWithdrawalReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Users,
  Wallet as WalletIcon,
  Building2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
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

  const currentUser = getUser();
  const receiptAccountHolder = currentUser
    ? {
        name: [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || undefined,
        email: currentUser.email,
        phone: currentUser.phone,
        userId: currentUser.id,
      }
    : undefined;

  const lastUpdated =
    wallet?.updatedAt != null
      ? `Last updated ${formatDate(wallet.updatedAt)}`
      : 'Balances refresh automatically';

  const quickActions = [
    { href: '/wallet/topup', label: 'Top up', icon: Plus },
    { href: '/wallet/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
    { href: '/wallet/payout-methods', label: 'Payout methods', icon: Building2 },
    ...(admin ? [{ href: '/admin', label: 'Admin panel', icon: Users }] : []),
  ];

  return (
    <Layout>
      <PullToRefresh
        onRefresh={refreshWallet}
        disabled={!isMobile}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className="flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              Funds
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">Wallet</h1>
            <p className="mt-1 text-sm text-white/55">Manage balances, top-ups, and withdrawals</p>
          </div>
          <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-brand-gold/25 bg-brand-gold/10 text-brand-gold">
            <WalletIcon className="h-5 w-5" />
          </div>
        </header>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Wallet overview
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Your balances</h2>
            </div>
            <Link
              href="/escrows"
              className="flex items-center gap-1 text-xs font-semibold text-brand-gold"
            >
              Track escrows <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative overflow-hidden rounded-ios-xl border border-brand-gold/25 bg-[#201a17] p-4 md:p-5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[18px] border-brand-gold/[0.06]" />
              <p className="relative text-xs font-medium text-white/55">Available balance</p>
              {walletLoading ? (
                <div className="relative mt-2 h-8 w-28 animate-pulse rounded-ios bg-white/10" />
              ) : (
                <p className="relative mt-2 text-xl md:text-3xl font-bold tracking-tight text-white">
                  {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
                </p>
              )}
              <p className="relative mt-1 text-[11px] text-white/40">Ready to use</p>
              <ButtonLink href="/wallet/topup" size="sm" className="relative mt-5 rounded-full text-xs">
                Top up
              </ButtonLink>
            </div>
            <div className="relative overflow-hidden rounded-ios-xl border border-white/10 bg-[#201a17] p-4 md:p-5">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full border-[18px] border-white/[0.04]" />
              <p className="relative text-xs font-medium text-white/55">Pending in escrow</p>
              {walletLoading ? (
                <div className="relative mt-2 h-8 w-28 animate-pulse rounded-ios bg-white/10" />
              ) : (
                <p className="relative mt-2 text-xl md:text-3xl font-bold tracking-tight text-white">
                  {wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
                </p>
              )}
              <p className="relative mt-1 text-[11px] text-white/40">Held until release</p>
              <Link
                href="/escrows"
                className="relative mt-5 inline-flex min-h-[34px] items-center rounded-full border border-white/15 bg-white/10 px-3 text-xs font-bold text-white"
              >
                Track funds
              </Link>
            </div>
          </div>
          <p className="mt-2 px-1 text-[11px] text-white/40">{lastUpdated}</p>
        </section>

        <section>
          <h2 className="px-1 text-xl font-bold tracking-tight text-white">What would you like to do?</h2>
          <div
            className={`mt-3 grid gap-3 ${
              quickActions.length > 3 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-ios-xl border border-white/10 bg-black/25 px-2 py-4 text-center transition-colors hover:border-brand-gold/30 hover:bg-white/[0.08]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-brand-gold transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold leading-tight text-white/85">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold text-white">Funding history</h2>
            <Link
              href="/wallet/topup"
              className="flex items-center gap-1 text-xs font-semibold text-brand-gold"
            >
              Top up <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 md:p-6">
            {fundingLoading ? (
              <ListRowsSkeleton rows={3} rowClassName="h-16" />
            ) : fundingHistory && fundingHistory.length > 0 ? (
              <div className="space-y-3">
                {fundingHistory.map((funding) => (
                  <div
                    key={funding.id}
                    className="flex items-center justify-between gap-3 rounded-ios-lg border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <ArrowDownCircle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                        </p>
                        <p className="truncate text-sm text-white/55">
                          {funding.sourceType} · {formatDate(funding.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PrintReceiptButton
                        receipt={buildWalletFundingReceipt(funding, receiptAccountHolder)}
                        iconOnly
                        variant="plain"
                        size="sm"
                      />
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          funding.status === 'SUCCEEDED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {funding.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-white/55 mb-4">No funding history yet</p>
                <ButtonLink href="/wallet/topup" size="sm">
                  <Plus className="h-4 w-4" />
                  Top up wallet
                </ButtonLink>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold text-white">Withdrawal history</h2>
            <Link
              href="/wallet/withdraw"
              className="flex items-center gap-1 text-xs font-semibold text-brand-gold"
            >
              Withdraw <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 md:p-6">
            {withdrawalLoading ? (
              <ListRowsSkeleton rows={3} rowClassName="h-16" />
            ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
              <div className="space-y-3">
                {withdrawalHistory.map((withdrawal: any) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between gap-3 rounded-ios-lg border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                        <ArrowUpCircle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {formatCurrency(withdrawal.amountCents, 'GHS')}
                        </p>
                        <p className="truncate text-sm text-white/55">
                          {withdrawal.methodLabel || withdrawal.methodType} ·{' '}
                          {formatPayoutSummary(
                            withdrawal.methodType,
                            withdrawal.methodDetails,
                            withdrawal.payoutSummary
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-white/40">{formatDate(withdrawal.createdAt)}</p>
                        {withdrawal.status === 'FAILED' && withdrawal.failureReason && (
                          <p className="mt-1 text-xs text-red-400">{withdrawal.failureReason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PrintReceiptButton
                        receipt={buildWithdrawalReceipt(withdrawal, receiptAccountHolder)}
                        iconOnly
                        variant="plain"
                        size="sm"
                      />
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          withdrawal.status === 'SUCCEEDED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : withdrawal.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {formatWithdrawalStatusLabel(withdrawal.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="mb-4 text-white/55">No withdrawal history yet</p>
                <ButtonLink href="/wallet/withdraw" size="sm">
                  <ArrowUpCircle className="h-4 w-4" />
                  Request withdrawal
                </ButtonLink>
              </div>
            )}
          </div>
        </section>
      </PullToRefresh>
    </Layout>
  );
}
