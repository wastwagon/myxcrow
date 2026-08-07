import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  EscrowStatus,
  PartnerReleasePolicy,
  PlatformEnvironment,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { PartnerWebhooksService } from '../partner-webhooks/partner-webhooks.service';
import { PlatformsService } from '../platforms/platforms.service';
import type { AuthenticatedPlatformKey } from '../api-keys/api-keys.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class PartnerApiService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EscrowService))
    private readonly escrowService: EscrowService,
    private readonly webhooks: PartnerWebhooksService,
    private readonly platforms: PlatformsService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  me(auth: AuthenticatedPlatformKey) {
    return this.platforms.getById(auth.platformId).then((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      environment: auth.environment,
      releasePolicy: p.releasePolicy,
      feePercentageOverride: p.feePercentageOverride,
      keyType: auth.keyType,
      scopes: auth.scopes,
    }));
  }

  private async loadPlatformEscrow(platformId: string, escrowId: string) {
    const escrow = await this.prisma.escrowAgreement.findFirst({
      where: { id: escrowId, platformId },
      include: {
        seller: { select: { id: true, email: true, phone: true, kycStatus: true } },
        buyer: { select: { id: true, email: true, phone: true } },
      },
    });
    if (!escrow) throw new NotFoundException('Escrow not found for this platform');
    return escrow;
  }

  async getEscrow(auth: AuthenticatedPlatformKey, escrowId: string) {
    this.apiKeys.assertScope(auth, 'escrows:read');
    return this.loadPlatformEscrow(auth.platformId, escrowId);
  }

  async getEscrowByExternal(auth: AuthenticatedPlatformKey, externalOrderId: string) {
    this.apiKeys.assertScope(auth, 'escrows:read');
    const escrow = await this.prisma.escrowAgreement.findFirst({
      where: {
        platformId: auth.platformId,
        environment: auth.environment,
        externalOrderId,
      },
      include: {
        seller: { select: { id: true, email: true, phone: true, kycStatus: true } },
        buyer: { select: { id: true, email: true, phone: true } },
      },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    return escrow;
  }

  async ship(
    auth: AuthenticatedPlatformKey,
    escrowId: string,
    data: { trackingNumber?: string; carrier?: string },
  ) {
    this.apiKeys.assertScope(auth, 'escrows:write');
    const escrow = await this.loadPlatformEscrow(auth.platformId, escrowId);
    // shipEscrow requires seller — call via seller id
    const result = await this.escrowService.shipEscrow(
      escrow.id,
      escrow.sellerId,
      data.trackingNumber,
      data.carrier,
    );
    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'escrow.shipped',
      data: {
        escrowId: escrow.id,
        externalOrderId: escrow.externalOrderId,
        status: EscrowStatus.SHIPPED,
      },
    });
    return result;
  }

  /**
   * Platform attests delivery (POD) and/or releases funds per release policy.
   */
  async deliver(auth: AuthenticatedPlatformKey, escrowId: string) {
    this.apiKeys.assertScope(auth, 'escrows:write');
    const escrow = await this.loadPlatformEscrow(auth.platformId, escrowId);
    const policy = escrow.releasePolicy || PartnerReleasePolicy.PLATFORM_RELEASE;

    if (
      policy !== PartnerReleasePolicy.PLATFORM_RELEASE &&
      policy !== PartnerReleasePolicy.AUTO_ON_DELIVERY
    ) {
      throw new ForbiddenException(
        `Release policy ${policy} does not allow platform delivery attestation`,
      );
    }

    // Mark delivered as buyer actor (commerce platform attested POD)
    const delivered = await this.escrowService.deliverEscrowAsPlatform(
      escrow.id,
      auth.platformId,
    );

    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'escrow.delivered',
      data: {
        escrowId: escrow.id,
        externalOrderId: escrow.externalOrderId,
        status: EscrowStatus.DELIVERED,
      },
    });

    return delivered;
  }

  async release(auth: AuthenticatedPlatformKey, escrowId: string) {
    this.apiKeys.assertScope(auth, 'releases:write');
    const escrow = await this.loadPlatformEscrow(auth.platformId, escrowId);
    const policy = escrow.releasePolicy || PartnerReleasePolicy.PLATFORM_RELEASE;

    if (
      policy !== PartnerReleasePolicy.PLATFORM_RELEASE &&
      policy !== PartnerReleasePolicy.AUTO_ON_DELIVERY
    ) {
      throw new ForbiddenException(
        `Release policy ${policy} does not allow platform release`,
      );
    }

    // Ensure delivered/awaiting_release first for funded orders
    if (
      escrow.status === EscrowStatus.FUNDED ||
      escrow.status === EscrowStatus.SHIPPED ||
      escrow.status === EscrowStatus.IN_TRANSIT ||
      escrow.status === EscrowStatus.AWAITING_SHIPMENT
    ) {
      await this.escrowService.deliverEscrowAsPlatform(escrow.id, auth.platformId);
    }

    const result = await this.escrowService.releaseFundsAsPlatform(
      escrow.id,
      auth.platformId,
    );

    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'escrow.released',
      data: {
        escrowId: escrow.id,
        externalOrderId: escrow.externalOrderId,
        status: EscrowStatus.RELEASED,
        netAmountCents: escrow.netAmountCents,
      },
    });

    return result;
  }

  async refund(
    auth: AuthenticatedPlatformKey,
    escrowId: string,
    reason?: string,
  ) {
    this.apiKeys.assertScope(auth, 'refunds:write');
    const escrow = await this.loadPlatformEscrow(auth.platformId, escrowId);
    const result = await this.escrowService.refundEscrowAsPlatform(
      escrow.id,
      auth.platformId,
      reason,
    );
    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'escrow.refunded',
      data: {
        escrowId: escrow.id,
        externalOrderId: escrow.externalOrderId,
        status: EscrowStatus.REFUNDED,
        reason: reason || null,
      },
    });
    return result;
  }

  async linkMerchant(
    auth: AuthenticatedPlatformKey,
    body: {
      externalMerchantId: string;
      sellerEmail?: string;
      sellerPhone?: string;
      sellerUserId?: string;
      businessName?: string;
    },
  ) {
    this.apiKeys.assertScope(auth, 'merchants:write');
    const link = await this.platforms.linkMerchant({
      platformId: auth.platformId,
      ...body,
    });
    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'merchant.linked',
      data: {
        externalMerchantId: link.externalMerchantId,
        userId: link.userId,
        kycStatus: link.user.kycStatus,
      },
    });
    return link;
  }

  getMerchant(auth: AuthenticatedPlatformKey, externalMerchantId: string) {
    this.apiKeys.assertScope(auth, 'merchants:read');
    return this.platforms.getMerchant(auth.platformId, externalMerchantId);
  }

  createWebhookEndpoint(
    auth: AuthenticatedPlatformKey,
    body: { url: string; events?: string[]; environment?: PlatformEnvironment },
  ) {
    this.apiKeys.assertScope(auth, 'webhooks:manage');
    return this.webhooks.createEndpoint({
      platformId: auth.platformId,
      environment: body.environment ?? auth.environment,
      url: body.url,
      events: body.events,
    });
  }

  listWebhookEndpoints(auth: AuthenticatedPlatformKey) {
    this.apiKeys.assertScope(auth, 'webhooks:manage');
    return this.webhooks.listEndpoints(auth.platformId, auth.environment);
  }

  listWebhookDeliveries(auth: AuthenticatedPlatformKey) {
    this.apiKeys.assertScope(auth, 'webhooks:manage');
    return this.webhooks.listDeliveries(auth.platformId);
  }
}
