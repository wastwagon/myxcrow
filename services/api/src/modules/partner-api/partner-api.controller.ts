import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PartnerReleasePolicy, PlatformEnvironment } from '@prisma/client';
import { PartnerApiGuard, type PartnerRequest } from './partner-api.guard';
import { PartnerApiService } from './partner-api.service';
import { PartnerCheckoutService } from '../partner-checkout/partner-checkout.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Controller('v1/partner')
@UseGuards(PartnerApiGuard)
export class PartnerApiController {
  constructor(
    private readonly partner: PartnerApiService,
    private readonly checkout: PartnerCheckoutService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  private auth(req: PartnerRequest) {
    return req.partnerAuth!;
  }

  @Get('me')
  me(@Req() req: PartnerRequest) {
    return this.partner.me(this.auth(req));
  }

  @Post('checkout/sessions')
  async createCheckout(
    @Req() req: PartnerRequest,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body()
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
    const auth = this.auth(req);
    this.apiKeys.assertScope(auth, 'checkout:write');

    if (idempotencyKey) {
      const cached = await this.apiKeys.getIdempotency(auth.platformId, idempotencyKey);
      if (cached) return cached.responseBody;
    }

    const result = await this.checkout.createCheckoutSession(auth, body);

    if (idempotencyKey) {
      await this.apiKeys.rememberIdempotency(
        auth.platformId,
        idempotencyKey,
        201,
        result as any,
        this.apiKeys.hashRequestBody(body),
      );
    }
    return result;
  }

  @Get('checkout/sessions/:id')
  getCheckout(@Req() req: PartnerRequest, @Param('id') id: string) {
    const auth = this.auth(req);
    this.apiKeys.assertScope(auth, 'checkout:write');
    return this.checkout.getSession(auth.platformId, id);
  }

  @Get('escrows/by-external/:externalOrderId')
  getByExternal(
    @Req() req: PartnerRequest,
    @Param('externalOrderId') externalOrderId: string,
  ) {
    return this.partner.getEscrowByExternal(this.auth(req), externalOrderId);
  }

  @Get('escrows/:id')
  getEscrow(@Req() req: PartnerRequest, @Param('id') id: string) {
    return this.partner.getEscrow(this.auth(req), id);
  }

  @Post('escrows/:id/ship')
  ship(
    @Req() req: PartnerRequest,
    @Param('id') id: string,
    @Body() body: { trackingNumber?: string; carrier?: string },
  ) {
    return this.partner.ship(this.auth(req), id, body || {});
  }

  @Post('escrows/:id/deliver')
  deliver(@Req() req: PartnerRequest, @Param('id') id: string) {
    return this.partner.deliver(this.auth(req), id);
  }

  @Post('escrows/:id/release')
  release(@Req() req: PartnerRequest, @Param('id') id: string) {
    return this.partner.release(this.auth(req), id);
  }

  @Post('escrows/:id/refund')
  refund(
    @Req() req: PartnerRequest,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.partner.refund(this.auth(req), id, body?.reason);
  }

  @Post('merchants')
  linkMerchant(
    @Req() req: PartnerRequest,
    @Body()
    body: {
      externalMerchantId: string;
      sellerEmail?: string;
      sellerPhone?: string;
      sellerUserId?: string;
      businessName?: string;
    },
  ) {
    return this.partner.linkMerchant(this.auth(req), body);
  }

  @Get('merchants/:externalMerchantId')
  getMerchant(
    @Req() req: PartnerRequest,
    @Param('externalMerchantId') externalMerchantId: string,
  ) {
    return this.partner.getMerchant(this.auth(req), externalMerchantId);
  }

  @Post('webhook-endpoints')
  createWebhook(
    @Req() req: PartnerRequest,
    @Body()
    body: { url: string; events?: string[]; environment?: PlatformEnvironment },
  ) {
    return this.partner.createWebhookEndpoint(this.auth(req), body);
  }

  @Get('webhook-endpoints')
  listWebhooks(@Req() req: PartnerRequest) {
    return this.partner.listWebhookEndpoints(this.auth(req));
  }

  @Get('webhook-deliveries')
  listDeliveries(@Req() req: PartnerRequest) {
    return this.partner.listWebhookDeliveries(this.auth(req));
  }
}
