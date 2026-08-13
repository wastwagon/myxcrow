import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { FileText, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';

interface WalletData {
  availableCents: number;
  pendingCents: number;
  currency: string;
}

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  fundingAmountCents?: number;
  netAmountCents?: number;
  buyerFeeCents?: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [userName, setUserName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      if (isAdmin()) {
        router.push('/admin');
        return;
      }
      const user = getUser();
      if (user) {
        setUserName(user.firstName || user.email?.split('@')[0] || '');
      }
    }
  }, [router, mounted]);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
    staleTime: 0,
    refetchInterval: 30000,
    enabled: mounted && isAuthenticated(),
  });

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => (await apiClient.get('/escrows')).data,
    enabled: mounted && isAuthenticated(),
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-brand-maroon" />
      </div>
    );
  }

  const user = getUser();
  const available = wallet?.availableCents ?? 0;
  const pending = wallet?.pendingCents ?? 0;
  const activeEscrows = escrows.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status));
  const awaiting = escrows.filter((e) =>
    ['AWAITING_FUNDING', 'AWAITING_SHIPMENT', 'AWAITING_RELEASE'].includes(e.status)
  );
  const completed = escrows.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status));
  const recentEscrows = [...escrows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['escrows'] }),
    ]);
  };

  return (
    <CustomerLayout title={userName || 'Home'}>
      <PullToRefresh onRefresh={refreshDashboard} disabled={!isMobile} className="space-y-6 pb-4">
        <div>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">Available</p>
          {walletLoading ? (
            <div className="mt-1 h-10 w-40 animate-pulse rounded-[10px] bg-black/5" />
          ) : (
            <p className="mt-0.5 text-[34px] font-bold tracking-tight leading-tight text-gray-900">
              {formatCurrency(available, 'GHS')}
            </p>
          )}
          <ButtonLink
            href="/escrows/new"
            variant="maroon"
            size="lg"
            className="mt-4 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            New escrow
          </ButtonLink>
        </div>

        <ListGroup tone="light" title="Overview">
          <ListRow
            href="/wallet"
            title="Pending in escrow"
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                {walletLoading ? '—' : formatCurrency(pending, 'GHS')}
              </span>
            }
          />
          <ListRow
            href="/escrows"
            title="Active"
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">{activeEscrows.length}</span>
            }
          />
          <ListRow
            href="/escrows"
            title="Awaiting you"
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">{awaiting.length}</span>
            }
          />
          <ListRow
            href="/escrows"
            title="Completed"
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">{completed.length}</span>
            }
          />
        </ListGroup>

        {user?.kycStatus !== 'VERIFIED' && (
          <ListGroup
            tone="light"
            footer="Add your details so we can verify your identity."
          >
            <ListRow href="/profile" title="Complete profile" />
          </ListGroup>
        )}

        <ListGroup tone="light" title="Recent">
          {escrowsLoading ? (
            <div className="px-4 py-3">
              <ListRowsSkeleton rows={4} rowClassName="h-12" />
            </div>
          ) : recentEscrows.length > 0 ? (
            recentEscrows.map((escrow) => {
              const isBuyer = user?.id === escrow.buyerId;
              const displayCents = isBuyer
                ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                : escrow.netAmountCents ?? escrow.amountCents;
              return (
                <ListRow
                  key={escrow.id}
                  href={`/escrows/${escrow.id}`}
                  title={escrow.description || 'Escrow'}
                  subtitle={`${formatDate(escrow.createdAt)} · ${isBuyer ? 'Funded' : 'Receive'}`}
                  trailing={
                    <div className="text-right">
                      <p className="text-[15px] font-semibold text-gray-900">
                        {formatCurrency(displayCents, 'GHS')}
                      </p>
                      <StatusBadge status={escrow.status} onDark={false} className="mt-0.5" />
                    </div>
                  }
                />
              );
            })
          ) : (
            <EmptyState
              tone="light"
              icon={<FileText className="w-6 h-6" />}
              title="No escrows yet"
              description="Create an escrow to protect a payment."
              action={{ href: '/escrows/new', label: 'New escrow', variant: 'maroon' }}
              className="py-8"
            />
          )}
        </ListGroup>
      </PullToRefresh>
    </CustomerLayout>
  );
}
