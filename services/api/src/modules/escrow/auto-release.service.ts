import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from './escrow.service';
import { EscrowStatus } from '@prisma/client';

@Injectable()
export class AutoReleaseService {
  private readonly logger = new Logger(AutoReleaseService.name);

  constructor(
    private prisma: PrismaService,
    private escrowService: EscrowService,
  ) {}

  async processAutoRelease() {
    this.logger.log('Processing auto-release for completed escrows (no dispute)...');

    const completedEscrows = await this.prisma.escrowAgreement.findMany({
      where: {
        status: { in: [EscrowStatus.DELIVERED, EscrowStatus.AWAITING_RELEASE] },
        deliveredAt: { not: null },
      },
      include: {
        disputes: {
          where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
        },
      },
    });

    let processed = 0;

    for (const escrow of completedEscrows) {
      if (escrow.disputes.length > 0) {
        this.logger.log(`Skipping escrow ${escrow.id} - has active dispute`);
        continue;
      }

      const autoReleaseDays = escrow.autoReleaseDays ?? 0;
      const deliveredAt = escrow.deliveredAt!;
      const releaseDate = new Date(deliveredAt);
      releaseDate.setDate(releaseDate.getDate() + autoReleaseDays);

      if (new Date() >= releaseDate) {
        try {
          await this.escrowService.releaseFunds(escrow.id, 'system');
          processed++;
          this.logger.log(`Auto-released escrow ${escrow.id} (complete, no dispute)`);
        } catch (error: any) {
          this.logger.error(`Failed to auto-release escrow ${escrow.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Auto-release complete: ${processed} escrows released`);
    return { processed };
  }
}




