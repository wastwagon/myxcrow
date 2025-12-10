import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from './settings.service';
import { QueueService } from '../../common/queue/queue.service';

/**
 * Scheduled cleanup jobs for data retention
 */
@Injectable()
export class CleanupSchedulerService {
  private readonly logger = new Logger(CleanupSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private queueService: QueueService,
  ) {}

  /**
   * Run cleanup jobs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleCleanupJobs() {
    this.logger.log('Scheduling data retention cleanup jobs...');

    try {
      // Get retention settings
      const evidenceDays = await this.settingsService.getSetting('dataRetention.evidenceDays');
      const disputeDays = await this.settingsService.getSetting('dataRetention.disputeDays');
      const auditDays = await this.settingsService.getSetting('audit.retentionDays');

      // Schedule cleanup jobs
      await Promise.all([
        this.queueService.addCleanupJob({
          type: 'evidence',
          olderThanDays: evidenceDays.value as number,
          batchSize: 100,
        }),
        this.queueService.addCleanupJob({
          type: 'disputes',
          olderThanDays: disputeDays.value as number,
          batchSize: 50,
        }),
        this.queueService.addCleanupJob({
          type: 'audit',
          olderThanDays: auditDays.value as number,
          batchSize: 500,
        }),
      ]);

      this.logger.log('Cleanup jobs scheduled successfully');
    } catch (error: any) {
      this.logger.error(`Failed to schedule cleanup jobs: ${error.message}`);
    }
  }
}




