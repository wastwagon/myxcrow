import { Module } from '@nestjs/common';
import { SanctionsScreeningService } from './sanctions-screening.service';
import { ComplianceController } from './compliance.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ComplianceController],
  providers: [SanctionsScreeningService, PrismaService],
  exports: [SanctionsScreeningService],
})
export class ComplianceModule {}




