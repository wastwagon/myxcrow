import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoReleaseService } from './auto-release.service';

@Injectable()
export class EscrowSchedulerService {
  private readonly logger = new Logger(EscrowSchedulerService.name);

  constructor(private autoReleaseService: AutoReleaseService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoRelease() {
    this.logger.log('Running scheduled auto-release job...');
    await this.autoReleaseService.processAutoRelease();
  }
}




