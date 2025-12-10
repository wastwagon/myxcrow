import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReconciliationService } from './reconciliation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class AdminModule {}




