import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReconciliationService } from './reconciliation.service';
import { AdminStatsService } from './admin-stats.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
export class AdminController {
  constructor(
    private readonly reconciliationService: ReconciliationService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  @Get('stats')
  async getEnhancedStats() {
    return this.adminStatsService.getEnhancedStats();
  }

  @Get('reconciliation')
  async getReconciliation() {
    return this.reconciliationService.getReconciliationSummary();
  }

  @Get('reconciliation/balance')
  async getBalanceComparison() {
    return this.reconciliationService.getBalanceComparison();
  }
}




