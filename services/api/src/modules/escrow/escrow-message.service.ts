import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscrowMessageService {
  private readonly logger = new Logger(EscrowMessageService.name);

  constructor(private prisma: PrismaService) {}

  async getMessages(escrowId: string, userId: string) {
    // Verify user is participant
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      select: { buyerId: true, sellerId: true },
    });

    if (!escrow) {
      throw new ForbiddenException('Escrow not found');
    }

    if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }

    return this.prisma.escrowMessage.findMany({
      where: { escrowId },
      include: {
        escrow: {
          select: {
            id: true,
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            seller: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(escrowId: string, userId: string, content: string) {
    // Verify user is participant
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      select: { buyerId: true, sellerId: true },
    });

    if (!escrow) {
      throw new ForbiddenException('Escrow not found');
    }

    if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }

    return this.prisma.escrowMessage.create({
      data: {
        escrowId,
        userId,
        content,
      },
      include: {
        escrow: {
          select: {
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            seller: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
}




