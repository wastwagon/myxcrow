import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from './escrow.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';

@Injectable()
export class MilestoneEscrowService {
  constructor(
    private prisma: PrismaService,
    private escrowService: EscrowService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private ledgerHelper: LedgerHelperService,
  ) {}

  async createMilestones(escrowId: string, milestones: Array<{ name: string; description?: string; amountCents: number }>) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amountCents, 0);
    if (totalMilestoneAmount > escrow.amountCents) {
      throw new BadRequestException('Total milestone amount exceeds escrow amount');
    }

    return this.prisma.escrowMilestone.createMany({
      data: milestones.map((m) => ({
        escrowId,
        name: m.name,
        description: m.description,
        amountCents: m.amountCents,
        status: 'pending',
      })),
    });
  }

  async getMilestones(escrowId: string) {
    return this.prisma.escrowMilestone.findMany({
      where: { escrowId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async completeMilestone(escrowId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.escrowMilestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true },
    });

    if (!milestone || milestone.escrowId !== escrowId) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can complete a milestone');
    }

    if (milestone.status !== 'pending') {
      throw new BadRequestException(`Milestone is already ${milestone.status}`);
    }

    return this.prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  async releaseMilestone(escrowId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.escrowMilestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true },
    });

    if (!milestone || milestone.escrowId !== escrowId) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== 'completed') {
      throw new BadRequestException('Milestone must be completed before release');
    }

    // Release milestone amount to seller wallet
    if (milestone.escrow.sellerWalletId) {
      try {
        // releaseToSeller expects wallet ID, not user ID
        const sellerWallet = await this.prisma.wallet.findUnique({
          where: { id: milestone.escrow.sellerWalletId },
        });
        
        if (sellerWallet) {
          await this.walletService.releaseToSeller(
            milestone.escrow.sellerWalletId,
            milestone.amountCents,
            `${escrowId}_milestone_${milestoneId}`,
          );
        }
      } catch (error: any) {
        // If wallet service fails, still update milestone status
        // but log the error
        console.error('Error releasing funds to seller wallet:', error.message);
      }
    }

    return this.prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'released',
        releasedAt: new Date(),
      },
    });
  }
}
