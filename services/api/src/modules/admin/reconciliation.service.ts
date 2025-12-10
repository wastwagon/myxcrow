import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowStatus } from '@prisma/client';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get reconciliation summary
   */
  async getReconciliationSummary() {
    const [
      escrowsByStatus,
      escrowsByCurrency,
      totalEscrowValue,
      totalFees,
      totalReleased,
      totalPending,
    ] = await Promise.all([
      this.getEscrowsByStatus(),
      this.getEscrowsByCurrency(),
      this.getTotalEscrowValue(),
      this.getTotalFees(),
      this.getTotalReleased(),
      this.getTotalPending(),
    ]);

    return {
      escrowsByStatus,
      escrowsByCurrency,
      totals: {
        totalEscrowValue,
        totalFees,
        totalReleased,
        totalPending,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async getEscrowsByStatus() {
    const statuses = await this.prisma.escrowAgreement.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      _sum: {
        amountCents: true,
      },
    });

    return statuses.map((s) => ({
      status: s.status,
      count: s._count.id,
      totalAmountCents: s._sum.amountCents || 0,
    }));
  }

  private async getEscrowsByCurrency() {
    const currencies = await this.prisma.escrowAgreement.groupBy({
      by: ['currency'],
      _count: {
        id: true,
      },
      _sum: {
        amountCents: true,
        feeCents: true,
        netAmountCents: true,
      },
    });

    return currencies.map((c) => ({
      currency: c.currency,
      count: c._count.id,
      totalAmountCents: c._sum.amountCents || 0,
      totalFeesCents: c._sum.feeCents || 0,
      totalNetAmountCents: c._sum.netAmountCents || 0,
    }));
  }

  private async getTotalEscrowValue() {
    const result = await this.prisma.escrowAgreement.aggregate({
      _sum: {
        amountCents: true,
      },
    });

    return result._sum.amountCents || 0;
  }

  private async getTotalFees() {
    const result = await this.prisma.escrowAgreement.aggregate({
      _sum: {
        feeCents: true,
      },
    });

    return result._sum.feeCents || 0;
  }

  private async getTotalReleased() {
    const result = await this.prisma.escrowAgreement.aggregate({
      where: {
        status: EscrowStatus.RELEASED,
      },
      _sum: {
        netAmountCents: true,
      },
    });

    return result._sum.netAmountCents || 0;
  }

  private async getTotalPending() {
    const result = await this.prisma.escrowAgreement.aggregate({
      where: {
        status: {
          in: [
            EscrowStatus.AWAITING_FUNDING,
            EscrowStatus.FUNDED,
            EscrowStatus.SHIPPED,
            EscrowStatus.DELIVERED,
            EscrowStatus.AWAITING_RELEASE,
          ],
        },
      },
      _sum: {
        amountCents: true,
      },
    });

    return result._sum.amountCents || 0;
  }

  /**
   * Compare escrow balance vs cash book
   */
  async getBalanceComparison() {
    // Get total in escrow hold account
    const escrowHold = await this.prisma.ledgerEntry.aggregate({
      where: {
        account: 'escrow_hold',
      },
      _sum: {
        amountCents: true,
      },
    });

    // Get total in fees revenue account
    const feesRevenue = await this.prisma.ledgerEntry.aggregate({
      where: {
        account: 'fees_revenue',
      },
      _sum: {
        amountCents: true,
      },
    });

    // Get pending escrow amounts
    const pendingEscrows = await this.getTotalPending();

    return {
      escrowHoldBalance: escrowHold._sum.amountCents || 0,
      feesRevenue: feesRevenue._sum.amountCents || 0,
      pendingEscrows,
      difference: (escrowHold._sum.amountCents || 0) - pendingEscrows,
      reconciled: Math.abs((escrowHold._sum.amountCents || 0) - pendingEscrows) < 100, // Allow 1 GHS difference
    };
  }
}




