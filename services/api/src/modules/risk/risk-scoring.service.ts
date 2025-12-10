import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RiskScore {
  userId: string;
  overallScore: number; // 0-100, higher = more risky
  factors: RiskFactor[];
  lastCalculated: Date;
}

export interface RiskFactor {
  type: string;
  score: number;
  weight: number;
  description: string;
}

@Injectable()
export class RiskScoringService {
  private readonly logger = new Logger(RiskScoringService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate risk score for a user
   */
  async calculateUserRiskScore(userId: string): Promise<RiskScore> {
    const factors: RiskFactor[] = [];

    // Factor 1: Top-up velocity (recent top-ups in short time)
    const topUpVelocity = await this.calculateTopUpVelocity(userId);
    factors.push({
      type: 'topup_velocity',
      score: topUpVelocity.score,
      weight: 0.2,
      description: `Top-up velocity: ${topUpVelocity.description}`,
    });

    // Factor 2: First-time counterparty (new trading partners)
    const firstTimeCounterparty = await this.calculateFirstTimeCounterparty(userId);
    factors.push({
      type: 'first_time_counterparty',
      score: firstTimeCounterparty.score,
      weight: 0.15,
      description: `First-time counterparties: ${firstTimeCounterparty.description}`,
    });

    // Factor 3: Dispute history
    const disputeHistory = await this.calculateDisputeHistory(userId);
    factors.push({
      type: 'dispute_history',
      score: disputeHistory.score,
      weight: 0.25,
      description: `Dispute history: ${disputeHistory.description}`,
    });

    // Factor 4: Account age
    const accountAge = await this.calculateAccountAge(userId);
    factors.push({
      type: 'account_age',
      score: accountAge.score,
      weight: 0.1,
      description: `Account age: ${accountAge.description}`,
    });

    // Factor 5: Transaction patterns
    const transactionPatterns = await this.calculateTransactionPatterns(userId);
    factors.push({
      type: 'transaction_patterns',
      score: transactionPatterns.score,
      weight: 0.15,
      description: `Transaction patterns: ${transactionPatterns.description}`,
    });

    // Factor 6: KYC status
    const kycStatus = await this.calculateKYCStatus(userId);
    factors.push({
      type: 'kyc_status',
      score: kycStatus.score,
      weight: 0.15,
      description: `KYC status: ${kycStatus.description}`,
    });

    // Calculate weighted overall score
    const overallScore = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0);

    // Create or update risk event
    await this.prisma.riskEvent.create({
      data: {
        userId,
        type: 'risk_score_calculated',
        severity: this.getSeverityFromScore(overallScore),
        details: {
          overallScore,
          factors: factors.map((f) => ({
            type: f.type,
            score: f.score,
            description: f.description,
          })),
        },
      },
    });

    return {
      userId,
      overallScore: Math.round(overallScore),
      factors,
      lastCalculated: new Date(),
    };
  }

  /**
   * Calculate top-up velocity risk
   */
  private async calculateTopUpVelocity(userId: string): Promise<{ score: number; description: string }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTopUps = await this.prisma.walletFunding.count({
      where: {
        wallet: { userId },
        status: 'SUCCEEDED',
        createdAt: { gte: last24Hours },
      },
    });

    // Score: 0-100, higher for more frequent top-ups
    let score = 0;
    if (recentTopUps > 10) score = 100;
    else if (recentTopUps > 5) score = 70;
    else if (recentTopUps > 3) score = 40;
    else if (recentTopUps > 1) score = 20;

