import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletFundingSource, WalletFundingStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class WalletTopupService {
  private readonly logger = new Logger(WalletTopupService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private auditService: AuditService,
  ) {}

  async initializeTopUp(data: {
    userId: string;
    email: string;
    amountCents: number;
    currency?: string;
    callbackUrl?: string;
    holdHours?: number;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletService.getOrCreateWallet(data.userId, data.currency || 'GHS');

    const reference = `WALLET_${wallet.id}_${Date.now()}`;

    const paystackResponse = await this.paystackService.initializePayment({
      email: data.email,
      amount: data.amountCents,
      currency: data.currency || 'GHS',
      reference,
      metadata: {
        walletId: wallet.id,
        userId: data.userId,
        type: 'wallet_topup',
        holdHours: data.holdHours,
      },
      callback_url: data.callbackUrl || `${process.env.WEB_BASE_URL || process.env.WEB_APP_URL || 'http://localhost:3003'}/wallet/topup/callback`,
      channels: ['card', 'bank', 'mobile_money', 'ussd'],
    });

    const funding = await this.prisma.walletFunding.create({
      data: {
        walletId: wallet.id,
        sourceType: WalletFundingSource.PAYSTACK_TOPUP,
        externalRef: paystackResponse.data.reference,
        amountCents: data.amountCents,
        currency: data.currency || 'GHS',
        status: WalletFundingStatus.PENDING,
        metadata: {
          access_code: paystackResponse.data.access_code,
          authorization_url: paystackResponse.data.authorization_url,
          holdHours: data.holdHours,
        },
      },
    });

    await this.auditService.log({
      userId: data.userId,
      action: 'initiate_wallet_topup',
      resource: 'wallet_funding',
      resourceId: funding.id,
      details: { amountCents: data.amountCents, currency: data.currency, reference },
    });

    return {
      fundingId: funding.id,
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
    };
  }

  async verifyTopUp(reference: string) {
    const paystackResponse = await this.paystackService.verifyPayment(reference);

    const funding = await this.prisma.walletFunding.findFirst({
      where: { externalRef: reference },
      include: { wallet: true },
    });

    if (!funding) {
      throw new NotFoundException('Wallet funding record not found');
    }

    if (funding.status !== WalletFundingStatus.PENDING) {
      this.logger.warn(`Wallet funding ${funding.id} already processed with status ${funding.status}`);
      return funding;
    }

    const isSuccess = paystackResponse.data.status === 'success';
    const holdHours = (funding.metadata as any)?.holdHours || 0;
    const holdUntil = holdHours > 0 && isSuccess ? new Date(Date.now() + holdHours * 60 * 60 * 1000) : null;

    const newStatus = isSuccess && holdUntil ? WalletFundingStatus.PENDING : (isSuccess ? WalletFundingStatus.SUCCEEDED : WalletFundingStatus.FAILED);

    const updatedFunding = await this.prisma.walletFunding.update({
      where: { id: funding.id },
      data: {
        status: newStatus,
        holdUntil: isSuccess ? holdUntil : null,
        metadata: {
          ...(funding.metadata as any || {}),
          paystackData: paystackResponse.data,
        } as any,
      },
    });

    if (isSuccess && !holdUntil) {
      await this.walletService.topUpWallet({
        userId: funding.wallet.userId,
        sourceType: funding.sourceType,
        amountCents: funding.amountCents,
        externalRef: funding.externalRef,
        feeCents: funding.feeCents,
        holdHours: 0,
      });
    } else if (!isSuccess) {
      await this.auditService.log({
        userId: funding.wallet.userId,
        action: 'wallet_topup_failed',
        resource: 'wallet_funding',
        resourceId: funding.id,
        details: { amountCents: funding.amountCents, reference, failureReason: paystackResponse.message },
      });
    }

    return updatedFunding;
  }
}

