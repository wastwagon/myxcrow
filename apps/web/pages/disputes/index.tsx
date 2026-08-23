import CustomerLayout from '@/components/CustomerLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDateShort } from '@/lib/utils';
import { AlertCircle, Scale } from 'lucide-react';
import { IconWell } from '@/components/ui/IconWell';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import { SwipeableListRow } from '@/components/ui/SwipeableListRow';
import { PhoneOnly, DesktopOnly } from '@/components/ui/PhoneOnly';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import Link from 'next/link';

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

export default function DisputesPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ['disputes'],
    queryFn: async () => (await apiClient.get('/disputes')).data,
    enabled: authed,
  });

  if (!authed) {
    return <PageSpinner />;
  }

  const refreshDisputes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['disputes'] });
  };

  return (
    <CustomerLayout title="Disputes" variant="home">
      <PullToRefresh onRefresh={refreshDisputes} disabled={!isMobile}>
        <CustomerShellChrome screenTitle="Disputes" />
        <div className={SHELL_CONTENT_CLASS}>
        {isLoading ? (
          <ListRowsSkeleton rows={3} />
        ) : disputes && disputes.length > 0 ? (
          <>
            <PhoneOnly>
              <ListGroup tone="light">
                {disputes.map((dispute) => (
                  <SwipeableListRow
                    key={dispute.id}
                    disabled={!isMobile}
                    actions={[
                      { label: 'Open', href: `/disputes/${dispute.id}` },
                      { label: 'Escrow', href: `/escrows/${dispute.escrowId}` },
                    ]}
                  >
                    <ListRow
                      href={`/disputes/${dispute.id}`}
                      leading={<IconWell icon={AlertCircle} color="orange" />}
                      title={dispute.reason.replace(/_/g, ' ')}
                      subtitle={`Escrow ${dispute.escrowId.slice(0, 8)}… · ${formatDateShort(dispute.createdAt)}`}
                      trailing={<StatusBadge status={dispute.status} onDark={false} />}
                    />
                  </SwipeableListRow>
                ))}
              </ListGroup>
            </PhoneOnly>
            <DesktopOnly>
              <TableShell tone="light">
                <Table>
                  <TableHead>
                    <tr>
                      <TableTh>Reason</TableTh>
                      <TableTh>Escrow</TableTh>
                      <TableTh>Opened</TableTh>
                      <TableTh>Status</TableTh>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableTd>
                          <Link href={`/disputes/${dispute.id}`} className="block min-w-0 min-h-[44px] py-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {dispute.reason.replace(/_/g, ' ')}
                            </p>
                          </Link>
                        </TableTd>
                        <TableTd>
                          <Link
                            href={`/escrows/${dispute.escrowId}`}
                            className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-brand-maroon hover:text-brand-maroon-dark touch-manipulation"
                          >
                            {dispute.escrowId.slice(0, 8)}…
                          </Link>
                        </TableTd>
                        <TableTd muted>{formatDateShort(dispute.createdAt)}</TableTd>
                        <TableTd>
                          <StatusBadge status={dispute.status} onDark={false} />
                        </TableTd>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableShell>
            </DesktopOnly>
          </>
        ) : (
          <EmptyState
            tone="light"
            icon={<Scale className="h-6 w-6" />}
            title="No disputes"
            description="Cases you open on an escrow will show up here."
            action={{ href: '/escrows/history', label: 'View escrows', variant: 'maroon' }}
          />
        )}
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
