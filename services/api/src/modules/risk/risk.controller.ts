import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('risk')
@UseGuards(JwtAuthGuard)
export class RiskController {
  constructor(private readonly riskScoringService: RiskScoringService) {}

  @Get('score/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getUserRiskScore(@Param('userId') userId: string) {
    return this.riskScoringService.getUserRiskScore(userId);
  }

  @Get('check/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async checkManualReview(@Param('userId') userId: string) {
    const shouldReview = await this.riskScoringService.shouldRouteToManualReview(userId);
    return {
      userId,
      shouldRouteToManualReview: shouldReview,
      threshold: 70,
    };
  }
}




