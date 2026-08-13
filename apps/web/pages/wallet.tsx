import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated, isAdmin, getUser } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatPayoutSummary, formatWithdrawalStatusLabel } from '@/lib/withdrawal-payout';
import { buildWalletFundingReceipt, buildWithdrawalReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import { ArrowUpCircle, Wallet as WalletIcon } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
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

  return (
    <CustomerLayout title="Wallet">
      <PullToRefresh onRefresh={refreshWallet} disabled={!isMobile} className="space-y-6 pb-4">
        <div>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">Available</p>
          {walletLoading ? (
            <div className="mt-1 h-10 w-40 animate-pulse rounded-[10px] bg-black/5" />
          ) : (
            <p className="mt-0.5 text-[34px] font-bold tracking-tight leading-tight text-gray-900">
              {formatCurrency(available, 'GHS')}
            </p>
          )}
          <ButtonLink href="/wallet/topup" variant="maroon" size="lg" className="mt-4 w-full sm:w-auto">
            Top up
          </ButtonLink>
        </div>

        <ListGroup tone="light">
          <ListRow
            href="/escrows"
            title="Pending in escrow"
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                {walletLoading ? '—' : formatCurrency(pending, 'GHS')}
              </span>
            }
          />
          <ListRow href="/wallet/withdraw" title="Withdraw" />
          <ListRow href="/wallet/payout-methods" title="Payout methods" />
          {admin && <ListRow href="/admin" title="Admin" />}
        </ListGroup>

        <ListGroup tone="light" title="Top-ups">
          {fundingLoading ? (
            <div className="px-4 py-3">
              <ListRowsSkeleton rows={3} rowClassName="h-12" />
            </div>
          ) : fundingHistory && fundingHistory.length > 0 ? (
            fundingHistory.map((funding) => (
              <ListRow
                key={funding.id}
                title={formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                subtitle={`${funding.sourceType} · ${formatDate(funding.createdAt)}`}
                trailing={
                  <div className="flex items-center gap-2">
                    <PrintReceiptButton
                      receipt={buildWalletFundingReceipt(funding, receiptAccountHolder)}
                      iconOnly
                      variant="outline"
                      size="sm"
                    />
                    <StatusBadge status={funding.status} onDark={false} />
                  </div>
                }
                showChevron={false}
              />
            ))
          ) : (
            <EmptyState
              tone="light"
              icon={<WalletIcon className="h-6 w-6" />}
              title="No top-ups yet"
              className="py-8"
            />
          )}
        </ListGroup>

        <ListGroup tone="light" title="Withdrawals">
          {withdrawalLoading ? (
            <div className="px-4 py-3">
              <ListRowsSkeleton rows={3} rowClassName="h-12" />
            </div>
          ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
            withdrawalHistory.map((withdrawal: any) => (
              <ListRow
                key={withdrawal.id}
                title={formatCurrency(withdrawal.amountCents, 'GHS')}
                subtitle={`${withdrawal.methodLabel || withdrawal.methodType} · ${formatPayoutSummary(
                  withdrawal.methodType,
                  withdrawal.methodDetails,
                  withdrawal.payoutSummary
                )}`}
                trailing={
                  <div className="flex items-center gap-2">
                    <PrintReceiptButton
                      receipt={buildWithdrawalReceipt(withdrawal, receiptAccountHolder)}
                      iconOnly
                      variant="outline"
                      size="sm"
                    />
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        withdrawal.status === 'SUCCEEDED'
                          ? 'text-emerald-700 bg-emerald-50'
                          : withdrawal.status === 'FAILED'
                            ? 'text-red-600 bg-red-50'
                            : 'text-amber-800 bg-amber-50'
                      }`}
                    >
                      {formatWithdrawalStatusLabel(withdrawal.status)}
                    </span>
                  </div>
                }
                showChevron={false}
              />
            ))
          ) : (
            <EmptyState
              tone="light"
              icon={<ArrowUpCircle className="h-6 w-6" />}
              title="No withdrawals yet"
              className="py-8"
            />
          )}
        </ListGroup>
      </PullToRefresh>
    </CustomerLayout>
  );
}
