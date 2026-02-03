import { Module, Global, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { SMSProcessor } from './processors/sms.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { EmailModule } from '../../modules/email/email.module';
import { SMSModule } from '../../modules/notifications/sms.module';

@Global()
@Module({
  imports: [
    forwardRef(() => EmailModule),
    forwardRef(() => SMSModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Parse REDIS_URL if provided, otherwise use individual settings
        const redisUrl = configService.get<string>('REDIS_URL');
        let connection: any;

        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            connection = {
              host: url.hostname,
              port: parseInt(url.port || '6379', 10),
              password: url.password || undefined,
            };
          } catch {
            // Fallback to individual settings
            connection = {
              host: configService.get<string>('REDIS_HOST') || 'localhost',
              port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
              password: configService.get<string>('REDIS_PASSWORD'),
            };
          }
        } else {
          connection = {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
            password: configService.get<string>('REDIS_PASSWORD'),
          };
        }

        return {
          connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: {
              age: 24 * 3600, // Keep completed jobs for 24 hours
              count: 1000,
            },
            removeOnFail: {
              age: 7 * 24 * 3600, // Keep failed jobs for 7 days
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'sms' },
      { name: 'webhook' },
      { name: 'cleanup' },
    ),
  ],
  providers: [QueueService, EmailProcessor, SMSProcessor, WebhookProcessor, CleanupProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}

