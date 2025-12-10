import { Module } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { FaceMatchingService } from './face-matching.service';
import { KYCController } from './kyc.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [KYCService, FaceMatchingService],
  controllers: [KYCController],
  exports: [KYCService, FaceMatchingService],
})
export class KYCModule {}




