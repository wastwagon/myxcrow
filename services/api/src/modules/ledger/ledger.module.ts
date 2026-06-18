import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { EscrowModule } from '../escrow/escrow.module';
import { EscrowAccessGuard } from '../escrow/guards/escrow-access.guard';

@Module({
  imports: [AuthModule, EscrowModule],
  controllers: [LedgerController],
  providers: [LedgerService, PrismaService, EscrowAccessGuard],
  exports: [LedgerService],
})
export class LedgerModule {}
