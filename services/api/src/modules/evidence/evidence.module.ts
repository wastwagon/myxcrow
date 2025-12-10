import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { EscrowModule } from '../escrow/escrow.module';
import { SecurityModule } from '../../common/security/security.module';

@Module({
  imports: [AuthModule, EscrowModule, SecurityModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, PrismaService],
  exports: [EvidenceService],
})
export class EvidenceModule {}

