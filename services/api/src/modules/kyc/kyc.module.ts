import { Module } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { SmileIDService } from './smile-id.service';
import { KYCController } from './kyc.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule],
  providers: [KYCService, SmileIDService],
  controllers: [KYCController],
  exports: [KYCService, SmileIDService],
})
export class KYCModule { }




