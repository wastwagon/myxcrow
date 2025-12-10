import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { FeesConfigController } from './fees-config.controller';
import { SettingsService } from './settings.service';
import { CleanupSchedulerService } from './cleanup-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../../common/queue/queue.module';

@Module({
  imports: [AuthModule, QueueModule],
  controllers: [SettingsController, FeesConfigController],
  providers: [SettingsService, CleanupSchedulerService, PrismaService],
  exports: [SettingsService],
})
export class SettingsModule {}

