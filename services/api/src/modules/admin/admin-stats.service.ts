import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletFundingSource } from '@prisma/client';

@Injectable()
export class AdminStatsService {
  constructor(private prisma: PrismaService) {}

  private getTwentyFourHoursAgo() {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d;
  }

  async getEnhancedStats() {
    const since24h = this.getTwentyFourHoursAgo();

    const [
      topUps24h,
      topUpsCount24h,
      escrows24h,
      escrowsValue24h,
      feesRevenue24h,
      totalWalletBalance,
      recentTopUps,
      recentEscrows,
    ] = await Promise.all([
      this.prisma.walletFunding.aggregate({
        where: {
          sourceType: WalletFundingSource.PAYSTACK_TOPUP,
          status: 'SUCCEEDED',
          createdAt: { gte: since24h },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.walletFunding.count({
        where: {
          sourceType: WalletFundingSource.PAYSTACK_TOPUP,
          status: 'SUCCEEDED',
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.escrowAgreement.count({
        where: { createdAt: { gte: since24h } },
      }),
      this.prisma.escrowAgreement.aggregate({
        where: {
          createdAt: { gte: since24h },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: {
          account: 'fees_revenue',
          createdAt: { gte: since24h },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.wallet.aggregate({
        _sum: { availableCents: true, pendingCents: true },
      }),
      this.prisma.walletFunding.findMany({
        where: { sourceType: WalletFundingSource.PAYSTACK_TOPUP },
        include: {
          wallet: {
            select: {
              userId: true,
              user: {
                select: { email: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      this.prisma.escrowAgreement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amountCents: true,
          status: true,
          description: true,
          createdAt: true,
          buyer: { select: { email: true } },
          seller: { select: { email: true } },
        },
      }),
    ]);

    const topUpAmount24h = topUps24h._sum.amountCents || 0;
    const fees24h = feesRevenue24h._sum.amountCents || 0;
    const totalBalance = (totalWalletBalance._sum.availableCents || 0) + (totalWalletBalance._sum.pendingCents || 0);
    const escrowValue24h = escrowsValue24h._sum.amountCents || 0;

    return {
      last24Hours: {
        topUpAmountCents: topUpAmount24h,
        topUpCount: topUpsCount24h,
        escrowsCreated: escrows24h,
        escrowValueCents: escrowValue24h,
        feesRevenueCents: fees24h,
      },
      totals: {
        walletBalanceCents: totalBalance,
      },
      recentTransactions: recentTopUps.map((f) => ({
        id: f.id,
        type: 'topup',
        amountCents: f.amountCents,
        status: f.status,
        sourceType: f.sourceType,
        userEmail: f.wallet?.user?.email,
        userName: f.wallet?.user?.firstName && f.wallet?.user?.lastName
          ? `${f.wallet.user.firstName} ${f.wallet.user.lastName}`
          : null,
        createdAt: f.createdAt,
      })),
      recentEscrows: recentEscrows.map((e) => ({
        id: e.id,
        amountCents: e.amountCents,
        status: e.status,
        description: e.description,
        buyerEmail: e.buyer?.email,
        sellerEmail: e.seller?.email,
        createdAt: e.createdAt,
      })),
    };
  }
}
