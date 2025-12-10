import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../../modules/email/email.service';
import { QueueService, EmailJobData } from '../queue.service';

@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private emailService: EmailService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      // Send email directly (not through queue to avoid recursion)
      await this.emailService.sendEmail(job.data.to, job.data.subject, job.data.html, false);
      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error: any) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);

      // If this is the last attempt, move to DLQ
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.logger.warn(`Email job ${job.id} exceeded max attempts, moving to DLQ`);
        await this.queueService.moveToDLQ('email', job.id!, `Max attempts reached: ${error.message}`);
      }

      throw error; // Re-throw to trigger retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Email job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Email job ${job.id} failed: ${error.message}`);
  }
}

