import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowStatus, WalletFundingSource } from '@prisma/client';

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

    const completedStatuses: EscrowStatus[] = [
      EscrowStatus.RELEASED,
      EscrowStatus.REFUNDED,
      EscrowStatus.CANCELLED,
    ];
    const hotStatuses: EscrowStatus[] = [
      EscrowStatus.FUNDED,
      EscrowStatus.DISPUTED,
      EscrowStatus.AWAITING_RELEASE,
    ];

    const monthStarts: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - i);
      monthStarts.push(d);
    }
    const monthEnd = new Date(monthStarts[monthStarts.length - 1]);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const [
      topUps24h,
      topUpsCount24h,
      escrows24h,
      escrowsValue24h,
      feesRevenue24h,
      totalWalletBalance,
      recentTopUps,
      recentEscrows,
      userCount,
      escrowCount,
      activeEscrowCount,
      fundedEscrowCount,
      openDisputeCount,
      escrowValueTotal,
      openDisputes,
      pendingWithdrawals,
      hotEscrows,
      pendingWithdrawalCount,
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
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.escrowAgreement.count(),
      this.prisma.escrowAgreement.count({
        where: { status: { notIn: completedStatuses } },
      }),
      this.prisma.escrowAgreement.count({
        where: { status: EscrowStatus.FUNDED },
      }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.escrowAgreement.aggregate({
        where: { status: { not: EscrowStatus.CANCELLED } },
        _sum: { amountCents: true },
      }),
      this.prisma.dispute.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { id: true, reason: true, status: true, createdAt: true },
      }),
      this.prisma.withdrawal.findMany({
        where: { status: 'REQUESTED' },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          amountCents: true,
          status: true,
          createdAt: true,
          wallet: { select: { user: { select: { email: true } } } },
        },
      }),
      this.prisma.escrowAgreement.findMany({
        where: { status: { in: hotStatuses } },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          description: true,
          status: true,
          amountCents: true,
          createdAt: true,
        },
      }),
      this.prisma.withdrawal.count({ where: { status: 'REQUESTED' } }),
    ]);

    const monthlyVolume = await Promise.all(
      monthStarts.map(async (start, i) => {
        const end = i < monthStarts.length - 1 ? monthStarts[i + 1] : monthEnd;
        const agg = await this.prisma.escrowAgreement.aggregate({
          where: {
            createdAt: { gte: start, lt: end },
            status: { not: EscrowStatus.CANCELLED },
          },
          _sum: { amountCents: true },
        });
        return {
          label: start.toLocaleString('en', { month: 'short' }),
          amountCents: agg._sum.amountCents || 0,
        };
      }),
    );

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
        userCount,
        escrowCount,
        activeEscrowCount,
        fundedEscrowCount,
        openDisputeCount,
        escrowValueCents: escrowValueTotal._sum.amountCents || 0,
        pendingWithdrawalCount,
      },
      monthlyVolume,
      queue: {
        disputes: openDisputes.map((d) => ({
          id: d.id,
          reason: d.reason,
          status: d.status,
          createdAt: d.createdAt,
        })),
        withdrawals: pendingWithdrawals.map((w) => ({
          id: w.id,
          amountCents: w.amountCents,
          status: w.status,
          createdAt: w.createdAt,
          userEmail: w.wallet?.user?.email,
        })),
        escrows: hotEscrows,
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
