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
    <div className={`rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm ${className}`}>
      <p className="font-semibold text-white">Transaction Summary</p>
      <div className="flex justify-between text-white/80">
        <span>Deal amount</span>
        <span className="font-medium text-white">{formatCurrency(fees.amountCents, currency)}</span>
      </div>
      {hasBuyerFee && (
        <div className="flex justify-between text-white/80">
          <span>Your fee ({formatPaidByLabel(fees.paidBy) === 'Split (50/50)' ? 'your share' : 'platform fee'})</span>
          <span className="font-medium text-amber-300">+ {formatCurrency(fees.buyerFeeCents, currency)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-white/10">
        <span className="font-medium text-white">Total from your wallet</span>
        <span className="font-bold text-white">{formatCurrency(fees.fundingAmountCents, currency)}</span>
      </div>
      {hasSellerFee && (
        <div className="flex justify-between text-white/80">
          <span>Seller receives (after fee)</span>
          <span className="font-medium text-emerald-400">{formatCurrency(fees.netAmountCents, currency)}</span>
        </div>
      )}
      {fees.feeCents > 0 && (
        <div className="flex justify-between text-xs text-white/55 pt-1">
          <span>Platform fee ({fees.feePercentage}% · {formatPaidByLabel(fees.paidBy)})</span>
          <span>{formatCurrency(fees.feeCents, currency)}</span>
        </div>
      )}
    </div>
  );
}
