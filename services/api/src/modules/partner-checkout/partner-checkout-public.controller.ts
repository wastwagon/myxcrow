import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PartnerCheckoutService } from './partner-checkout.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * Public hosted-checkout endpoints (no JWT / API key).
 * Buyer pays on MYXCROW; partner is notified via webhooks + return URL.
 */
@Controller('partner/checkout')
export class PartnerCheckoutPublicController {
  constructor(
    private readonly checkout: PartnerCheckoutService,
    private readonly payments: PaymentsService,
  ) {}

  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.checkout.getPublicSession(sessionId);
  }

  @Post(':sessionId/pay')
  initializePay(
    @Param('sessionId') sessionId: string,
    @Body() body: { email?: string },
  ) {
    return this.checkout.initializePublicPayment(sessionId, body?.email);
  }

  @Get(':sessionId/verify')
  async verify(
    @Param('sessionId') sessionId: string,
    @Query('reference') reference: string,
  ) {
    const payment = await this.payments.verifyEscrowFunding(reference);
    const meta = (payment.metadata || {}) as Record<string, unknown>;
    const sid = (meta.partnerSessionId as string) || sessionId;
    if (payment.escrowId) {
      await this.checkout.markSessionFunded(sid, payment.escrowId);
    }
    const redirectUrl = await this.checkout.buildReturnUrl(sid, 'funded');
    return {
      status: 'funded',
      escrowId: payment.escrowId,
      sessionId: sid,
      redirectUrl,
    };
  }

  @Get(':sessionId/return-url')
  returnUrl(
    @Param('sessionId') sessionId: string,
    @Query('status') status: 'funded' | 'cancelled' | 'failed' = 'cancelled',
  ) {
    return this.checkout.buildReturnUrl(sessionId, status).then((url) => ({ url }));
  }
}
