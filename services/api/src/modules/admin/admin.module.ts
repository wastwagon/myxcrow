import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReconciliationService } from './reconciliation.service';
import { AdminStatsService } from './admin-stats.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [ReconciliationService, AdminStatsService],
  exports: [ReconciliationService],
})
export class AdminModule {}




