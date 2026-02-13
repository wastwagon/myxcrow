import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WalletFundingSource,
  WalletFundingStatus,
  WithdrawalStatus,
  WithdrawalMethod,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private ledgerHelper: LedgerHelperService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string, currency: string = 'GHS') {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          currency,
          availableCents: 0,
          pendingCents: 0,
        },
      });

      await this.auditService.log({
        userId,
        action: 'wallet_created',
        resource: 'wallet',
        resourceId: wallet.id,
        details: { currency },
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet;
  }

  /**
   * Top up wallet (funding)
   */
  async topUpWallet(data: {
    userId: string;
    sourceType: WalletFundingSource;
    amountCents: number;
    feeCents?: number;
    externalRef?: string;
    metadata?: any;
    holdHours?: number; // Chargeback risk hold period
  }) {
    const wallet = await this.getOrCreateWallet(data.userId);

    const holdUntil = data.holdHours
      ? new Date(Date.now() + data.holdHours * 60 * 60 * 1000)
      : null;

    const funding = await this.prisma.walletFunding.create({
      data: {
        walletId: wallet.id,
        sourceType: data.sourceType,
        externalRef: data.externalRef,
        amountCents: data.amountCents,
        feeCents: data.feeCents || 0,
        currency: wallet.currency,
        status: holdUntil ? WalletFundingStatus.PENDING : WalletFundingStatus.SUCCEEDED,
        metadata: data.metadata,
        holdUntil,
      },
    });

    // Update wallet balances
    if (funding.status === WalletFundingStatus.SUCCEEDED) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableCents: { increment: data.amountCents - (data.feeCents || 0) },
        },
      });
    } else if (funding.status === WalletFundingStatus.PENDING) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingCents: { increment: data.amountCents - (data.feeCents || 0) },
        },
      });
    }

    // Create ledger entry
    await this.ledgerHelper.createWalletTopUpEntry(wallet.id, {
      amountCents: data.amountCents,
      feeCents: data.feeCents || 0,
      currency: wallet.currency,
      fundingId: funding.id,
    });

    await this.auditService.log({
      userId: data.userId,
      action: 'wallet_topup',
      resource: 'wallet_funding',
      resourceId: funding.id,
      details: { amountCents: data.amountCents, sourceType: data.sourceType, status: funding.status },
    });

    return funding;
  }

  /**
   * Credit wallet from an existing funding record (e.g. after Paystack verification).
   * Does NOT create a new funding - prevents duplicate entries when both webhook and callback run.
   */
  async creditWalletFromFunding(funding: { id: string; walletId: string; wallet: { userId: string; currency: string }; amountCents: number; feeCents: number; sourceType: any }) {
    await this.prisma.wallet.update({
      where: { id: funding.walletId },
      data: {
        availableCents: { increment: funding.amountCents - funding.feeCents },
      },
    });

    await this.ledgerHelper.createWalletTopUpEntry(funding.walletId, {
      amountCents: funding.amountCents,
      feeCents: funding.feeCents,
      currency: funding.wallet.currency,
      fundingId: funding.id,
    });

    await this.auditService.log({
      userId: funding.wallet.userId,
      action: 'wallet_topup',
      resource: 'wallet_funding',
      resourceId: funding.id,
      details: { amountCents: funding.amountCents, sourceType: funding.sourceType, status: 'SUCCEEDED' },
    });
  }

  /**
   * Transfer pending to available (after hold period)
   */
  async transferPendingToAvailable(walletFundingId: string, adminId: string) {
    const funding = await this.prisma.walletFunding.findUnique({
      where: { id: walletFundingId },
      include: { wallet: true },
    });

    if (!funding || funding.status !== WalletFundingStatus.PENDING) {
      throw new BadRequestException('Funding not found or not in PENDING status');
    }

    if (funding.holdUntil && new Date() < funding.holdUntil) {
      throw new BadRequestException('Hold period has not expired yet');
    }

    await this.prisma.walletFunding.update({
      where: { id: walletFundingId },
      data: { status: WalletFundingStatus.SUCCEEDED },
    });

    await this.prisma.wallet.update({
      where: { id: funding.wallet.id },
      data: {
        pendingCents: { decrement: funding.amountCents - funding.feeCents },
        availableCents: { increment: funding.amountCents - funding.feeCents },
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'transfer_wallet_pending_to_available',
      resource: 'wallet_funding',
      resourceId: funding.id,
      beforeState: { status: WalletFundingStatus.PENDING },
      afterState: { status: WalletFundingStatus.SUCCEEDED },
      details: { walletId: funding.wallet.id, amountCents: funding.amountCents },
    });

    return funding;
  }

  /**
   * Reserve funds for escrow
   */
  async reserveForEscrow(walletId: string, amountCents: number, escrowId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.availableCents < amountCents) {
      throw new BadRequestException('Insufficient available balance in wallet');
    }

    const updated = await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        availableCents: { decrement: amountCents },
        pendingCents: { increment: amountCents },
      },
    });

    await this.auditService.log({
      userId: wallet.userId,
      action: 'wallet_funds_reserved',
      resource: 'wallet',
      resourceId: wallet.id,
      details: { amountCents, escrowId, availableBefore: wallet.availableCents, pendingBefore: wallet.pendingCents },
      afterState: { availableCents: updated.availableCents, pendingCents: updated.pendingCents },
    });

    return updated;
  }

  /**
   * Release escrow funds to seller wallet
   */
  async releaseToSeller(sellerWalletId: string, amountCents: number, escrowId: string) {
    // sellerWalletId is the wallet ID, not user ID
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: sellerWalletId },
    });

    if (!wallet) {
      throw new NotFoundException('Seller wallet not found');
    }

    const updated = await this.prisma.wallet.update({
      where: { id: sellerWalletId },
      data: {
        availableCents: { increment: amountCents },
      },
    });

    await this.auditService.log({
      userId: wallet.userId,
      action: 'wallet_credited_from_escrow',
      resource: 'wallet',
      resourceId: wallet.id,
      details: {
        escrowId,
        amountCents,
        availableAfter: updated.availableCents,
      },
    });

    return updated;
  }

  /**
   * Refund escrow funds to buyer wallet
   */
  async refundToBuyer(buyerWalletId: string, amountCents: number, escrowId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: buyerWalletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const updated = await this.prisma.wallet.update({
      where: { id: buyerWalletId },
      data: {
        pendingCents: { decrement: amountCents },
        availableCents: { increment: amountCents },
      },
    });

    await this.auditService.log({
      userId: wallet.userId,
      action: 'wallet_refunded_from_escrow',
      resource: 'wallet',
      resourceId: wallet.id,
      details: {
        escrowId,
        amountCents,
        availableAfter: updated.availableCents,
        pendingAfter: updated.pendingCents,
      },
    });

    return updated;
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(data: {
    userId: string;
    methodType: WithdrawalMethod;
    methodDetails: any;
    amountCents: number;
    feeCents?: number;
  }) {
    const wallet = await this.getOrCreateWallet(data.userId);
    const feeCents = data.feeCents || 0;

    if (wallet.availableCents < data.amountCents + feeCents) {
      throw new BadRequestException('Insufficient available balance for withdrawal');
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        methodType: data.methodType,
        methodDetails: data.methodDetails,
        amountCents: data.amountCents,
        feeCents,
        status: WithdrawalStatus.REQUESTED,
        requestedBy: data.userId,
      },
    });

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableCents: { decrement: data.amountCents + feeCents },
      },
    });

    await this.ledgerHelper.createWithdrawalEntry(wallet.id, {
      amountCents: data.amountCents,
      feeCents,
      currency: wallet.currency,
      withdrawalId: withdrawal.id,
    });

    await this.auditService.log({
      userId: data.userId,
      action: 'withdrawal_request',
      resource: 'withdrawal',
      resourceId: withdrawal.id,
      details: { amountCents: data.amountCents, methodType: data.methodType, status: withdrawal.status },
      beforeState: { availableCents: wallet.availableCents },
      afterState: { availableCents: wallet.availableCents - (data.amountCents + feeCents) },
    });

    return withdrawal;
  }

  /**
   * Process withdrawal (approve/deny)
   */
  async processWithdrawal(
    withdrawalId: string,
    adminId: string,
    succeeded: boolean,
    reason?: string,
  ) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { wallet: { include: { user: true } } },
    });

    if (!withdrawal || withdrawal.status !== WithdrawalStatus.REQUESTED) {
      throw new BadRequestException('Withdrawal not found or not in REQUESTED status');
    }

    const newStatus = succeeded ? WithdrawalStatus.SUCCEEDED : WithdrawalStatus.FAILED;

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: newStatus,
        processedBy: adminId,
        processedAt: new Date(),
        failureReason: reason,
      },
    });

    if (succeeded) {
      // Funds have left the system - already deducted from available
      await this.ledgerHelper.createWithdrawalEntry(withdrawal.wallet.id, {
        amountCents: withdrawal.amountCents,
        feeCents: withdrawal.feeCents,
        currency: withdrawal.wallet.currency,
        withdrawalId: withdrawal.id,
      });
    } else {
      // Refund to available balance
      await this.prisma.wallet.update({
        where: { id: withdrawal.wallet.id },
        data: {
          availableCents: { increment: withdrawal.amountCents + withdrawal.feeCents },
        },
      });
    }

    await this.auditService.log({
      userId: adminId,
      action: succeeded ? 'withdrawal_processed' : 'withdrawal_failed',
      resource: 'withdrawal',
      resourceId: withdrawalId,
      details: {
        userId: withdrawal.wallet.userId,
        amountCents: withdrawal.amountCents,
        reason,
      },
    });

    const user = (withdrawal.wallet as any).user;
    const email = user?.email ?? '';
    const phone = user?.phone ?? null;
    const amount = `${withdrawal.amountCents / 100}`;
    const currency = withdrawal.wallet.currency ?? 'GHS';

    if (email) {
      try {
        if (succeeded) {
          await this.notificationsService.sendWithdrawalApprovedNotifications({
            email,
            phone,
            amount,
            currency,
          });
        } else {
          await this.notificationsService.sendWithdrawalDeniedNotifications({
            email,
            phone,
            amount,
            currency,
            reason: reason ?? 'No reason provided',
          });
        }
      } catch (err: any) {
        this.logger.warn(`Failed to send withdrawal ${succeeded ? 'approved' : 'denied'} notification: ${err.message}`);
      }
    }

    return updated;
  }

  /**
   * Get funding history
   */
  async getFundingHistory(userId: string, limit: number = 50) {
    const wallet = await this.getWallet(userId);
    return this.prisma.walletFunding.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(userId: string, limit: number = 50) {
    const wallet = await this.getWallet(userId);
    return this.prisma.withdrawal.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Credit wallet (Admin manual top-up)
   */
  async creditWallet(data: {
    userId: string;
    amountCents: number;
    currency?: string;
    description?: string;
    reference?: string;
    adminId: string;
  }) {
    // Validate amount
    if (data.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.getOrCreateWallet(data.userId, data.currency || 'GHS');

    // Create funding record
    const funding = await this.prisma.walletFunding.create({
      data: {
        walletId: wallet.id,
        sourceType: WalletFundingSource.ADJUSTMENT,
        externalRef: data.reference,
        amountCents: data.amountCents,
        feeCents: 0,
        currency: wallet.currency,
        status: WalletFundingStatus.SUCCEEDED,
        metadata: {
          description: data.description,
          adminId: data.adminId,
          type: 'manual_credit',
        } as any,
      },
    });

    // Update wallet balance
    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableCents: { increment: data.amountCents },
      },
    });

    // Create ledger entry
    await this.createWalletAdjustmentLedgerEntry(wallet.id, {
      amountCents: data.amountCents,
      currency: wallet.currency,
      fundingId: funding.id,
      type: 'credit',
      description: data.description || 'Manual wallet credit',
    });

    // Audit log
    await this.auditService.log({
      userId: data.adminId,
      action: 'wallet_credited_by_admin',
      resource: 'wallet_funding',
      resourceId: funding.id,
      details: {
        targetUserId: data.userId,
        amountCents: data.amountCents,
        currency: wallet.currency,
        description: data.description,
        reference: data.reference,
        walletId: wallet.id,
        availableBefore: wallet.availableCents,
        availableAfter: wallet.availableCents + data.amountCents,
      },
    });

    const amount = (data.amountCents / 100).toFixed(2);
    const newBalance = ((wallet.availableCents + data.amountCents) / 100).toFixed(2);
    await this.notificationsService.sendWalletCreditNotifications({
      email: user.email,
      phone: user.phone || null,
      amount,
      currency: wallet.currency,
      description: data.description || 'Manual wallet credit',
      reference: data.reference,
      newBalance,
    });

    return {
      funding,
      wallet: await this.getWallet(data.userId),
    };
  }

  /**
   * Debit wallet (Admin manual deduction)
   */
  async debitWallet(data: {
    userId: string;
    amountCents: number;
    currency?: string;
    description: string;
    reference?: string;
    adminId: string;
  }) {
    // Validate amount
    if (data.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      throw new BadRequestException('Description is required for debit operations');
    }

    // Get user to verify existence and get email
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, phone: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.getOrCreateWallet(data.userId, data.currency || 'GHS');

    // Check sufficient balance
    if (wallet.availableCents < data.amountCents) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${(wallet.availableCents / 100).toFixed(2)} ${wallet.currency}, Required: ${(data.amountCents / 100).toFixed(2)} ${wallet.currency}`,
      );
    }

    // Create funding record (negative amount for debit)
    const funding = await this.prisma.walletFunding.create({
      data: {
        walletId: wallet.id,
        sourceType: WalletFundingSource.ADJUSTMENT,
        externalRef: data.reference,
        amountCents: -data.amountCents, // Negative for debit
        feeCents: 0,
        currency: wallet.currency,
        status: WalletFundingStatus.SUCCEEDED,
        metadata: {
          description: data.description,
          adminId: data.adminId,
          type: 'manual_debit',
        } as any,
      },
    });

    // Update wallet balance
    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableCents: { decrement: data.amountCents },
      },
    });

    // Create ledger entry
    await this.createWalletAdjustmentLedgerEntry(wallet.id, {
      amountCents: -data.amountCents,
      currency: wallet.currency,
      fundingId: funding.id,
      type: 'debit',
      description: data.description,
    });

    // Audit log
    await this.auditService.log({
      userId: data.adminId,
      action: 'wallet_debited_by_admin',
      resource: 'wallet_funding',
      resourceId: funding.id,
      details: {
        targetUserId: data.userId,
        amountCents: data.amountCents,
        currency: wallet.currency,
        description: data.description,
        reference: data.reference,
        walletId: wallet.id,
        availableBefore: wallet.availableCents,
        availableAfter: updatedWallet.availableCents,
      },
    });

    const amount = (data.amountCents / 100).toFixed(2);
    const newBalance = (updatedWallet.availableCents / 100).toFixed(2);
    await this.notificationsService.sendWalletDebitNotifications({
      email: user.email,
      phone: user.phone || null,
      amount,
      currency: wallet.currency,
      description: data.description,
      reference: data.reference,
      newBalance,
    });

    return {
      funding,
      wallet: updatedWallet,
    };
  }

  /**
   * Create ledger entry for wallet adjustment (credit/debit)
   */
  private async createWalletAdjustmentLedgerEntry(
    walletId: string,
    data: {
      amountCents: number;
      currency: string;
      fundingId: string;
      type: 'credit' | 'debit';
      description: string;
    },
  ) {
    const journal = await this.prisma.ledgerJournal.create({
      data: {
        type: 'wallet_adjustment',
        description: `Wallet ${data.type}: ${data.description}`,
        entries: {
          create: [
            {
              account: 'user_wallet',
              currency: data.currency,
              amountCents: data.amountCents,
              metadata: {
                walletId,
                fundingId: data.fundingId,
                type: data.type,
              } as any,
            },
            {
              account: data.type === 'credit' ? 'admin_adjustments' : 'admin_adjustments',
              currency: data.currency,
              amountCents: -data.amountCents,
              metadata: {
                walletId,
                fundingId: data.fundingId,
                type: data.type,
              } as any,
            },
          ],
        },
      },
    });

    return journal;
  }

  /**
   * Get wallet by userId (for admin)
   */
  async getWalletByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.getOrCreateWallet(userId);
    return {
      wallet,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * List all wallets (for admin)
   */
  async listWallets(filters?: {
    userId?: string;
    email?: string;
    minBalance?: number;
    maxBalance?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.email) {
      where.user = {
        email: { contains: filters.email, mode: 'insensitive' },
      };
    }

    if (filters?.minBalance !== undefined) {
      where.availableCents = { gte: filters.minBalance };
    }

    if (filters?.maxBalance !== undefined) {
      where.availableCents = {
        ...where.availableCents,
        lte: filters.maxBalance,
      };
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return {
      wallets,
      total,
      limit,
      offset,
    };
  }

  /**
   * List all withdrawals (for admin)
   */
  async listWithdrawals(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: {
          wallet: {
            include: {
              user: {
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      withdrawals,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get wallet transactions (funding + withdrawals) for admin
   */
  async getWalletTransactions(userId: string, limit: number = 50) {
    const wallet = await this.getWallet(userId);

    const [fundings, withdrawals] = await Promise.all([
      this.prisma.walletFunding.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.withdrawal.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort by date
    const transactions = [
      ...fundings.map((f) => ({ ...f, type: 'funding' as const })),
      ...withdrawals.map((w) => ({ ...w, type: 'withdrawal' as const })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return transactions.slice(0, limit);
  }
}
