import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { WalletTopupService } from './wallet-topup.service';
import { LedgerHelperService } from './ledger-helper.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { WalletModule } from '../wallet/wallet.module';
import { EscrowModule } from '../escrow/escrow.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, forwardRef(() => WalletModule), forwardRef(() => EscrowModule), AuthModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService, WalletTopupService, LedgerHelperService, PrismaService],
  exports: [PaymentsService, PaystackService, WalletTopupService, LedgerHelperService],
})
export class PaymentsModule {}




