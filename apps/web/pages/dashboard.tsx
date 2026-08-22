import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { FileText, Plus, Wallet, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { IconWell } from '@/components/ui/IconWell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import { PhoneOnly, DesktopOnly } from '@/components/ui/PhoneOnly';
import { TitleBadge } from '@/components/ui/TitleBadge';
import { dash } from '@/components/dashboard/lightClasses';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table';
import Link from 'next/link';

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
    enabled: mounted && isAuthenticated() && !isAdmin(),
  });

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => (await apiClient.get('/escrows')).data,
    enabled: mounted && isAuthenticated() && !isAdmin(),
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  if (!mounted || !isAuthenticated() || isAdmin()) {
    return <PageSpinner />;
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
    <CustomerLayout title="Home">
      <PullToRefresh onRefresh={refreshDashboard} disabled={!isMobile} className="space-y-6 pb-4">
        <div>
          {userName ? (
            <p className="mb-3">
              <TitleBadge>Hi, {userName}</TitleBadge>
            </p>
          ) : null}
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">Available</p>
          {walletLoading ? (
            <div className="mt-1 h-10 w-40 animate-pulse rounded-[16px] bg-black/5" />
          ) : (
            <p className={`mt-0.5 ${dash.value} leading-tight`}>
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
            leading={<IconWell icon={Wallet} color="orange" />}
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                {walletLoading ? '—' : formatCurrency(pending, 'GHS')}
              </span>
            }
          />
          <ListRow
            href="/escrows"
            title="Active"
            leading={<IconWell icon={Shield} color="maroon" />}
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">{activeEscrows.length}</span>
            }
          />
          <ListRow
            href="/escrows"
            title="Awaiting you"
            leading={<IconWell icon={Clock} color="teal" />}
            trailing={
              <span className="text-[17px] text-[rgba(60,60,67,0.6)]">{awaiting.length}</span>
            }
          />
          <ListRow
            href="/escrows"
            title="Completed"
            leading={<IconWell icon={CheckCircle2} color="green" />}
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

        {escrowsLoading ? (
          <ListGroup tone="light" title="Recent">
            <div className="px-4 py-3">
              <ListRowsSkeleton rows={4} rowClassName="h-12" />
            </div>
          </ListGroup>
        ) : recentEscrows.length > 0 ? (
          <>
            <PhoneOnly>
              <ListGroup tone="light" title="Recent">
                {recentEscrows.map((escrow) => {
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
                })}
              </ListGroup>
            </PhoneOnly>
            <DesktopOnly>
              <div className="space-y-1.5">
                <p className="px-4 text-[13px] font-normal text-[rgba(60,60,67,0.6)]">Recent</p>
                <TableShell tone="light">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableTh>Escrow</TableTh>
                        <TableTh numeric>Amount</TableTh>
                        <TableTh>Status</TableTh>
                        <TableTh>When</TableTh>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {recentEscrows.map((escrow) => {
                        const isBuyer = user?.id === escrow.buyerId;
                        const displayCents = isBuyer
                          ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                          : escrow.netAmountCents ?? escrow.amountCents;
                        return (
                          <TableRow key={escrow.id}>
                            <TableTd>
                              <Link href={`/escrows/${escrow.id}`} className="block min-w-0 min-h-[44px] py-1">
                                <p className="font-semibold text-gray-900 truncate">
                                  {escrow.description || 'Escrow'}
                                </p>
                                <p className="text-[13px] text-[rgba(60,60,67,0.6)]">
                                  {isBuyer ? 'Funded' : 'Receive'}
                                </p>
                              </Link>
                            </TableTd>
                            <TableTd numeric>{formatCurrency(displayCents, 'GHS')}</TableTd>
                            <TableTd>
                              <StatusBadge status={escrow.status} onDark={false} />
                            </TableTd>
                            <TableTd muted>{formatDate(escrow.createdAt)}</TableTd>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableShell>
              </div>
            </DesktopOnly>
          </>
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
      </PullToRefresh>
    </CustomerLayout>
  );
}
