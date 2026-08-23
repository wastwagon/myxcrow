import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AdminGate } from '@/components/admin/AdminGate';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { ButtonLink } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { PageDetailSkeleton } from '@/components/LoadingSkeleton';
import { LightShell } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminViewWalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const { userId } = router.query;

  const refreshAdminWallet = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-wallet', userId] });
  };

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-wallet', userId],
    queryFn: async () => {
      const r = await apiClient.get(`/wallet/admin/${userId}`);
      return r.data;
    },
    enabled: !!userId && isAuthenticated() && isAdmin(),
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['admin-wallet-transactions', userId],
    queryFn: async () => (await apiClient.get(`/wallet/admin/${userId}/transactions?limit=10`)).data,
    enabled: !!userId && isAuthenticated() && isAdmin(),
  });

  if (isLoading) {
    return (
      <AdminGate title="Wallet">
        <PageDetailSkeleton />
      </AdminGate>
    );
  }

  if (error || !data) {
    return (
      <AdminGate title="Wallet">
        <EmptyState
          tone="light"
          title="Wallet unavailable"
          description="This wallet could not be loaded. Go back to users and try again."
          action={{ href: '/admin/users', label: 'View users', variant: 'maroon' }}
        />
      </AdminGate>
    );
  }

  const { wallet, user } = data;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';

  return (
    <AdminGate title="Wallet">
      <PullToRefresh onRefresh={refreshAdminWallet} disabled={!isMobile}>
        <LightShell>
          <p className={dash.subtitle}>{user?.email}</p>

          <ListGroup tone="light" title="User">
            <ListRow
              title={displayName}
              subtitle={user?.email}
              leading={<UserAvatar label={displayName} size="md" variant="maroon" />}
              showChevron={false}
            />
          </ListGroup>

          <ListGroup tone="light" title="Balances">
            <ListRow
              title="Available"
              trailing={
                <span className="text-[17px] font-semibold text-gray-900">
                  {formatCurrency(wallet?.availableCents ?? 0, wallet?.currency ?? 'GHS')}
                </span>
              }
              showChevron={false}
            />
            <ListRow
              title="Pending"
              trailing={
                <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                  {formatCurrency(wallet?.pendingCents ?? 0, wallet?.currency ?? 'GHS')}
                </span>
              }
              showChevron={false}
            />
            <ListRow
              title="Currency"
              trailing={
                <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                  {wallet?.currency ?? 'GHS'}
                </span>
              }
              showChevron={false}
            />
          </ListGroup>

          <ListGroup tone="light" title="Recent activity">
            {transactions.length === 0 ? (
              <ListRow title="No transactions yet" showChevron={false} />
            ) : (
              transactions.map((tx: { id: string; amountCents: number; sourceType?: string; type?: string; createdAt: string }) => (
                <ListRow
                  key={tx.id}
                  title={formatCurrency(Math.abs(tx.amountCents), wallet?.currency ?? 'GHS')}
                  subtitle={`${tx.sourceType || tx.type || 'Transaction'} · ${formatDate(tx.createdAt)}`}
                  showChevron={false}
                />
              ))
            )}
          </ListGroup>

          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonLink href={`/admin/wallet/credit?userId=${userId}`} variant="maroon" size="lg">
              Credit
            </ButtonLink>
            <ButtonLink href={`/admin/wallet/debit?userId=${userId}`} variant="outline" size="lg">
              Debit
            </ButtonLink>
            <ButtonLink href="/admin/users" variant="outline" size="lg">
              Users
            </ButtonLink>
          </div>
        </LightShell>
      </PullToRefresh>
    </AdminGate>
  );
}
