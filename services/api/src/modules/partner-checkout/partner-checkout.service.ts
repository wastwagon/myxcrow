import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  CheckoutSessionStatus,
  EscrowStatus,
  KYCStatus,
  PartnerReleasePolicy,
  PlatformEnvironment,
  Prisma,
  UserRole,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsService } from '../platforms/platforms.service';
import { EscrowService } from '../escrow/escrow.service';
import { PartnerWebhooksService } from '../partner-webhooks/partner-webhooks.service';
import { PaystackService } from '../payments/paystack.service';
import type { AuthenticatedPlatformKey } from '../api-keys/api-keys.service';

@Injectable()
export class PartnerCheckoutService {
  private readonly logger = new Logger(PartnerCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platforms: PlatformsService,
    @Inject(forwardRef(() => EscrowService))
    private readonly escrowService: EscrowService,
    private readonly webhooks: PartnerWebhooksService,
    private readonly paystack: PaystackService,
  ) {}

  private webBase(): string {
    return (
      process.env.WEB_BASE_URL ||
      process.env.WEB_APP_URL ||
      'http://localhost:3007'
    ).replace(/\/$/, '');
  }

  private async resolveOrCreateGuestBuyer(params: {
    platformId: string;
    email?: string;
    phone?: string;
    externalOrderId: string;
  }) {
    if (params.email) {
      const email = params.email.trim().toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) return existing;
      return this.prisma.user.create({
        data: {
          email,
          phone: params.phone || null,
          firstName: 'Guest',
          lastName: 'Buyer',
          roles: [UserRole.BUYER],
          passwordHash: createHash('sha256')
            .update(`guest:${randomBytes(16).toString('hex')}`)
            .digest('hex'),
          emailVerified: false,
        },
      });
    }

