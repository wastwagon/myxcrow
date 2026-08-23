import Link from 'next/link';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import { DISPUTE_ELIGIBLE_ESCROW_STATUSES } from '@/lib/constants';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
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
import { FileText } from 'lucide-react';
import {
  displayEscrowCents,
  formatEscrowWhen,
  type EscrowHistoryTab,
  type EscrowRecord,
} from '@/components/escrows/escrow-history-shared';

export function EscrowHistoryList({
  escrows,
  tab,
  searchTerm,
  loading,
  userId,
  isMobile,
}: {
  escrows: EscrowRecord[];
  tab: EscrowHistoryTab;
  searchTerm: string;
  loading: boolean;
  userId?: string;
  isMobile: boolean;
}) {
  if (loading) {
    return <ListRowsSkeleton rows={4} rowClassName="h-14" />;
  }

  if (escrows.length === 0) {
    const emptyCopy =
      tab === 'needs'
        ? { title: 'Nothing needs you', description: 'Funding, shipment, and release will show here.' }
        : tab === 'closed'
          ? { title: 'No closed escrows', description: 'Released, refunded, and cancelled deals land here.' }
          : searchTerm
            ? { title: 'No matches', description: 'Try a different search.' }
            : {
                title: 'No escrows',
                description: 'Protect a payment with your first escrow.',
              };

    return (
      <EmptyState
        tone="light"
        icon={<FileText className="h-6 w-6" />}
        title={emptyCopy.title}
        description={emptyCopy.description}
        action={
          tab === 'all' && !searchTerm
            ? { href: '/escrows/new', label: 'New escrow', variant: 'maroon' }
            : undefined
        }
        className="py-8"
      />
    );
  }

  const getEscrowSwipeActions = (escrow: EscrowRecord) => {
    const actions: { label: string; href: string; variant?: 'default' | 'destructive' }[] = [
      { label: 'Open', href: `/escrows/${escrow.id}` },
    ];
    if (DISPUTE_ELIGIBLE_ESCROW_STATUSES.includes(escrow.status)) {
      actions.push({
        label: 'Dispute',
        href: `/disputes/new?escrowId=${escrow.id}`,
        variant: 'destructive',
      });
    }
    return actions;
  };

  return (
    <>
      <PhoneOnly>
        <div className="space-y-2.5">
          {escrows.map((escrow) => {
            const isBuyer = userId === escrow.buyerId;
            const cents = displayEscrowCents(escrow, isBuyer);
            return (
              <SwipeableListRow
                key={escrow.id}
                disabled={!isMobile}
                actions={getEscrowSwipeActions(escrow)}
              >
                <Link
                  href={`/escrows/${escrow.id}`}
                  className="flex min-h-[44px] items-start justify-between gap-3 rounded-[16px] bg-white px-4 py-3.5 touch-manipulation active:bg-black/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold leading-[22px] text-gray-900">
                      {escrow.description || 'Escrow'}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[rgba(60,60,67,0.6)]">
                      {formatEscrowWhen(escrow.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[rgba(60,60,67,0.45)]">
                      {isBuyer ? 'You funded' : 'You receive'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'text-[17px] font-semibold tabular-nums',
                        isBuyer ? 'text-[#c41c1c]' : 'text-emerald-700'
                      )}
                    >
                      {isBuyer ? '−' : '+'}
                      {formatCurrency(cents, 'GHS')}
                    </p>
                    <StatusBadge status={escrow.status} onDark={false} className="mt-1" />
                  </div>
                </Link>
              </SwipeableListRow>
            );
          })}
        </div>
      </PhoneOnly>
      <DesktopOnly>
        <TableShell tone="light" stickyHeader={false}>
          <Table>
            <TableHead>
              <tr>
                <TableTh>Escrow</TableTh>
                <TableTh numeric>Amount</TableTh>
                <TableTh>Side</TableTh>
                <TableTh>Status</TableTh>
                <TableTh>When</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {escrows.map((escrow) => {
                const isBuyer = userId === escrow.buyerId;
                const cents = displayEscrowCents(escrow, isBuyer);
                return (
                  <TableRow key={escrow.id}>
                    <TableTd>
                      <Link
                        href={`/escrows/${escrow.id}`}
                        className="block min-h-[44px] min-w-0 py-1"
                      >
                        <p className="truncate font-semibold text-gray-900">
                          {escrow.description || 'Escrow'}
                        </p>
                        <p className="text-[13px] text-[rgba(60,60,67,0.6)]">
                          {formatEscrowWhen(escrow.createdAt)}
                        </p>
                      </Link>
                    </TableTd>
                    <TableTd numeric>
                      <span
                        className={cn(
                          'font-semibold',
                          isBuyer ? 'text-[#c41c1c]' : 'text-emerald-700'
                        )}
                      >
                        {isBuyer ? '−' : '+'}
                        {formatCurrency(cents, 'GHS')}
                      </span>
                    </TableTd>
                    <TableTd muted>{isBuyer ? 'Funded' : 'Receive'}</TableTd>
                    <TableTd>
                      <StatusBadge status={escrow.status} onDark={false} />
                    </TableTd>
                    <TableTd muted>{formatDateShort(escrow.createdAt)}</TableTd>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableShell>
      </DesktopOnly>
    </>
  );
}
