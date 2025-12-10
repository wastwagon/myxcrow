import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  /**
   * Get public profile for a user (no auth required)
   */
  @Get('profile/:userId')
  async getPublicProfile(@Param('userId') userId: string) {
    return this.reputationService.getPublicProfile(userId);
  }

  /**
   * Get reputation score for a user (no auth required)
   */
  @Get('score/:userId')
  async getReputationScore(@Param('userId') userId: string) {
    return this.reputationService.calculateReputationScore(userId);
  }

  /**
   * Get ratings for a user (no auth required)
   */
  @Get('ratings/:userId')
  async getUserRatings(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reputationService.getUserRatings(userId, limit ? parseInt(limit, 10) : 20);
  }

  /**
   * Create a rating (authenticated users only)
   */
  @Post('rate')
  @UseGuards(JwtAuthGuard)
  async createRating(
    @Body() data: {
      escrowId: string;
      rateeId: string;
      role: 'buyer' | 'seller';
      score: number;
      comment?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.reputationService.createRating({
      ...data,
      raterId: user.id,
    });
  }
}




