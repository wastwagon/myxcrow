import { calculateEscrowFees, proportionalSellerFeeCents, netSellerPayoutCents } from './fee-calculator';

describe('calculateEscrowFees', () => {
  const base = { percentage: 2, fixedCents: 0 };

  it('split 50/50: buyer pays half fee on top, seller pays half from payout', () => {
    const result = calculateEscrowFees(10000, { ...base, paidBy: 'split' });
    expect(result.feeCents).toBe(200);
    expect(result.buyerFeeCents).toBe(100);
    expect(result.sellerFeeCents).toBe(100);
    expect(result.fundingAmountCents).toBe(10100);
    expect(result.netAmountCents).toBe(9900);
  });

  it('buyer pays full fee on top of deal amount', () => {
    const result = calculateEscrowFees(10000, { ...base, paidBy: 'buyer' });
    expect(result.buyerFeeCents).toBe(200);
    expect(result.sellerFeeCents).toBe(0);
    expect(result.fundingAmountCents).toBe(10200);
    expect(result.netAmountCents).toBe(10000);
  });

  it('seller pays full fee deducted from payout', () => {
    const result = calculateEscrowFees(10000, { ...base, paidBy: 'seller' });
    expect(result.buyerFeeCents).toBe(0);
    expect(result.sellerFeeCents).toBe(200);
    expect(result.fundingAmountCents).toBe(10000);
    expect(result.netAmountCents).toBe(9800);
  });

  it('splits fixed fee evenly for odd cents', () => {
    const result = calculateEscrowFees(10000, { percentage: 0, fixedCents: 101, paidBy: 'split' });
    expect(result.buyerFeeCents).toBe(50);
    expect(result.sellerFeeCents).toBe(51);
    expect(result.feeCents).toBe(101);
  });
});

describe('proportionalSellerFeeCents', () => {
  it('deducts half of seller fee on half of deal for split mode', () => {
    const deal = calculateEscrowFees(10000, { percentage: 2, fixedCents: 0, paidBy: 'split' });
    const half = proportionalSellerFeeCents(5000, deal.amountCents, deal.sellerFeeCents);
    expect(half).toBe(50);
    expect(netSellerPayoutCents(5000, deal.amountCents, deal.sellerFeeCents)).toBe(4950);
  });
});
