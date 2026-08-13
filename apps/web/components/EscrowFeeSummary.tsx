import { formatCurrency } from '@/lib/utils';
import { formatPaidByLabel, type FeeCalculationResult } from '@/lib/fee-calculator';

interface EscrowFeeSummaryProps {
  fees: FeeCalculationResult | null;
  currency?: string;
  className?: string;
}

export default function EscrowFeeSummary({ fees, currency = 'GHS', className = '' }: EscrowFeeSummaryProps) {
  if (!fees || fees.amountCents < 1) return null;

  const hasBuyerFee = fees.buyerFeeCents > 0;
  const hasSellerFee = fees.sellerFeeCents > 0;

  return (
    <div
      className={`rounded-[12px] border border-[var(--form-panel-border)] bg-[var(--form-input-bg)] p-4 space-y-2 text-sm ${className}`}
    >
      <p className="font-semibold text-[var(--form-input-text)]">Summary</p>
      <div className="flex justify-between text-[var(--form-label)]">
        <span>Deal amount</span>
        <span className="font-medium text-[var(--form-input-text)]">
          {formatCurrency(fees.amountCents, currency)}
        </span>
      </div>
      {hasBuyerFee && (
        <div className="flex justify-between text-[var(--form-label)]">
          <span>
            Your fee (
            {formatPaidByLabel(fees.paidBy) === 'Split (50/50)' ? 'your share' : 'platform fee'})
          </span>
          <span className="font-medium text-amber-700">
            + {formatCurrency(fees.buyerFeeCents, currency)}
          </span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-[var(--form-panel-border,rgba(60,60,67,0.12))]">
        <span className="font-medium text-[var(--form-input-text)]">Total from your wallet</span>
        <span className="font-bold text-[var(--form-input-text)]">
          {formatCurrency(fees.fundingAmountCents, currency)}
        </span>
      </div>
      {hasSellerFee && (
        <div className="flex justify-between text-[var(--form-label)]">
          <span>Seller receives (after fee)</span>
          <span className="font-medium text-emerald-700">
            {formatCurrency(fees.netAmountCents, currency)}
          </span>
        </div>
      )}
      {fees.feeCents > 0 && (
        <div className="flex justify-between text-xs text-[var(--form-label)] pt-1">
          <span>
            Platform fee ({fees.feePercentage}% · {formatPaidByLabel(fees.paidBy)})
          </span>
          <span>{formatCurrency(fees.feeCents, currency)}</span>
        </div>
      )}
    </div>
  );
}
