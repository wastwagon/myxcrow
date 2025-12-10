import { Module, forwardRef } from '@nestjs/common';
import { RulesEngineService } from './rules-engine.service';
import { AutomationController } from './automation.controller';
import { AutomationSchedulerService } from './automation-scheduler.service';
import { EscrowModule } from '../escrow/escrow.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [forwardRef(() => EscrowModule), EmailModule, AuditModule],
  controllers: [AutomationController],
  providers: [RulesEngineService, AutomationSchedulerService, PrismaService],
  exports: [RulesEngineService],
})
export class AutomationModule {}

