import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerHelperService {
  constructor(private prisma: PrismaService) {}

  async createFundingLedgerEntry(
    escrowId: string,
    escrow: { amountCents: number; feeCents: number; netAmountCents: number; currency: string },
  ) {
    const entries: any[] = [
      {
        account: 'escrow_hold',
        currency: escrow.currency,
        amountCents: escrow.netAmountCents,
      },
      {
        account: 'buyer_wallet',
        currency: escrow.currency,
        amountCents: -escrow.amountCents,
      },
    ];

    if (escrow.feeCents > 0) {
      entries.push({
        account: 'fees_revenue',
        currency: escrow.currency,
        amountCents: escrow.feeCents,
      });
    }

    const journal = await this.prisma.ledgerJournal.create({
      data: {
        escrowId,
        type: 'escrow_funding',
        description: `Escrow funding for ${escrowId} (Fee: ${escrow.feeCents / 100} ${escrow.currency})`,
        entries: {
          create: entries,
        },
      },
    });

    return journal;
  }

  async createReleaseLedgerEntry(
    escrowId: string,
    escrow: { netAmountCents: number; currency: string },
  ) {
    const journal = await this.prisma.ledgerJournal.create({
      data: {
        escrowId,
        type: 'escrow_release',
        description: `Escrow release for ${escrowId}`,
        entries: {
          create: [
            {
              account: 'escrow_hold',
              currency: escrow.currency,
              amountCents: -escrow.netAmountCents,
            },
            {
              account: 'seller_wallet',
              currency: escrow.currency,
              amountCents: escrow.netAmountCents,
            },
          ],
        },
      },
    });

    return journal;
  }

  async createRefundLedgerEntry(
    escrowId: string,
    escrow: { amountCents: number; feeCents: number; currency: string },
  ) {
    const journal = await this.prisma.ledgerJournal.create({
      data: {
        escrowId,
        type: 'escrow_refund',
        description: `Escrow refund for ${escrowId}`,
        entries: {
          create: [
            {
              account: 'escrow_hold',
              currency: escrow.currency,
              amountCents: -escrow.amountCents,
            },
            {
              account: 'buyer_wallet',
              currency: escrow.currency,
              amountCents: escrow.amountCents,
            },
          ],
        },
      },
    });

    return journal;
  }

  async createWalletTopUpEntry(
    walletId: string,
    data: { amountCents: number; feeCents: number; currency: string; fundingId: string },
  ) {
    const journal = await this.prisma.ledgerJournal.create({
      data: {
        type: 'wallet_topup',
        description: `Wallet top-up (funding ${data.fundingId})`,
        entries: {
          create: [
            {
              account: 'user_wallet',
              currency: data.currency,
              amountCents: data.amountCents,
              metadata: {
                walletId,
                fundingId: data.fundingId,
              } as any,
            },
            {
              account: 'funding_source',
              currency: data.currency,
              amountCents: -(data.amountCents + data.feeCents),
              metadata: {
                walletId,
                fundingId: data.fundingId,
              } as any,
            },
            ...(data.feeCents > 0
              ? [
                  {
                    account: 'fees_revenue',
                    currency: data.currency,
                    amountCents: data.feeCents,
                    metadata: {
                      walletId,
                      fundingId: data.fundingId,
                    } as any,
                  },
                ]
              : []),
          ],
        },
      },
    });

    return journal;
  }

  async createWithdrawalEntry(
    walletId: string,
    data: { amountCents: number; feeCents: number; currency: string; withdrawalId: string },
  ) {
    const journal = await this.prisma.ledgerJournal.create({
      data: {
        type: 'withdrawal',
        description: `Withdrawal (${data.withdrawalId})`,
        entries: {
          create: [
            {
              account: 'user_wallet',
              currency: data.currency,
              amountCents: -data.amountCents,
              metadata: {
                walletId,
                withdrawalId: data.withdrawalId,
              } as any,
            },
            {
              account: 'payout_destination',
              currency: data.currency,
              amountCents: data.amountCents - data.feeCents,
              metadata: {
                walletId,
                withdrawalId: data.withdrawalId,
              } as any,
            },
            ...(data.feeCents > 0
              ? [
                  {
                    account: 'fees_revenue',
                    currency: data.currency,
                    amountCents: data.feeCents,
                    metadata: {
                      walletId,
                      withdrawalId: data.withdrawalId,
                    } as any,
                  },
                ]
              : []),
          ],
        },
      },
    });

    return journal;
  }
}
