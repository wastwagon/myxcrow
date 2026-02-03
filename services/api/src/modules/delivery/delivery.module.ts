import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [EscrowModule],
  controllers: [DeliveryController],
})
export class DeliveryModule {}
