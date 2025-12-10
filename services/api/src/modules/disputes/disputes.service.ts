import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus, DisputeReason } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private auditService: AuditService,
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

    await this.emailService.sendDisputeOpenedEmail({
      to: [buyer!.email, seller!.email],
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

  async listDisputes(filters?: { escrowId?: string; initiatorId?: string; status?: DisputeStatus }) {
    const where: any = {};
    if (filters?.escrowId) where.escrowId = filters.escrowId;
    if (filters?.initiatorId) where.initiatorId = filters.initiatorId;
    if (filters?.status) where.status = filters.status;

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
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        content,
        isSystem: false,
      },
    });
  }

  async resolveDispute(disputeId: string, adminId: string, resolution: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: dispute.escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: dispute.escrow.sellerId } });

    await this.emailService.sendDisputeResolvedEmail({
      to: [buyer!.email, seller!.email],
      escrowId: dispute.escrowId,
      disputeId: dispute.id,
    });

    await this.auditService.log({
      userId: adminId,
      action: 'dispute_resolved',
      resource: 'dispute',
      resourceId: disputeId,
      details: { resolution },
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

