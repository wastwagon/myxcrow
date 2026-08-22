import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { buildLedgerReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';

interface LedgerEntry {
  id: string;
  account: string;
  currency: string;
  amountCents: number;
  metadata: any;
  createdAt: string;
}

interface LedgerJournal {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  entries: LedgerEntry[];
}

interface LedgerViewProps {
  escrowId: string;
}

export default function LedgerView({ escrowId }: LedgerViewProps) {
  const { data: journals, isLoading } = useQuery<LedgerJournal[]>({
    queryKey: ['ledger', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/ledger/escrow/${escrowId}`);
      return response.data;
    },
    enabled: !!escrowId,
  });

  if (isLoading) {
    return <ListRowsSkeleton rows={3} rowClassName="h-20" />;
  }

  if (!journals || journals.length === 0) {
    return (
      <EmptyState
        tone="light"
        icon={<FileText className="w-6 h-6" />}
        title="No ledger entries"
        description="Entries appear here as this escrow is funded, released, or refunded."
        className="py-8"
      />
    );
  }

  const getAccountLabel = (account: string): string => {
    const labels: Record<string, string> = {
      buyer_wallet: 'Buyer Wallet',
      seller_wallet: 'Seller Wallet',
      escrow_hold: 'Escrow Hold',
      fees_revenue: 'Platform Fees',
    };
    return labels[account] || account.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {journals.map((journal) => (
        <div key={journal.id} className="border border-[var(--separator)] rounded-[20px] overflow-hidden">
          <div className="bg-[var(--form-input-bg)] px-4 py-3 border-b border-[var(--separator)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-medium text-gray-900">
                  {journal.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Transaction'}
                </h4>
                {journal.description && (
                  <p className="text-sm text-[rgba(60,60,67,0.6)] mt-1">{journal.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PrintReceiptButton
                  receipt={buildLedgerReceipt(journal, escrowId)}
                  iconOnly
                  variant="outline"
                  size="sm"
                  label="Print ledger receipt"
                />
                <p className="text-sm text-gray-500">{formatDate(journal.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[var(--separator)]">
            {journal.entries.map((entry) => {
              const isCredit = entry.amountCents > 0;
              return (
                <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCredit ? (
                      <TrendingUp className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-700" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {getAccountLabel(entry.account)}
                      </p>
                      {entry.metadata && typeof entry.metadata === 'object' && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.metadata.walletId && `Wallet: ${entry.metadata.walletId.slice(0, 8)}...`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isCredit ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isCredit ? '+' : ''}{formatCurrency(Math.abs(entry.amountCents), 'GHS')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

