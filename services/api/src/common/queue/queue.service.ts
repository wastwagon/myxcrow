import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface SMSJobData {
  to: string;
  message: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface WebhookJobData {
  url: string;
  payload: any;
  headers?: Record<string, string>;
  signature?: string;
  retryCount?: number;
}

export interface CleanupJobData {
  type: 'evidence' | 'disputes' | 'emails' | 'audit';
  olderThanDays: number;
  batchSize?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue<EmailJobData>,
    @InjectQueue('sms') private smsQueue: Queue<SMSJobData>,
    @InjectQueue('webhook') private webhookQueue: Queue<WebhookJobData>,
    @InjectQueue('cleanup') private cleanupQueue: Queue<CleanupJobData>,
  ) {}

  /**
   * Add email job to queue
   */
  async addEmailJob(data: EmailJobData, options?: { priority?: number; delay?: number }) {
    const job = await this.emailQueue.add('send-email', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    });
    this.logger.log(`Email job ${job.id} added to queue`);
    return job;
  }

  /**
   * Add SMS job to queue
   */
  async addSMSJob(data: SMSJobData, options?: { priority?: number; delay?: number }) {
    const job = await this.smsQueue.add('send-sms', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    });
    this.logger.log(`SMS job ${job.id} added to queue`);
    return job;
  }

  /**
   * Add webhook job to queue
   */
  async addWebhookJob(data: WebhookJobData, options?: { priority?: number; delay?: number }) {
    const job = await this.webhookQueue.add('send-webhook', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    });
    this.logger.log(`Webhook job ${job.id} added to queue`);
    return job;
  }

  /**
   * Add cleanup job to queue
   */
  async addCleanupJob(data: CleanupJobData, options?: { priority?: number; delay?: number }) {
    const job = await this.cleanupQueue.add('cleanup-data', data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
    });
    this.logger.log(`Cleanup job ${job.id} added to queue`);
    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [emailStats, smsStats, webhookStats, cleanupStats] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.smsQueue.getJobCounts(),
      this.webhookQueue.getJobCounts(),
      this.cleanupQueue.getJobCounts(),
    ]);

    return {
      email: emailStats,
      sms: smsStats,
      webhook: webhookStats,
      cleanup: cleanupStats,
    };
  }

  /**
   * Get failed jobs (for DLQ monitoring)
   */
  async getFailedJobs(queueName: 'email' | 'sms' | 'webhook' | 'cleanup', limit: number = 10) {
    const queue = this.getQueue(queueName);
    const failed = await queue.getFailed(0, limit - 1);
    return failed;
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(queueName: 'email' | 'sms' | 'webhook' | 'cleanup', jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Retrying job ${jobId} from ${queueName} queue`);
    }
  }

  /**
   * Move job to DLQ (mark as permanently failed)
   */
  async moveToDLQ(queueName: 'email' | 'sms' | 'webhook' | 'cleanup', jobId: string, reason: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.moveToFailed(new Error(`Moved to DLQ: ${reason}`), job.token);
      this.logger.warn(`Job ${jobId} moved to DLQ: ${reason}`);
    }
  }

  private getQueue(queueName: 'email' | 'sms' | 'webhook' | 'cleanup'): Queue {
    switch (queueName) {
      case 'email':
        return this.emailQueue;
      case 'sms':
        return this.smsQueue;
      case 'webhook':
        return this.webhookQueue;
      case 'cleanup':
        return this.cleanupQueue;
    }
  }
}




