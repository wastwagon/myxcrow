import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [NotificationsModule, AuditModule, AuthModule, EscrowModule],
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService],
  exports: [DisputesService],
})
export class DisputesModule {}




