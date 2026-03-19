import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoReleaseService } from './auto-release.service';
import { MilestoneEscrowService } from './milestone-escrow.service';

@Injectable()
export class EscrowSchedulerService {
  private readonly logger = new Logger(EscrowSchedulerService.name);

  constructor(
    private autoReleaseService: AutoReleaseService,
    private milestoneEscrowService: MilestoneEscrowService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoRelease() {
    this.logger.log('Running scheduled auto-release job...');
    await this.autoReleaseService.processAutoRelease();

    this.logger.log('Running milestone auto-approval job...');
    const { processed, remindersSent } = await this.milestoneEscrowService.processAutoApproval();
    this.logger.log(`Milestone auto-approval complete: ${processed} approved, ${remindersSent} reminders sent`);
  }
}




