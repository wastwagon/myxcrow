import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EscrowService } from '../escrow/escrow.service';

/**
 * Public delivery confirmation. No auth required.
 * Delivery person gets the code from the recipient (buyer) and enters reference + code here.
 * Rate limiting is applied globally.
 */
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post('verify')
  async verifyDelivery(
    @Body() body: { shortReference?: string; deliveryCode?: string },
  ) {
    const shortReference = body.shortReference?.trim();
    const deliveryCode = body.deliveryCode?.trim();
    if (!shortReference || !deliveryCode) {
      throw new BadRequestException('shortReference and deliveryCode are required');
    }
    return this.escrowService.confirmDeliveryByCode(shortReference, deliveryCode);
  }
}
