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
    @Body() body: { shortReference?: string; deliveryCode?: string; deliveryPin?: string },
  ) {
    const shortReference = body.shortReference?.trim();
    const deliveryPin = body.deliveryPin?.trim();
    const deliveryCode = body.deliveryCode?.trim();

    if (!shortReference) {
      throw new BadRequestException('shortReference is required');
    }

    // PIN flow: reference + PIN (for escrows with deliveryConfirmationMode = 'pin')
    if (deliveryPin) {
      return this.escrowService.confirmDeliveryByPin(shortReference, deliveryPin);
    }

    // Code flow: reference + delivery code (default)
    if (!deliveryCode) {
      throw new BadRequestException('deliveryCode or deliveryPin is required');
    }
    return this.escrowService.confirmDeliveryByCode(shortReference, deliveryCode);
  }
}
