import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { PaymentStatus } from '@prisma/client';
import { LedgerHelperService } from './ledger-helper.service';
import { AuditService } from '../audit/audit.service';
import { WalletTopupService } from './wallet-topup.service';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private ledgerHelper: LedgerHelperService,
    private auditService: AuditService,
    private walletTopupService: WalletTopupService,
    @Inject(forwardRef(() => EscrowService))
    private escrowService: EscrowService,
  ) {}

  async initializeWalletTopup(data: {
    userId: string;
    email: string;
    amountCents: number;
    holdHours?: number;
  }) {
    return this.walletTopupService.initializeTopUp({
      userId: data.userId,
      email: data.email,
      amountCents: data.amountCents,
      currency: 'GHS',
      holdHours: data.holdHours,
    });
  }

  async verifyWalletTopup(reference: string) {
    return this.walletTopupService.verifyTopUp(reference);
  }

  async handleWebhook(event: string, data: any) {
    this.logger.log(`Received webhook event: ${event}`);

    if (event === 'charge.success') {
      const reference = data.reference;
      await this.verifyWalletTopup(reference);
    }

    return { received: true };
  }

  async getPayment(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            description: true,
          },
        },
      },
    });
  }

  async listPayments(userId: string, filters?: { escrowId?: string; type?: string; status?: PaymentStatus }) {
    const where: any = { userId };
    if (filters?.escrowId) where.escrowId = filters.escrowId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    return this.prisma.payment.findMany({
      where,
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}




