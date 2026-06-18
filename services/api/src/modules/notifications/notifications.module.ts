import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { SMSModule } from './sms.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, SMSModule, EmailModule],
  providers: [NotificationsService],
  exports: [NotificationsService, SMSModule],
})
export class NotificationsModule {}
