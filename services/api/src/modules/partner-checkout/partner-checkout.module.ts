import { Module, forwardRef } from '@nestjs/common';
import { PartnerCheckoutService } from './partner-checkout.service';
import { PartnerCheckoutPublicController } from './partner-checkout-public.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformsModule } from '../platforms/platforms.module';
import { EscrowModule } from '../escrow/escrow.module';
import { PartnerWebhooksModule } from '../partner-webhooks/partner-webhooks.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    PlatformsModule,
    forwardRef(() => EscrowModule),
    PartnerWebhooksModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [PartnerCheckoutPublicController],
  providers: [PartnerCheckoutService, PrismaService],
  exports: [PartnerCheckoutService],
})
export class PartnerCheckoutModule {}
