import { formatCurrency, formatDate } from '@/lib/utils';
import { formatPayoutSummary, formatWithdrawalStatusLabel } from '@/lib/withdrawal-payout';
import { buildWalletFundingReceipt, buildWithdrawalReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Banknote, FileText } from 'lucide-react';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { StatusBadge } from '@/components/StatusBadge';
import { PhoneOnly, DesktopOnly } from '@/components/ui/PhoneOnly';
import { IconWell } from '@/components/ui/IconWell';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table';
import type { TransactionFilter } from '@/components/wallet/TransactionFilterCards';

interface ReceiptAccountHolder {
  name?: string;
  email?: string;
  phone?: string;
  userId?: string;
}

function RecentTransactionsFootnote() {
  return (
    <p className="px-1 pt-1 text-center text-[12px] text-[rgba(60,60,67,0.45)]">
      Showing your 20 most recent transactions
    </p>
  );
}

export function TransactionHistory({
  filter,
  fundingHistory,
  withdrawalHistory,
  fundingLoading,
  withdrawalLoading,
  receiptAccountHolder,
}: {
  filter: TransactionFilter;
  fundingHistory?: any[];
  withdrawalHistory?: any[];
  fundingLoading: boolean;
  withdrawalLoading: boolean;
  receiptAccountHolder?: ReceiptAccountHolder;
}) {
  const loading = filter === 'topups' ? fundingLoading : withdrawalLoading;

  if (loading) {
    return <ListRowsSkeleton rows={4} rowClassName="h-12" />;
  }

  if (filter === 'topups') {
    if (!fundingHistory?.length) {
      return (
        <EmptyState
          tone="light"
          icon={<FileText className="h-6 w-6" />}
          title="No top-ups yet"
          description="Add funds via mobile money or card to start using your wallet."
          action={{ href: '/wallet/topup', label: 'Top up wallet', variant: 'maroon' }}
        />
      );
    }

    return (
      <>
        <PhoneOnly>
          <ListGroup tone="light">
            {fundingHistory.map((funding) => (
              <ListRow
                key={funding.id}
                title={formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                subtitle={`${funding.sourceType} · ${formatDate(funding.createdAt)}`}
                leading={<IconWell icon={FileText} color="green" />}
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
            ))}
          </ListGroup>
        </PhoneOnly>
        <DesktopOnly>
          <TableShell tone="light">
            <Table>
              <TableHead>
                <tr>
                  <TableTh numeric>Amount</TableTh>
                  <TableTh>Source</TableTh>
                  <TableTh>When</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh numeric>Receipt</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {fundingHistory.map((funding) => (
                  <TableRow key={funding.id}>
                    <TableTd numeric className="font-semibold">
                      {formatCurrency(Math.abs(funding.amountCents), 'GHS')}
                    </TableTd>
                    <TableTd muted>{funding.sourceType}</TableTd>
                    <TableTd muted>{formatDate(funding.createdAt)}</TableTd>
                    <TableTd>
                      <StatusBadge status={funding.status} onDark={false} />
                    </TableTd>
                    <TableTd numeric>
                      <PrintReceiptButton
                        receipt={buildWalletFundingReceipt(funding, receiptAccountHolder)}
                        iconOnly
                        variant="outline"
                        size="sm"
                      />
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </DesktopOnly>
        <RecentTransactionsFootnote />
      </>
    );
  }

  if (!withdrawalHistory?.length) {
    return (
      <EmptyState
        tone="light"
        icon={<Banknote className="h-6 w-6" />}
        title="No withdrawals yet"
        description="Cash out to your bank or mobile money when your balance is ready."
        action={{ href: '/wallet/withdraw', label: 'Withdraw funds', variant: 'maroon' }}
      />
    );
  }

  return (
    <>
      <PhoneOnly>
        <ListGroup tone="light">
          {withdrawalHistory.map((withdrawal: any) => (
            <ListRow
              key={withdrawal.id}
              title={formatCurrency(withdrawal.amountCents, 'GHS')}
              subtitle={`${withdrawal.methodLabel || withdrawal.methodType} · ${formatPayoutSummary(
                withdrawal.methodType,
                withdrawal.methodDetails,
                withdrawal.payoutSummary
              )}`}
              leading={<IconWell icon={Banknote} color="maroon" />}
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
          ))}
        </ListGroup>
      </PhoneOnly>
      <DesktopOnly>
        <TableShell tone="light">
          <Table>
            <TableHead>
              <tr>
                <TableTh numeric>Amount</TableTh>
                <TableTh>Method</TableTh>
                <TableTh>When</TableTh>
                <TableTh>Status</TableTh>
                <TableTh numeric>Receipt</TableTh>
              </tr>
            </TableHead>
            <TableBody>
              {withdrawalHistory.map((withdrawal: any) => (
                <TableRow key={withdrawal.id}>
                  <TableTd numeric className="font-semibold">
                    {formatCurrency(withdrawal.amountCents, 'GHS')}
                  </TableTd>
                  <TableTd>
                    <p className="truncate">{withdrawal.methodLabel || withdrawal.methodType}</p>
                    <p className="text-[13px] text-[rgba(60,60,67,0.6)] truncate">
                      {formatPayoutSummary(
                        withdrawal.methodType,
                        withdrawal.methodDetails,
                        withdrawal.payoutSummary
                      )}
                    </p>
                  </TableTd>
                  <TableTd muted>{formatDate(withdrawal.createdAt)}</TableTd>
                  <TableTd>
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
                  </TableTd>
                  <TableTd numeric>
                    <PrintReceiptButton
                      receipt={buildWithdrawalReceipt(withdrawal, receiptAccountHolder)}
                      iconOnly
                      variant="outline"
                      size="sm"
                    />
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </DesktopOnly>
      <RecentTransactionsFootnote />
    </>
  );
}
