import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerWebhooksService } from './partner-webhooks.service';

@Injectable()
export class PartnerWebhookRetryService {
  private readonly logger = new Logger(PartnerWebhookRetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: PartnerWebhooksService,
  ) {}

  /** Retry failed partner webhook deliveries every 5 minutes. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailed() {
    const due = await this.prisma.platformWebhookDelivery.findMany({
      where: {
        status: WebhookDeliveryStatus.FAILED,
        attempts: { lt: 8 },
        nextRetryAt: { lte: new Date() },
      },
      take: 50,
      orderBy: { nextRetryAt: 'asc' },
    });

    for (const d of due) {
      try {
        await this.webhooks.deliverOnce(d.id);
      } catch (err: any) {
        this.logger.warn(`Retry delivery ${d.id} error: ${err?.message}`);
      }
    }
  }
}
