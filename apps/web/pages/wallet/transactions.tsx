import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import {
  TransactionFilterCards,
  type TransactionFilter,
  type TransactionFilterOption,
} from '@/components/wallet/TransactionFilterCards';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

const FILTER_OPTIONS: Omit<TransactionFilterOption, 'count'>[] = [
  {
    value: 'topups',
    label: 'Top-ups',
    subtitle: 'Recent top-ups',
    icon: ArrowDownToLine,
    color: 'green',
  },
  {
    value: 'withdrawals',
    label: 'Withdrawals',
    subtitle: 'Recent payouts',
    icon: ArrowUpFromLine,
    color: 'maroon',
  },
];

function parseFilter(value: string | string[] | undefined): TransactionFilter {
  return value === 'withdrawals' ? 'withdrawals' : 'topups';
}

export default function WalletTransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const [filter, setFilter] = useState<TransactionFilter>('topups');

  useEffect(() => {
    if (!router.isReady) return;
    setFilter(parseFilter(router.query.type));
  }, [router.isReady, router.query.type]);

  const { data: fundingHistory, isLoading: fundingLoading } = useQuery<any[]>({
    queryKey: ['wallet-funding'],
    queryFn: async () => (await apiClient.get('/wallet/funding-history?limit=20')).data,
    enabled: authed,
  });

  const { data: withdrawalHistory, isLoading: withdrawalLoading } = useQuery<any[]>({
    queryKey: ['wallet-withdrawals'],
    queryFn: async () => (await apiClient.get('/wallet/withdrawal-history?limit=20')).data,
    enabled: authed,
  });

  if (!authed) {
    return <PageSpinner />;
  }

  const refreshTransactions = async () => {
    await Promise.all([
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

  const filterOptions: TransactionFilterOption[] = FILTER_OPTIONS;

  const selectFilter = (next: TransactionFilter) => {
    setFilter(next);
    router.replace({ pathname: '/wallet/transactions', query: { type: next } }, undefined, {
      shallow: true,
    });
  };

  return (
    <CustomerLayout title="Transactions" back>
      <PullToRefresh onRefresh={refreshTransactions} disabled={!isMobile} className="space-y-5 pb-4">
        <TransactionFilterCards options={filterOptions} value={filter} onChange={selectFilter} />
        <TransactionHistory
          filter={filter}
          fundingHistory={fundingHistory}
          withdrawalHistory={withdrawalHistory}
          fundingLoading={fundingLoading}
          withdrawalLoading={withdrawalLoading}
          receiptAccountHolder={receiptAccountHolder}
        />
      </PullToRefresh>
    </CustomerLayout>
  );
}
