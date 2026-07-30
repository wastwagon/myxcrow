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
  Building2,
  ArrowRight,
  Wallet as WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { DonutMetric } from '@/components/dashboard/DonutMetric';
import { dash } from '@/components/dashboard/lightClasses';
import { StatusBadge } from '@/components/StatusBadge';

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
    queryFn: async () => (await apiClient.get('/wallet')).data,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: fundingHistory, isLoading: fundingLoading } = useQuery<any[]>({
    queryKey: ['wallet-funding'],
    queryFn: async () => (await apiClient.get('/wallet/funding-history?limit=20')).data,
  });

  const { data: withdrawalHistory, isLoading: withdrawalLoading } = useQuery<any[]>({
    queryKey: ['wallet-withdrawals'],
    queryFn: async () => (await apiClient.get('/wallet/withdrawal-history?limit=20')).data,
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

  const available = wallet?.availableCents ?? 0;
  const pending = wallet?.pendingCents ?? 0;
  const walletTotal = available + pending || 1;
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
      <PullToRefresh onRefresh={refreshWallet} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                Funds
              </p>
              <h1 className={dash.title}>Wallet</h1>
              <p className={dash.subtitle}>Manage balances, top-ups, and withdrawals</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/wallet/topup" variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Top up
              </ButtonLink>
              <ButtonLink href="/wallet/withdraw" variant="maroon" size="sm">
                <ArrowUpCircle className="w-4 h-4" />
                Withdraw
              </ButtonLink>
            </div>
          </div>

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
                <p className="mt-1 text-xs text-gray-500">Ready to use</p>
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
                <Link href="/escrows" className={`${dash.link} mt-1 inline-flex items-center gap-1`}>
                  Track funds <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </LightPanel>
          </div>
          <p className="text-xs text-gray-500 -mt-2">{lastUpdated}</p>

          <LightPanel>
            <h2 className={`${dash.sectionTitle} mb-3`}>Quick actions</h2>
            <div
              className={`grid gap-2 ${
                quickActions.length > 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
              }`}
            >
              {quickActions.map(({ href, label, icon: Icon }) => (
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className={dash.sectionTitle}>Funding history</h2>
              <Link href="/wallet/topup" className={dash.link}>
                Top up
              </Link>
            </div>
            <div className="p-3">
              {fundingLoading ? (
                <ListRowsSkeleton rows={3} rowClassName="h-14" />
              ) : fundingHistory && fundingHistory.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {fundingHistory.map((funding) => (
                    <li
                      key={funding.id}
                      className="flex items-center justify-between gap-3 px-1 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <ArrowDownCircle className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {funding.sourceType} · {formatDate(funding.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PrintReceiptButton
                          receipt={buildWalletFundingReceipt(funding, receiptAccountHolder)}
                          iconOnly
                          variant="outline"
                          size="sm"
                        />
                        <StatusBadge status={funding.status} onDark={false} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  tone="light"
                  icon={<WalletIcon className="h-6 w-6" />}
                  title="No funding history yet"
                  action={{ href: '/wallet/topup', label: 'Top up wallet', variant: 'maroon' }}
                  className="border-0 shadow-none py-8"
                />
              )}
            </div>
          </LightPanel>

          <LightPanel flush>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className={dash.sectionTitle}>Withdrawal history</h2>
              <Link href="/wallet/withdraw" className={dash.link}>
                Withdraw
              </Link>
            </div>
            <div className="p-3">
              {withdrawalLoading ? (
                <ListRowsSkeleton rows={3} rowClassName="h-14" />
              ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {withdrawalHistory.map((withdrawal: any) => (
                    <li
                      key={withdrawal.id}
                      className="flex items-center justify-between gap-3 px-1 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <ArrowUpCircle className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(withdrawal.amountCents, 'GHS')}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {withdrawal.methodLabel || withdrawal.methodType} ·{' '}
                            {formatPayoutSummary(
                              withdrawal.methodType,
                              withdrawal.methodDetails,
                              withdrawal.payoutSummary
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDate(withdrawal.createdAt)}
                          </p>
                          {withdrawal.status === 'FAILED' && withdrawal.failureReason && (
                            <p className="mt-1 text-xs text-red-600">{withdrawal.failureReason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PrintReceiptButton
                          receipt={buildWithdrawalReceipt(withdrawal, receiptAccountHolder)}
                          iconOnly
                          variant="outline"
                          size="sm"
                        />
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                            withdrawal.status === 'SUCCEEDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : withdrawal.status === 'FAILED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {formatWithdrawalStatusLabel(withdrawal.status)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  tone="light"
                  icon={<ArrowUpCircle className="h-6 w-6" />}
                  title="No withdrawal history yet"
                  action={{
                    href: '/wallet/withdraw',
                    label: 'Request withdrawal',
                    variant: 'maroon',
                  }}
                  className="border-0 shadow-none py-8"
                />
              )}
            </div>
          </LightPanel>
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
