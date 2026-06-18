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

/** Proportional seller fee for a partial payout (e.g. milestone). */
export function proportionalSellerFeeCents(
  portionAmountCents: number,
  dealAmountCents: number,
  totalSellerFeeCents: number,
): number {
  if (dealAmountCents <= 0 || totalSellerFeeCents <= 0 || portionAmountCents <= 0) return 0;
  return Math.round((portionAmountCents * totalSellerFeeCents) / dealAmountCents);
}

/** Net seller payout for a portion of the deal amount after seller fee share. */
export function netSellerPayoutCents(
  portionAmountCents: number,
  dealAmountCents: number,
  totalSellerFeeCents: number,
): number {
  return portionAmountCents - proportionalSellerFeeCents(portionAmountCents, dealAmountCents, totalSellerFeeCents);
}

export function resolveFundingAmountCents(escrow: {
  fundingAmountCents?: number | null;
  amountCents: number;
  buyerFeeCents?: number | null;
}): number {
  if (escrow.fundingAmountCents && escrow.fundingAmountCents > 0) {
    return escrow.fundingAmountCents;
  }
  return escrow.amountCents + (escrow.buyerFeeCents ?? 0);
}
