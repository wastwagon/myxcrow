import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Rating {
  id: string;
  escrowId: string;
  raterId: string; // User who gave the rating
  rateeId: string; // User being rated
  role: 'buyer' | 'seller'; // Role of the ratee
  score: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

export interface ReputationScore {
  userId: string;
  overallRating: number; // Weighted average (1-5)
  totalRatings: number;
  completionRate: number; // Percentage of completed escrows
  kycLevel: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  verifiedBadge: boolean;
  breakdown: {
    asBuyer: { rating: number; count: number };
    asSeller: { rating: number; count: number };
    recent: { rating: number; count: number }; // Last 30 days
    highValue: { rating: number; count: number }; // Escrows > 1000 GHS
  };
}

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a rating after escrow completion
   */
  async createRating(data: {
    escrowId: string;
    raterId: string;
    rateeId: string;
    role: 'buyer' | 'seller';
    score: number; // 1-5
    comment?: string;
  }): Promise<Rating> {
    // Validate score
    if (data.score < 1 || data.score > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }

    // Verify escrow is completed and user is participant
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: data.escrowId },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Verify rater is a participant
    if (escrow.buyerId !== data.raterId && escrow.sellerId !== data.raterId) {
      throw new Error('Only escrow participants can rate');
    }

    // Verify ratee is the other participant
    const expectedRateeId = escrow.buyerId === data.raterId ? escrow.sellerId : escrow.buyerId;
    if (data.rateeId !== expectedRateeId) {
      throw new Error('Can only rate the other party in the escrow');
    }

    // Verify escrow is in a rateable state
    if (!['RELEASED', 'REFUNDED'].includes(escrow.status)) {
      throw new Error('Can only rate completed escrows');
    }

    // Check if rating already exists
    const existingRating = await this.prisma.escrowRating.findFirst({
      where: {
        escrowId: data.escrowId,
        raterId: data.raterId,
        rateeId: data.rateeId,
      },
    });

    if (existingRating) {
      throw new Error('Rating already exists for this escrow');
    }

    // Anti-gaming: Check for suspicious patterns
    await this.checkAntiGamingRules(data.raterId, data.rateeId, data.score);

    // Create rating
    const rating = await this.prisma.escrowRating.create({
      data: {
        escrowId: data.escrowId,
        raterId: data.raterId,
        rateeId: data.rateeId,
        role: data.role,
        score: data.score,
        comment: data.comment,
      },
    });

    this.logger.log(`Rating created: ${rating.id} for user ${data.rateeId}`);

    return {
      id: rating.id,
      escrowId: rating.escrowId,
      raterId: rating.raterId,
      rateeId: rating.rateeId,
      role: rating.role as 'buyer' | 'seller',
      score: rating.score,
      comment: rating.comment || undefined,
      createdAt: rating.createdAt,
    };
  }

  /**
   * Calculate reputation score for a user
   */
  async calculateReputationScore(userId: string): Promise<ReputationScore> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDetails: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all ratings for this user
    const ratings = await this.prisma.escrowRating.findMany({
      where: { rateeId: userId },
      include: {
        escrow: {
          select: {
            amountCents: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    // Get escrow statistics
    const escrows = await this.prisma.escrowAgreement.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        amountCents: true,
        status: true,
        createdAt: true,
      },
    });

    const totalEscrows = escrows.length;
    const completedEscrows = escrows.filter((e) => ['RELEASED', 'REFUNDED'].includes(e.status)).length;
    const completionRate = totalEscrows > 0 ? (completedEscrows / totalEscrows) * 100 : 0;

    // Calculate weighted average rating
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const highValueThreshold = 100000; // 1000 GHS in cents

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const asBuyerRatings: number[] = [];
    const asSellerRatings: number[] = [];
    const recentRatings: number[] = [];
    const highValueRatings: number[] = [];

    for (const rating of ratings) {
      const escrow = rating.escrow;
      const amountCents = escrow.amountCents;
      const daysAgo = Math.floor((now.getTime() - escrow.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Weight factors:
      // 1. Amount weight: sqrt(amount / 1000) - larger escrows weighted more
      // 2. Recency weight: 1 + (30 - daysAgo) / 30 - recent ratings weighted more
      const amountWeight = Math.sqrt(amountCents / 1000);
      const recencyWeight = daysAgo <= 30 ? 1 + (30 - daysAgo) / 30 : 0.5;
      const weight = amountWeight * recencyWeight;

      totalWeightedScore += rating.score * weight;
      totalWeight += weight;

      // Categorize ratings
      if (rating.role === 'buyer') {
        asBuyerRatings.push(rating.score);
      } else {
        asSellerRatings.push(rating.score);
      }

      if (escrow.createdAt >= thirtyDaysAgo) {
        recentRatings.push(rating.score);
      }

      if (amountCents >= highValueThreshold) {
        highValueRatings.push(rating.score);
      }
    }

    const overallRating = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Calculate breakdown averages
    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const breakdown = {
      asBuyer: {
        rating: avg(asBuyerRatings),
        count: asBuyerRatings.length,
      },
      asSeller: {
        rating: avg(asSellerRatings),
        count: asSellerRatings.length,
      },
      recent: {
        rating: avg(recentRatings),
        count: recentRatings.length,
      },
      highValue: {
        rating: avg(highValueRatings),
        count: highValueRatings.length,
      },
    };

    // Determine verified badge
    const totalRatings = ratings.length;
    const verifiedBadge =
      user.kycStatus === 'VERIFIED' &&
      overallRating >= 4.0 &&
      totalRatings >= 5 &&
      completionRate >= 80;

    return {
      userId,
      overallRating: Math.round(overallRating * 100) / 100, // Round to 2 decimals
      totalRatings: ratings.length,
      completionRate: Math.round(completionRate * 100) / 100,
      kycLevel: user.kycStatus,
      verifiedBadge,
      breakdown,
    };
  }

  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        kycStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const reputation = await this.calculateReputationScore(userId);

    return {
      userId: user.id,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
      email: user.email, // In production, consider masking
      kycStatus: user.kycStatus,
      verifiedBadge: reputation.verifiedBadge,
      memberSince: user.createdAt,
      reputation,
    };
  }

  /**
   * Anti-gaming rules to prevent rating manipulation
   */
  private async checkAntiGamingRules(raterId: string, rateeId: string, score: number) {
    // Rule 1: Check for reciprocal high ratings (both users rating each other 5 stars)
    const reciprocalRating = await this.prisma.escrowRating.findFirst({
      where: {
        raterId: rateeId,
        rateeId: raterId,
        score: 5,
      },
    });

    if (reciprocalRating && score === 5) {
      // Flag for review but don't block (could be legitimate)
      this.logger.warn(`Potential reciprocal high rating: ${raterId} -> ${rateeId}`);
    }

    // Rule 2: Check for too many ratings in short time
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRatings = await this.prisma.escrowRating.count({
      where: {
        raterId,
        createdAt: { gte: last24Hours },
      },
    });

    if (recentRatings > 10) {
      throw new Error('Too many ratings in short time. Please try again later.');
    }

    // Rule 3: Check for same user rating pattern (all 5s or all 1s)
    const userRatings = await this.prisma.escrowRating.findMany({
      where: { raterId },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    if (userRatings.length >= 5) {
      const allSame = userRatings.every((r) => r.score === score);
      if (allSame) {
        this.logger.warn(`Suspicious rating pattern: User ${raterId} always rates ${score}`);
      }
    }

    // Rule 4: Check for new account rating manipulation
    const rater = await this.prisma.user.findUnique({
      where: { id: raterId },
      select: { createdAt: true },
    });

    if (rater) {
      const accountAgeDays = Math.floor(
        (Date.now() - rater.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (accountAgeDays < 1 && score === 5) {
        this.logger.warn(`New account giving high rating: ${raterId} -> ${rateeId}`);
      }
    }
  }

  /**
   * Get ratings for a user
   */
  async getUserRatings(userId: string, limit: number = 20) {
    return this.prisma.escrowRating.findMany({
      where: { rateeId: userId },
      include: {
        rater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        escrow: {
          select: {
            id: true,
            amountCents: true,
            currency: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

