import { Module } from '@nestjs/common';
import { RiskScoringService } from './risk-scoring.service';
import { RiskController } from './risk.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RiskController],
  providers: [RiskScoringService, PrismaService],
  exports: [RiskScoringService],
})
export class RiskModule {}




