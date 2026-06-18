export type FeePaidBy = 'buyer' | 'seller' | 'split';

export interface FeeSettingsInput {
  percentage: number;
  fixedCents: number;
  paidBy: FeePaidBy | string;
}

export interface FeeCalculationResult {
  amountCents: number;
  feeCents: number;
  feePercentage: number;
  buyerFeeCents: number;
  sellerFeeCents: number;
  fundingAmountCents: number;
  netAmountCents: number;
  paidBy: string;
}

export function calculateEscrowFees(
  amountCents: number,
  settings: FeeSettingsInput,
): FeeCalculationResult {
  const paidBy = (settings.paidBy || 'buyer') as FeePaidBy;
  const percentageFee = Math.round((amountCents * settings.percentage) / 100);
  const totalFee = percentageFee + settings.fixedCents;

  const buyerPercentageFee =
    paidBy === 'split' ? Math.round(percentageFee / 2) : paidBy === 'buyer' ? percentageFee : 0;
  const sellerPercentageFee = percentageFee - buyerPercentageFee;

  const buyerFixedFee =
    paidBy === 'split'
      ? Math.floor(settings.fixedCents / 2)
      : paidBy === 'buyer'
        ? settings.fixedCents
        : 0;
  const sellerFixedFee = settings.fixedCents - buyerFixedFee;

  const buyerFeeCents = buyerPercentageFee + buyerFixedFee;
  const sellerFeeCents = sellerPercentageFee + sellerFixedFee;

  return {
    amountCents,
    feeCents: totalFee,
    feePercentage: settings.percentage,
    buyerFeeCents,
    sellerFeeCents,
    fundingAmountCents: amountCents + buyerFeeCents,
    netAmountCents: amountCents - sellerFeeCents,
    paidBy,
  };
}

export function formatPaidByLabel(paidBy: string): string {
  switch (paidBy) {
    case 'buyer':
      return 'Buyer';
    case 'seller':
      return 'Seller';
    case 'split':
      return 'Split (50/50)';
    default:
      return paidBy;
  }
}