    return {
      score,
      description: `${recentTopUps} top-ups in last 24 hours`,
    };
  }

  /**
   * Calculate first-time counterparty risk
   */
  private async calculateFirstTimeCounterparty(userId: string): Promise<{ score: number; description: string }> {
    const userEscrows = await this.prisma.escrowAgreement.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: { buyerId: true, sellerId: true },
    });

    const counterparties = new Set<string>();
    userEscrows.forEach((escrow) => {
      if (escrow.buyerId === userId) {
        counterparties.add(escrow.sellerId);
      } else {
        counterparties.add(escrow.buyerId);
      }
    });

    const totalEscrows = userEscrows.length;
    const uniqueCounterparties = counterparties.size;

    // Score: Higher if many escrows with few unique counterparties (repeated partners = lower risk)
    // Lower if many unique counterparties (new partners = higher risk)
    let score = 0;
    if (totalEscrows > 0) {
      const ratio = uniqueCounterparties / totalEscrows;
      if (ratio > 0.8) score = 60; // Many unique partners
      else if (ratio > 0.5) score = 30;
      else score = 10; // Repeated partners
    }

    return {
      score,
      description: `${uniqueCounterparties} unique counterparties in ${totalEscrows} escrows`,
    };
  }

  /**
   * Calculate dispute history risk
   */
  private async calculateDisputeHistory(userId: string): Promise<{ score: number; description: string }> {
    const userEscrows = await this.prisma.escrowAgreement.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        disputes: true,
      },
    });

    const totalEscrows = userEscrows.length;
    const totalDisputes = userEscrows.reduce((sum, escrow) => sum + escrow.disputes.length, 0);
    const disputeRate = totalEscrows > 0 ? totalDisputes / totalEscrows : 0;

    // Score: Higher for higher dispute rate
    let score = 0;
    if (disputeRate > 0.3) score = 100; // >30% dispute rate
    else if (disputeRate > 0.2) score = 80;
    else if (disputeRate > 0.1) score = 50;
    else if (disputeRate > 0.05) score = 30;
    else if (disputeRate > 0) score = 15;

    return {
      score,
      description: `${totalDisputes} disputes in ${totalEscrows} escrows (${(disputeRate * 100).toFixed(1)}%)`,
    };
  }

  /**
   * Calculate account age risk
   */
  private async calculateAccountAge(userId: string): Promise<{ score: number; description: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      return { score: 100, description: 'User not found' };
    }

    const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Score: Lower for older accounts (more trustworthy)
    let score = 0;
    if (accountAgeDays < 1) score = 80; // Brand new account
    else if (accountAgeDays < 7) score = 60;
    else if (accountAgeDays < 30) score = 40;
    else if (accountAgeDays < 90) score = 20;
    else score = 5; // Established account

    return {
      score,
      description: `Account age: ${accountAgeDays} days`,
    };
  }

  /**
   * Calculate transaction patterns risk
   */
  private async calculateTransactionPatterns(userId: string): Promise<{ score: number; description: string }> {
    const escrows = await this.prisma.escrowAgreement.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: { amountCents: true, status: true },
    });

    if (escrows.length === 0) {
      return { score: 50, description: 'No transaction history' };
    }

    const amounts = escrows.map((e) => e.amountCents);
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Score: Higher for high variance (inconsistent patterns) or very large amounts
    let score = 0;
    if (maxAmount > 10000000) score += 40; // >100,000 GHS
    if (stdDev > avgAmount * 2) score += 30; // High variance
    if (escrows.length < 3) score += 20; // Few transactions

    return {
      score: Math.min(score, 100),
      description: `${escrows.length} transactions, avg ${(avgAmount / 100).toFixed(2)} GHS`,
    };
  }

  /**
   * Calculate KYC status risk
   */
  private async calculateKYCStatus(userId: string): Promise<{ score: number; description: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    if (!user) {
      return { score: 100, description: 'User not found' };
    }

    // Score: Lower for verified KYC
    let score = 0;
    switch (user.kycStatus) {
      case 'VERIFIED':
        score = 0;
        break;
      case 'IN_PROGRESS':
        score = 30;
        break;
      case 'PENDING':
        score = 60;
        break;
      case 'REJECTED':
        score = 100;
        break;
      case 'EXPIRED':
        score = 70;
        break;
      default:
        score = 50;
    }

    return {
      score,
      description: `KYC status: ${user.kycStatus}`,
    };
  }

  /**
   * Get severity level from risk score
   */
  private getSeverityFromScore(score: number): string {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get risk score for a user (cached or calculated)
   */
  async getUserRiskScore(userId: string): Promise<RiskScore> {
    // In production, cache scores and recalculate periodically
    return this.calculateUserRiskScore(userId);
  }

  /**
   * Check if user should be routed to manual review
   */
  async shouldRouteToManualReview(userId: string, threshold: number = 70): Promise<boolean> {
    const riskScore = await this.getUserRiskScore(userId);
    return riskScore.overallScore >= threshold;
  }
}




