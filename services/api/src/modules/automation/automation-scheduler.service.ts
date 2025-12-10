import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RulesEngineService } from './rules-engine.service';
import { EscrowStatus } from '@prisma/client';

@Injectable()
export class AutomationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AutomationSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private rulesEngine: RulesEngineService,
  ) {}

  async onModuleInit() {
    await this.rulesEngine.loadRules();
  }

  /**
   * Check for unfunded escrows daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkUnfundedEscrows() {
    this.logger.log('Checking for unfunded escrows...');

    const unfundedEscrows = await this.prisma.escrowAgreement.findMany({
      where: {
        status: EscrowStatus.AWAITING_FUNDING,
        createdAt: {
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
      include: {
        buyer: { select: { id: true, email: true } },
        seller: { select: { id: true, email: true } },
      },
    });

    for (const escrow of unfundedEscrows) {
      const daysUnfunded = Math.floor(
        (Date.now() - escrow.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.rulesEngine.evaluateRules(
        { type: 'escrow_unfunded_days', days: daysUnfunded },
        {
          escrowId: escrow.id,
          status: escrow.status,
          buyerId: escrow.buyerId,
          sellerId: escrow.sellerId,
          buyerEmail: escrow.buyer.email,
          sellerEmail: escrow.seller.email,
          daysUnfunded,
        },
      );
    }

    this.logger.log(`Checked ${unfundedEscrows.length} unfunded escrows`);
  }
}




