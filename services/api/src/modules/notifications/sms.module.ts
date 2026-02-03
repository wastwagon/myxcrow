import { Module, forwardRef } from '@nestjs/common';
import { SMSService } from './sms.service';
import { QueueModule } from '../../common/queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [SMSService],
  exports: [SMSService],
})
export class SMSModule {}
