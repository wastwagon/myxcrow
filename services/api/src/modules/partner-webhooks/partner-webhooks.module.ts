import { Module } from '@nestjs/common';
import { PartnerWebhooksService } from './partner-webhooks.service';
import { PartnerWebhookRetryService } from './partner-webhook-retry.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PartnerWebhooksService, PartnerWebhookRetryService, PrismaService],
  exports: [PartnerWebhooksService],
})
export class PartnerWebhooksModule {}
