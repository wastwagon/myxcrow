import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { EscrowService } from '../escrow/escrow.service';
import { RATE_LIMIT_STORE } from '../../common/rate-limit/rate-limit.constants';
import type { IRateLimitStore } from '../../common/rate-limit/rate-limit-store.interface';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Public delivery confirmation. No auth required.
 * Delivery person gets the code from the recipient (buyer) and enters reference + code here.
 * Per-reference lockout is in addition to the global IP rate limit.
 */
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly escrowService: EscrowService,
    @Inject(RATE_LIMIT_STORE) private readonly rateLimitStore: IRateLimitStore,
  ) {}

  @Post('verify')
  async verifyDelivery(
    @Body() body: { shortReference?: string; deliveryCode?: string; deliveryPin?: string },
  ) {
    const shortReference = body.shortReference?.trim();
    const deliveryPin = body.deliveryPin?.trim();
    const deliveryCode = body.deliveryCode?.trim();

    if (!shortReference) {
      throw new BadRequestException('shortReference is required');
    }

    const refKey = shortReference.toUpperCase();
    const { count } = await this.rateLimitStore.increment(`delivery_ref_${refKey}`, WINDOW_MS);
    if (count > MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many attempts for this reference. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (deliveryPin) {
      return this.escrowService.confirmDeliveryByPin(shortReference, deliveryPin);
    }

    if (!deliveryCode) {
      throw new BadRequestException('deliveryCode or deliveryPin is required');
    }
    return this.escrowService.confirmDeliveryByCode(shortReference, deliveryCode);
  }
}
