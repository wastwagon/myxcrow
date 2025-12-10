import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { QueueService, WebhookJobData } from '../queue.service';

@Processor('webhook')
@Injectable()
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private queueService: QueueService) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    this.logger.log(`Processing webhook job ${job.id} to ${job.data.url} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...job.data.headers,
      };

      if (job.data.signature) {
        headers['X-Signature'] = job.data.signature;
      }

      const response = await axios.post(job.data.url, job.data.payload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      this.logger.log(`Webhook job ${job.id} completed with status ${response.status}`);
    } catch (error: any) {
      this.logger.error(`Webhook job ${job.id} failed: ${error.message}`);

      // If this is the last attempt, move to DLQ
      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.logger.warn(`Webhook job ${job.id} exceeded max attempts, moving to DLQ`);
        await this.queueService.moveToDLQ('webhook', job.id!, `Max attempts reached: ${error.message}`);
      }

      throw error; // Re-throw to trigger retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Webhook job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Webhook job ${job.id} failed: ${error.message}`);
  }
}




