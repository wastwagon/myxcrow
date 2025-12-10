import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async getEscrowLedger(escrowId: string) {
    const journals = await this.prisma.ledgerJournal.findMany({
      where: { escrowId },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return journals;
  }
}