    const email = `partner+${params.platformId.slice(0, 8)}.${params.externalOrderId
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 40)}@guest.myxcrow.internal`;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return existing;
    return this.prisma.user.create({
      data: {
        email,
        phone: params.phone || null,
        firstName: 'Guest',
        lastName: 'Buyer',
        roles: [UserRole.BUYER],
        passwordHash: createHash('sha256')
          .update(`guest:${randomBytes(16).toString('hex')}`)
          .digest('hex'),
      },
    });
  }

  async createCheckoutSession(
    auth: AuthenticatedPlatformKey,
    body: {
      externalOrderId: string;
      amountCents: number;
      currency?: string;
      externalMerchantId: string;
      successUrl: string;
      cancelUrl: string;
      buyerEmail?: string;
      buyerPhone?: string;
      description?: string;
      escrowCategory?: 'PHYSICAL_GOODS' | 'PROFESSIONAL_SERVICE';
      serviceType?: string;
      deliveryRegion?: string;
      deliveryCity?: string;
      deliveryAddressLine?: string;
      deliveryPhone?: string;
      autoReleaseDays?: number;
      releasePolicy?: PartnerReleasePolicy;
      metadata?: Record<string, unknown>;
      ttlMinutes?: number;
    },
  ) {
    if (!body.externalOrderId?.trim()) {
      throw new BadRequestException('externalOrderId is required');
    }
    if (!Number.isFinite(body.amountCents) || body.amountCents < 100) {
      throw new BadRequestException('amountCents must be at least 100 (GHS 1.00)');
    }

    const platform = await this.platforms.getById(auth.platformId);
    this.platforms.assertUrlAllowed(platform.successUrlAllowlist, body.successUrl, 'success');
    this.platforms.assertUrlAllowed(platform.cancelUrlAllowlist, body.cancelUrl, 'cancel');

    const merchant = await this.platforms.getMerchant(
      auth.platformId,
      body.externalMerchantId,
    );
    if (merchant.user.kycStatus !== KYCStatus.VERIFIED) {
      throw new BadRequestException(
        'Merchant must verify their phone on MYXCROW before accepting escrow payments',
      );
    }

    const existing = await this.prisma.partnerCheckoutSession.findUnique({
      where: {
        platformId_environment_externalOrderId: {
          platformId: auth.platformId,
          environment: auth.environment,
          externalOrderId: body.externalOrderId,
        },
      },
    });
    if (existing && existing.status === CheckoutSessionStatus.OPEN) {
      return this.toSessionResponse(existing);
    }
    if (existing) {
      throw new ConflictException('Checkout session already exists for this externalOrderId');
    }

    const buyer = await this.resolveOrCreateGuestBuyer({
      platformId: auth.platformId,
      email: body.buyerEmail,
      phone: body.buyerPhone,
      externalOrderId: body.externalOrderId,
    });

    const category = body.escrowCategory ?? 'PHYSICAL_GOODS';
    const releasePolicy =
      body.releasePolicy ?? platform.releasePolicy ?? PartnerReleasePolicy.PLATFORM_RELEASE;

    // Partner commerce: delivery address optional when DwumaPOS owns logistics
    const deliveryRegion = body.deliveryRegion?.trim() || 'Ghana';
    const deliveryCity = body.deliveryCity?.trim() || 'Accra';
    const deliveryAddressLine =
      body.deliveryAddressLine?.trim() || `Order ${body.externalOrderId}`;

    let escrow;
    try {
      escrow = await this.escrowService.createEscrow({
        buyerId: buyer.id,
        sellerId: merchant.userId,
        amountCents: body.amountCents,
        currency: body.currency || 'GHS',
        description: body.description || `Order ${body.externalOrderId}`,
        useWallet: false,
        autoReleaseDays: body.autoReleaseDays ?? 0,
        escrowCategory: category,
        serviceType:
          category === 'PROFESSIONAL_SERVICE'
            ? body.serviceType || 'Professional Service'
            : undefined,
        deliveryRegion,
        deliveryCity,
        deliveryAddressLine,
        deliveryPhone: body.deliveryPhone || body.buyerPhone,
      });
    } catch (e: any) {
      this.logger.error(`Partner escrow create failed: ${e?.message}`);
      throw e;
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrow.id },
      data: {
        platformId: auth.platformId,
        environment: auth.environment,
        externalOrderId: body.externalOrderId,
        releasePolicy,
        partnerMetadata: {
          ...(body.metadata || {}),
          externalMerchantId: body.externalMerchantId,
          platformSlug: auth.platformSlug,
        } as Prisma.InputJsonValue,
      },
    });

    const ttl = Math.min(Math.max(body.ttlMinutes ?? 60, 5), 24 * 60);
    const session = await this.prisma.partnerCheckoutSession.create({
      data: {
        platformId: auth.platformId,
        environment: auth.environment,
        escrowId: escrow.id,
        externalOrderId: body.externalOrderId,
        status: CheckoutSessionStatus.OPEN,
        amountCents: body.amountCents,
        currency: body.currency || 'GHS',
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        buyerEmail: body.buyerEmail,
        buyerPhone: body.buyerPhone,
        expiresAt: new Date(Date.now() + ttl * 60_000),
        metadata: (body.metadata || {}) as Prisma.InputJsonValue,
      },
    });

    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'checkout.session.created',
      data: {
        sessionId: session.id,
        escrowId: escrow.id,
        externalOrderId: body.externalOrderId,
        amountCents: body.amountCents,
        currency: session.currency,
      },
    });
    await this.webhooks.emit({
      platformId: auth.platformId,
      environment: auth.environment,
      eventType: 'escrow.created',
      data: {
        escrowId: escrow.id,
        externalOrderId: body.externalOrderId,
        status: EscrowStatus.AWAITING_FUNDING,
      },
    });

    return this.toSessionResponse(session);
  }

  private toSessionResponse(session: {
    id: string;
    escrowId: string | null;
    externalOrderId: string;
    status: CheckoutSessionStatus;
    amountCents: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    expiresAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: session.id,
      escrowId: session.escrowId,
      externalOrderId: session.externalOrderId,
      status: session.status,
      amountCents: session.amountCents,
      currency: session.currency,
      checkoutUrl: `${this.webBase()}/partner/checkout/${session.id}`,
      successUrl: session.successUrl,
      cancelUrl: session.cancelUrl,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt,
    };
  }

  async getSession(platformId: string, sessionId: string) {
    const session = await this.prisma.partnerCheckoutSession.findFirst({
      where: { id: sessionId, platformId },
    });
    if (!session) throw new NotFoundException('Checkout session not found');
    return this.toSessionResponse(session);
  }

  /** Public: load session for hosted checkout page (no API key). */
  async getPublicSession(sessionId: string) {
    const session = await this.prisma.partnerCheckoutSession.findUnique({
      where: { id: sessionId },
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            description: true,
            amountCents: true,
            currency: true,
            seller: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        platform: { select: { name: true, slug: true } },
      },
    });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (session.status === CheckoutSessionStatus.EXPIRED) {
      throw new BadRequestException('Checkout session expired');
    }
    if (session.expiresAt < new Date() && session.status === CheckoutSessionStatus.OPEN) {
      await this.prisma.partnerCheckoutSession.update({
        where: { id: session.id },
        data: { status: CheckoutSessionStatus.EXPIRED },
      });
      throw new BadRequestException('Checkout session expired');
    }
    return session;
  }

  /** Public: start Paystack payment for partner checkout session. */
  async initializePublicPayment(sessionId: string, email?: string) {
    const session = await this.getPublicSession(sessionId);
    if (session.status !== CheckoutSessionStatus.OPEN) {
      throw new BadRequestException(`Session is ${session.status}`);
    }
    if (!session.escrowId) throw new BadRequestException('Session has no escrow');

    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: session.escrowId },
      include: { buyer: { select: { email: true } } },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.status !== EscrowStatus.AWAITING_FUNDING) {
      throw new BadRequestException(`Escrow is ${escrow.status}`);
    }

    const reference = `PARTNER_${session.id}_${Date.now()}`;
    const payEmail = email || session.buyerEmail || escrow.buyer.email;
    const callbackUrl = `${this.webBase()}/partner/checkout/${session.id}/callback?reference=${encodeURIComponent(reference)}`;

    const paystackResponse = await this.paystack.initializePayment({
      email: payEmail,
      amount: escrow.fundingAmountCents || escrow.amountCents,
      currency: escrow.currency || 'GHS',
      reference,
      metadata: {
        type: 'partner_escrow_fund',
        escrowId: escrow.id,
        sessionId: session.id,
        platformId: session.platformId,
        externalOrderId: session.externalOrderId,
        userId: escrow.buyerId,
      },
      callback_url: callbackUrl,
      channels: ['card', 'bank', 'mobile_money', 'ussd'],
    });

    await this.prisma.payment.create({
      data: {
        escrowId: escrow.id,
        userId: escrow.buyerId,
        type: 'funding',
        amountCents: escrow.fundingAmountCents || escrow.amountCents,
        currency: escrow.currency || 'GHS',
        status: 'PENDING',
        provider: 'paystack',
        providerId: reference,
        metadata: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
          partnerSessionId: session.id,
        },
      },
    });

    return {
      authorizationUrl: paystackResponse.data.authorization_url,
      reference,
      sessionId: session.id,
    };
  }

  /** Called after Paystack verify for partner sessions — session status only (webhooks emit elsewhere). */
  async markSessionFunded(sessionId: string, escrowId: string) {
    const session = await this.prisma.partnerCheckoutSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return;

    if (session.status !== CheckoutSessionStatus.COMPLETED) {
      await this.prisma.partnerCheckoutSession.update({
        where: { id: session.id },
        data: {
          status: CheckoutSessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }
  }

  buildReturnUrl(sessionId: string, status: 'funded' | 'cancelled' | 'failed') {
    return this.prisma.partnerCheckoutSession.findUnique({ where: { id: sessionId } }).then(
      (session) => {
        if (!session) throw new NotFoundException('Session not found');
        const base = status === 'cancelled' ? session.cancelUrl : session.successUrl;
        const url = new URL(base);
        url.searchParams.set('checkout_session_id', session.id);
        if (session.escrowId) url.searchParams.set('escrow_id', session.escrowId);
        url.searchParams.set('external_order_id', session.externalOrderId);
        url.searchParams.set('status', status);
        return url.toString();
      },
    );
  }
}
