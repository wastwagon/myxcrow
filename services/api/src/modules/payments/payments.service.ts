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
    callbackUrl?: string;
  }) {
    return this.walletTopupService.initializeTopUp({
      userId: data.userId,
      email: data.email,
      amountCents: data.amountCents,
      currency: 'GHS',
      holdHours: data.holdHours,
      callbackUrl: data.callbackUrl,
    });
  }

  async verifyWalletTopup(reference: string) {
    return this.walletTopupService.verifyTopUp(reference);
  }

  /**
   * Handle Paystack webhook. Idempotent: duplicate webhooks return success without side effects.
   */
  async handleWebhook(event: string, data: any) {
    this.logger.log(`Received webhook event: ${event}`);

    if (event === 'charge.success') {
      const reference = data.reference;
      if (!reference) {
        this.logger.warn('Webhook charge.success missing reference');
        return { received: true };
      }

      // Escrow funding: Payment with escrowId
      const escrowPayment = await this.prisma.payment.findFirst({
        where: { providerId: reference, type: 'funding', escrowId: { not: null } },
      });
      if (escrowPayment) {
        // Idempotent: skip if already completed
        if (escrowPayment.status === 'COMPLETED') {
          this.logger.log(`Webhook idempotent: escrow payment ${reference} already completed`);
          return { received: true };
        }
        await this.verifyEscrowFunding(reference);
        return { received: true };
      }

      // Wallet top-up: WalletFunding with externalRef
      const funding = await this.prisma.walletFunding.findFirst({
        where: { externalRef: reference },
      });
      if (funding) {
        if (funding.status === 'SUCCEEDED') {
          this.logger.log(`Webhook idempotent: wallet funding ${reference} already succeeded`);
          return { received: true };
        }
        await this.verifyWalletTopup(reference);
      } else {
        this.logger.warn(`Webhook charge.success: no matching escrow payment or wallet funding for reference ${reference}`);
      }
    }

    return { received: true };
  }

  async initializeEscrowPayment(escrowId: string, userId: string, email: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: { buyer: { select: { email: true } } },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can fund this escrow');
    }

    if (escrow.status !== 'AWAITING_FUNDING') {
      throw new BadRequestException(
        `Escrow is in ${escrow.status} status, cannot fund`,
      );
    }

    if (escrow.fundingMethod !== 'direct') {
      throw new BadRequestException(
        'This escrow uses wallet funding. Use the Fund button instead.',
      );
    }

    const reference = `ESCROW_${escrowId}_${Date.now()}`;

    const paystackResponse = await this.paystackService.initializePayment({
      email: email || escrow.buyer?.email,
      amount: escrow.amountCents,
      currency: escrow.currency || 'GHS',
      reference,
      metadata: {
        type: 'escrow_fund',
        escrowId,
        userId,
      },
      callback_url: `${process.env.WEB_BASE_URL || process.env.WEB_APP_URL || 'http://localhost:3007'}/payments/escrow/callback?reference=${reference}`,
      channels: ['card', 'bank', 'mobile_money', 'ussd'],
    });

    await this.prisma.payment.create({
      data: {
        escrowId,
        userId,
        type: 'funding',
        amountCents: escrow.amountCents,
        currency: escrow.currency || 'GHS',
        status: 'PENDING',
        provider: 'paystack',
        providerId: reference,
        metadata: {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code,
        },
      },
    });

    return {
      authorizationUrl: paystackResponse.data.authorization_url,
      reference,
    };
  }

  /**
   * Verify escrow funding. Idempotent: uses atomic claim to prevent double-fund race.
   */
  async verifyEscrowFunding(reference: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerId: reference, type: 'funding' },
      include: { escrow: true },
    });

    if (!payment || !payment.escrow) {
      throw new NotFoundException('Escrow payment not found');
    }

    if (payment.status !== 'PENDING') {
      this.logger.log(`Escrow payment ${reference} already processed (status: ${payment.status}), idempotent skip`);
      return payment;
    }

    // Atomic claim: only process if still PENDING (prevents double-fund when webhook + callback race)
    const claimResult = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });

    if (claimResult.count === 0) {
      this.logger.warn(`Escrow payment ${reference} already claimed by another request`);
      return this.prisma.payment.findFirstOrThrow({
        where: { providerId: reference, type: 'funding' },
        include: { escrow: true },
      });
    }

    try {
      const paystackResponse = await this.paystackService.verifyPayment(reference);

      if (paystackResponse.data.status !== 'success') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: paystackResponse.message,
          },
        });
        throw new BadRequestException(
          paystackResponse.message || 'Payment verification failed',
        );
      }

      await this.escrowService.fundEscrowFromDirectPayment(
        payment.escrowId!,
        payment.userId,
        reference,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: {
            ...(payment.metadata as any),
            paystackData: paystackResponse.data,
          },
        } as any,
      });

      return this.prisma.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { escrow: true },
      });
    } catch (err) {
      // On failure, set FAILED so retry doesn't double-process
      await this.prisma.payment.updateMany({
        where: { id: payment.id, status: 'PROCESSING' },
        data: {
          status: 'FAILED',
          failureReason: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
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




