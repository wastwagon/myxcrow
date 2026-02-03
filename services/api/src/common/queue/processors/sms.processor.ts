import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { SMSService } from '../../../modules/notifications/sms.service';
import { QueueService, SMSJobData } from '../queue.service';

@Processor('sms')
@Injectable()
export class SMSProcessor extends WorkerHost {
  private readonly logger = new Logger(SMSProcessor.name);

  constructor(
    private smsService: SMSService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<SMSJobData>): Promise<void> {
    this.logger.log(`Processing SMS job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      // Send SMS directly (not through queue to avoid recursion)
      await this.smsService.sendSMS(job.data.to, job.data.message, false);
      this.logger.log(`SMS job ${job.id} completed successfully`);
    } catch (error: any) {
      this.logger.error(`SMS job ${job.id} failed: ${error.message}`);

      // If this is the last attempt, move to DLQ
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.logger.warn(`SMS job ${job.id} exceeded max attempts, moving to DLQ`);
        await this.queueService.moveToDLQ('sms', job.id!, `Max attempts reached: ${error.message}`);
      }

      throw error; // Re-throw to trigger retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`SMS job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`SMS job ${job.id} failed: ${error.message}`);
  }
}
