import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailModule, AuditModule, AuthModule],
  controllers: [DisputesController],
  providers: [DisputesService, PrismaService],
  exports: [DisputesService],
})
export class DisputesModule {}




