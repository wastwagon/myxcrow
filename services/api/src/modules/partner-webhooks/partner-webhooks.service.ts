import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHmac, randomBytes, randomUUID } from 'crypto';
import {
  PlatformEnvironment,
  WebhookDeliveryStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const PARTNER_WEBHOOK_EVENTS = [
  'checkout.session.created',
  'checkout.session.completed',
  'checkout.session.expired',
  'escrow.created',
  'escrow.funded',
  'escrow.shipped',
  'escrow.delivered',
  'escrow.service_completed',
  'escrow.awaiting_release',
  'escrow.released',
  'escrow.refunded',
  'escrow.cancelled',
  'payment.failed',
  'merchant.linked',
  'merchant.kyc.verified',
  'dispute.opened',
  'dispute.resolved',
  'webhook.test',
] as const;

@Injectable()
export class PartnerWebhooksService {
  private readonly logger = new Logger(PartnerWebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEndpoint(params: {
    platformId: string;
    environment: PlatformEnvironment;
    url: string;
    events?: string[];
  }) {
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    return this.prisma.platformWebhookEndpoint.create({
      data: {
        platformId: params.platformId,
        environment: params.environment,
        url: params.url,
        secret,
        events: params.events?.length ? params.events : [...PARTNER_WEBHOOK_EVENTS],
      },
    });
  }

  async listEndpoints(platformId: string, environment?: PlatformEnvironment) {
    return this.prisma.platformWebhookEndpoint.findMany({
      where: {
        platformId,
        ...(environment ? { environment } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rotateSecret(platformId: string, endpointId: string) {
    const ep = await this.prisma.platformWebhookEndpoint.findFirst({
      where: { id: endpointId, platformId },
    });
    if (!ep) throw new NotFoundException('Webhook endpoint not found');
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    return this.prisma.platformWebhookEndpoint.update({
      where: { id: ep.id },
      data: { secret },
    });
  }

  async deleteEndpoint(platformId: string, endpointId: string) {
    const ep = await this.prisma.platformWebhookEndpoint.findFirst({
      where: { id: endpointId, platformId },
    });
    if (!ep) throw new NotFoundException('Webhook endpoint not found');
    await this.prisma.platformWebhookEndpoint.delete({ where: { id: ep.id } });
    return { deleted: true };
  }

  signPayload(secret: string, timestamp: number, body: string): string {
    const signed = `${timestamp}.${body}`;
    const v1 = createHmac('sha256', secret).update(signed).digest('hex');
    return `t=${timestamp},v1=${v1}`;
  }

  /** Enqueue outbound event to all matching endpoints (fire-and-forget delivery). */
  async emit(params: {
    platformId: string;
    environment: PlatformEnvironment;
    eventType: string;
    data: Record<string, unknown>;
  }) {
    const endpoints = await this.prisma.platformWebhookEndpoint.findMany({
      where: {
        platformId: params.platformId,
        environment: params.environment,
        isActive: true,
      },
    });

    const matching = endpoints.filter(
      (e) => !e.events.length || e.events.includes(params.eventType) || e.events.includes('*'),
    );

    for (const endpoint of matching) {
      const eventId = randomUUID();
      const payload = {
        id: eventId,
        type: params.eventType,
        created: Math.floor(Date.now() / 1000),
        data: params.data,
      };
      const delivery = await this.prisma.platformWebhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          eventId,
          eventType: params.eventType,
          payload: payload as Prisma.InputJsonValue,
          status: WebhookDeliveryStatus.PENDING,
          nextRetryAt: new Date(),
        },
      });
      // Best-effort immediate delivery
      void this.deliverOnce(delivery.id).catch((err) =>
        this.logger.warn(`Webhook delivery ${delivery.id} failed: ${err?.message}`),
      );
    }
  }

  async deliverOnce(deliveryId: string) {
    const delivery = await this.prisma.platformWebhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery || delivery.status === WebhookDeliveryStatus.SUCCEEDED) return delivery;

    const body = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signPayload(delivery.endpoint.secret, timestamp, body);

    try {
      const res = await fetch(delivery.endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Myxcrow-Signature': signature,
          'X-Myxcrow-Event': delivery.eventType,
          'X-Myxcrow-Delivery': delivery.eventId,
        },
        body,
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        return this.prisma.platformWebhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: WebhookDeliveryStatus.SUCCEEDED,
            attempts: delivery.attempts + 1,
            lastStatusCode: res.status,
            deliveredAt: new Date(),
            nextRetryAt: null,
            lastError: null,
          },
        });
      }

      const delayMin = Math.min(24 * 60, Math.pow(2, delivery.attempts) * 1);
      return this.prisma.platformWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          attempts: delivery.attempts + 1,
          lastStatusCode: res.status,
          lastError: `HTTP ${res.status}`,
          nextRetryAt: new Date(Date.now() + delayMin * 60_000),
        },
      });
    } catch (err: any) {
      const delayMin = Math.min(24 * 60, Math.pow(2, delivery.attempts) * 1);
      return this.prisma.platformWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          attempts: delivery.attempts + 1,
          lastError: err?.message || 'network error',
          nextRetryAt: new Date(Date.now() + delayMin * 60_000),
        },
      });
    }
  }

  async listDeliveries(platformId: string, limit = 50) {
    return this.prisma.platformWebhookDelivery.findMany({
      where: { endpoint: { platformId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        endpoint: { select: { id: true, url: true, environment: true } },
      },
    });
  }
}
