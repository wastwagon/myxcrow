import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from './escrow.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MilestoneEscrowService {
  constructor(
    private prisma: PrismaService,
    private escrowService: EscrowService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private ledgerHelper: LedgerHelperService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async createMilestones(
    escrowId: string,
    milestones: Array<{ name: string; description?: string; amountCents: number; targetDate?: Date | string; approvalWindowDays?: number }>,
  ) {
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
        targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
        approvalWindowDays: m.approvalWindowDays ?? 5,
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

    if (milestone.escrow.sellerId !== userId) {
      throw new BadRequestException('Only the seller can submit a milestone');
    }

    if (milestone.status !== 'pending') {
      throw new BadRequestException(`Milestone is ${milestone.status}, cannot submit`);
    }

    return this.prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
    });
  }

  async approveMilestone(escrowId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.escrowMilestone.findUnique({
      where: { id: milestoneId },
      include: { escrow: true },
    });

    if (!milestone || milestone.escrowId !== escrowId) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can approve a milestone');
    }

    if (milestone.status !== 'submitted' && milestone.status !== 'completed') {
      throw new BadRequestException(`Milestone is ${milestone.status}, cannot approve`);
    }

    return this.prisma.escrowMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
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

    if (milestone.escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can release milestone funds');
    }

    if (!['approved', 'completed'].includes(milestone.status)) {
      throw new BadRequestException('Milestone must be approved before release');
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

  /**
   * Phase 3: auto-approve submitted milestones after approval window
   * when no active dispute exists on the parent escrow.
   */
  async processAutoApproval() {
    const submittedMilestones = await this.prisma.escrowMilestone.findMany({
      where: {
        status: 'submitted',
        submittedAt: { not: null },
      },
      include: {
        escrow: {
          include: {
            buyer: { select: { email: true, phone: true } },
            seller: { select: { email: true, phone: true } },
            disputes: {
              where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
              select: { id: true },
            },
          },
        },
      },
    });

    let processed = 0;
    let remindersSent = 0;
    const remindersEnabled = (process.env.MILESTONE_APPROVAL_REMINDERS_ENABLED || 'false').toLowerCase() === 'true';
    for (const milestone of submittedMilestones) {
      if (!milestone.submittedAt) continue;
      if (milestone.escrow.disputes.length > 0) continue;

      const windowDays = milestone.approvalWindowDays ?? 5;
      const approvalDeadline = new Date(milestone.submittedAt);
      approvalDeadline.setDate(approvalDeadline.getDate() + windowDays);
      const now = new Date();

      // Optional reminder: once per milestone, within 24h before auto-approval deadline.
      if (
        remindersEnabled &&
        !milestone.approvalReminderSentAt &&
        now < approvalDeadline &&
        approvalDeadline.getTime() - now.getTime() <= 24 * 60 * 60 * 1000
      ) {
        await this.notificationsService.sendMilestoneApprovalReminderNotifications({
          buyerEmail: milestone.escrow.buyer.email,
          buyerPhone: milestone.escrow.buyer.phone,
          sellerEmail: milestone.escrow.seller.email,
          sellerPhone: milestone.escrow.seller.phone,
          escrowId: milestone.escrowId,
          milestoneName: milestone.name,
          approvalDueAt: approvalDeadline.toISOString(),
        });
        await this.prisma.escrowMilestone.update({
          where: { id: milestone.id },
          data: { approvalReminderSentAt: now },
        });
        remindersSent++;
      }

      if (now >= approvalDeadline) {
        const updated = await this.prisma.escrowMilestone.update({
          where: { id: milestone.id },
          data: {
            status: 'approved',
            approvedAt: new Date(),
          },
        });
        await this.auditService.log({
          userId: 'system',
          action: 'milestone_auto_approved',
          resource: 'escrow_milestone',
          resourceId: updated.id,
          details: {
            escrowId: milestone.escrowId,
            approvalWindowDays: windowDays,
            submittedAt: milestone.submittedAt,
            approvalDeadline,
          },
          beforeState: { status: 'submitted' },
          afterState: { status: 'approved', approvedAt: updated.approvedAt },
        });
        processed++;
      }
    }

    return { processed, remindersSent };
  }
}
