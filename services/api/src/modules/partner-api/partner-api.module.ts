import { Module, forwardRef } from '@nestjs/common';
import { PartnerApiController } from './partner-api.controller';
import { PartnerApiService } from './partner-api.service';
import { PartnerApiGuard } from './partner-api.guard';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PlatformsModule } from '../platforms/platforms.module';
import { PartnerCheckoutModule } from '../partner-checkout/partner-checkout.module';
import { PartnerWebhooksModule } from '../partner-webhooks/partner-webhooks.module';
import { EscrowModule } from '../escrow/escrow.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ApiKeysModule,
    PlatformsModule,
    PartnerCheckoutModule,
    PartnerWebhooksModule,
    forwardRef(() => EscrowModule),
  ],
  controllers: [PartnerApiController],
  providers: [PartnerApiService, PartnerApiGuard, PrismaService],
  exports: [PartnerApiService],
})
export class PartnerApiModule {}
