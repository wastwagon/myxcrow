import { Module, forwardRef } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { MilestoneEscrowService } from './milestone-escrow.service';
import { EscrowExportService } from './escrow-export.service';
import { AutoReleaseService } from './auto-release.service';
import { EscrowSchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsModule } from '../settings/settings.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AutomationModule } from '../automation/automation.module';
import { ChatModule } from '../chat/chat.module';
import { EscrowAccessGuard } from './guards/escrow-access.guard';
import { EscrowParticipantGuard } from './guards/escrow-participant.guard';

@Module({
  imports: [
    SettingsModule,
    forwardRef(() => WalletModule),
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    AuditModule,
    AuthModule,
    AutomationModule,
    ChatModule,
  ],
  controllers: [EscrowController],
  providers: [
    EscrowService,
    MilestoneEscrowService,
    EscrowExportService,
    AutoReleaseService,
    EscrowSchedulerService,
    PrismaService,
    EscrowAccessGuard,
    EscrowParticipantGuard,
  ],
  exports: [EscrowService, EscrowExportService, EscrowAccessGuard],
})
export class EscrowModule {}
