import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { QueueService, CleanupJobData } from '../queue.service';

@Processor('cleanup')
@Injectable()
export class CleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<CleanupJobData>): Promise<{ deleted: number }> {
    this.logger.log(`Processing cleanup job ${job.id} for ${job.data.type} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - job.data.olderThanDays);
      const batchSize = job.data.batchSize || 100;

      let deleted = 0;

      switch (job.data.type) {
        case 'evidence':
          deleted = await this.cleanupEvidence(cutoffDate, batchSize);
          break;
        case 'disputes':
          deleted = await this.cleanupDisputes(cutoffDate, batchSize);
          break;
        case 'emails':
          // Email cleanup would be handled by email service logs
          this.logger.log('Email cleanup not implemented (handled by email service)');
          break;
        case 'audit':
          deleted = await this.cleanupAuditLogs(cutoffDate, batchSize);
          break;
        default:
          throw new Error(`Unknown cleanup type: ${job.data.type}`);
      }

      this.logger.log(`Cleanup job ${job.id} completed: deleted ${deleted} records`);
      return { deleted };
    } catch (error: any) {
      this.logger.error(`Cleanup job ${job.id} failed: ${error.message}`);

      if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
        this.logger.warn(`Cleanup job ${job.id} exceeded max attempts, moving to DLQ`);
        await this.queueService.moveToDLQ('cleanup', job.id!, `Max attempts reached: ${error.message}`);
      }

      throw error;
    }
  }

  private async cleanupEvidence(cutoffDate: Date, batchSize: number): Promise<number> {
    const oldEvidence = await this.prisma.evidence.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // Only delete evidence from closed/resolved escrows
        escrow: {
          status: {
            in: ['RELEASED', 'REFUNDED', 'CANCELLED'],
          },
        },
      },
      take: batchSize,
      select: { id: true },
    });

    if (oldEvidence.length === 0) {
      return 0;
    }

    const result = await this.prisma.evidence.deleteMany({
      where: {
        id: {
          in: oldEvidence.map((e) => e.id),
        },
      },
    });

    this.logger.log(`Deleted ${result.count} evidence records older than ${cutoffDate.toISOString()}`);
    return result.count;
  }

  private async cleanupDisputes(cutoffDate: Date, batchSize: number): Promise<number> {
    const oldDisputes = await this.prisma.dispute.findMany({
      where: {
        status: 'CLOSED',
        updatedAt: {
          lt: cutoffDate,
        },
      },
      take: batchSize,
      select: { id: true },
    });

    if (oldDisputes.length === 0) {
      return 0;
    }

    // Note: We might want to archive instead of delete
    const result = await this.prisma.dispute.deleteMany({
      where: {
        id: {
          in: oldDisputes.map((d) => d.id),
        },
      },
    });

    this.logger.log(`Deleted ${result.count} closed disputes older than ${cutoffDate.toISOString()}`);
    return result.count;
  }

  private async cleanupAuditLogs(cutoffDate: Date, batchSize: number): Promise<number> {
    // Delete in batches to avoid large transactions
    let totalDeleted = 0;
    let batchDeleted = batchSize;
    
    while (batchDeleted === batchSize) {
      const batch = await this.prisma.auditLog.findMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
        take: batchSize,
        select: { id: true },
      });
      
      if (batch.length === 0) break;
      
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          id: { in: batch.map((b) => b.id) },
        },
      });
      
      batchDeleted = result.count;
      totalDeleted += batchDeleted;
    }

    this.logger.log(`Deleted ${totalDeleted} audit logs older than ${cutoffDate.toISOString()}`);
    return totalDeleted;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Cleanup job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Cleanup job ${job.id} failed: ${error.message}`);
  }
}

