import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus, DisputeReason, DisputeResolutionOutcome } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    private escrowService: EscrowService,
  ) {}

  async createDispute(data: {
    escrowId: string;
    initiatorId: string;
    reason: DisputeReason;
    description?: string;
  }) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: data.escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.buyerId !== data.initiatorId && escrow.sellerId !== data.initiatorId) {
      throw new BadRequestException('Only escrow participants can create disputes');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        escrowId: data.escrowId,
        initiatorId: data.initiatorId,
        reason: data.reason,
        description: data.description,
        status: DisputeStatus.OPEN,
      },
    });

    await this.prisma.escrowAgreement.update({
      where: { id: data.escrowId },
      data: { status: 'DISPUTED' as any },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendDisputeOpenedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: data.escrowId,
      disputeId: dispute.id,
    });

    await this.auditService.log({
      userId: data.initiatorId,
      action: 'dispute_created',
      resource: 'dispute',
      resourceId: dispute.id,
      details: { escrowId: data.escrowId, reason: data.reason },
    });

    return dispute;
  }

  async getDispute(id: string) {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            description: true,
            amountCents: true,
            currency: true,
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async listDisputes(filters?: {
    escrowId?: string;
    status?: DisputeStatus;
    userId?: string;
    isStaff?: boolean;
  }) {
    const where: any = {};
    if (filters?.escrowId) where.escrowId = filters.escrowId;
    if (filters?.status) where.status = filters.status;

    // Normal users: show disputes where they're a participant (buyer/seller)
    // Staff (ADMIN/SUPPORT): show all disputes by default
    if (!filters?.isStaff && filters?.userId) {
      where.escrow = {
        OR: [{ buyerId: filters.userId }, { sellerId: filters.userId }],
      };
    }

    return this.prisma.dispute.findMany({
      where,
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            description: true,
          },
        },
        initiator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMessage(disputeId: string, userId: string, content: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: { select: { buyerId: true, sellerId: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const message = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        content,
        isSystem: false,
      },
    });

    // Notify the other party (buyer or seller who didn't send)
    const recipientId = userId === dispute.escrow.buyerId ? dispute.escrow.sellerId : dispute.escrow.buyerId;
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, phone: true },
    });
    if (recipient) {
      this.notificationsService.sendDisputeMessageNotifications({
        email: recipient.email,
        phone: recipient.phone,
        escrowId: dispute.escrowId,
        disputeId,
      }).catch((err) => console.error('Failed to send dispute message notification:', err));
    }

    return message;
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: string,
    outcome: DisputeResolutionOutcome,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const resolvable: DisputeStatus[] = [
      DisputeStatus.OPEN,
      DisputeStatus.NEGOTIATION,
      DisputeStatus.MEDIATION,
      DisputeStatus.ARBITRATION,
    ];
    if (!resolvable.includes(dispute.status as DisputeStatus)) {
      throw new BadRequestException(`Dispute is ${dispute.status}, cannot resolve`);
    }

    if (outcome === DisputeResolutionOutcome.RELEASE_TO_SELLER) {
      await this.escrowService.releaseFundsFromDispute(dispute.escrowId, adminId);
    } else if (outcome === DisputeResolutionOutcome.REFUND_TO_BUYER) {
      await this.escrowService.refundEscrowFromDispute(dispute.escrowId, adminId, resolution);
    } else {
      throw new BadRequestException('Invalid outcome: use RELEASE_TO_SELLER or REFUND_TO_BUYER');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution,
        resolutionOutcome: outcome,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: dispute.escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: dispute.escrow.sellerId } });

    await this.notificationsService.sendDisputeResolvedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: dispute.escrowId,
      disputeId: dispute.id,
    });

    await this.auditService.log({
      userId: adminId,
      action: 'dispute_resolved',
      resource: 'dispute',
      resourceId: disputeId,
      details: { resolution, outcome },
    });

    return updated;
  }

  async closeDispute(disputeId: string, adminId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.CLOSED,
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'dispute_closed',
      resource: 'dispute',
      resourceId: disputeId,
    });

    return updated;
  }

  /**
   * Calculate SLA status for a dispute
   */
  async getDisputeSLA(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        status: true,
        createdAt: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    if (!dispute) {
      return null;
    }

    // SLA: 7 days for initial response, 14 days for resolution
    const initialResponseSLA = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const resolutionSLA = 14 * 24 * 60 * 60 * 1000; // 14 days in ms

    const now = new Date();
    const createdAt = dispute.createdAt;
    const age = now.getTime() - createdAt.getTime();

    const initialResponseDeadline = new Date(createdAt.getTime() + initialResponseSLA);
    const resolutionDeadline = new Date(createdAt.getTime() + resolutionSLA);

    let status: 'on_time' | 'warning' | 'overdue' = 'on_time';
    if (age > resolutionSLA) {
      status = 'overdue';
    } else if (age > initialResponseSLA) {
      status = 'warning';
    }

    return {
      status,
      ageDays: Math.floor(age / (24 * 60 * 60 * 1000)),
      initialResponseDeadline: initialResponseDeadline.toISOString(),
      resolutionDeadline: resolutionDeadline.toISOString(),
      isOverdue: age > resolutionSLA,
      isWarning: age > initialResponseSLA && age <= resolutionSLA,
      disputeStatus: dispute.status,
    };
  }
}

