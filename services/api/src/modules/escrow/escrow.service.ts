import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowStatus } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { RulesEngineService } from '../automation/rules-engine.service';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private ledgerHelper: LedgerHelperService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    @Inject(forwardRef(() => RulesEngineService))
    private rulesEngine?: RulesEngineService,
  ) {}

  /** Generate 6-char uppercase alphanumeric code (avoid 0,O,1,I for readability) */
  private generateDeliveryCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let result = '';
    for (let i = 0; i < 6; i++) result += chars[bytes[i]! % chars.length];
    return result;
  }

  async createEscrow(data: {
    buyerId: string;
    sellerId: string;
    sellerEmail?: string;
    amountCents: number;
    currency?: string;
    description?: string;
    expectedDeliveryDate?: Date;
    autoReleaseDays?: number;
    disputeWindowDays?: number;
    useWallet?: boolean;
    milestones?: Array<{ name: string; description?: string; amountCents: number }>;
    deliveryRegion?: string;
    deliveryCity?: string;
    deliveryAddressLine?: string;
    deliveryPhone?: string;
  }) {
    let sellerId = data.sellerId;

    if (data.sellerEmail ?? (typeof sellerId === 'string' && sellerId.includes('@'))) {
      const email = (data.sellerEmail ?? sellerId).trim().toLowerCase();
      const seller = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!seller) {
        throw new NotFoundException(`Seller not found with email: ${email}. They must register first.`);
      }
      sellerId = seller.id;
    }

    const currency = data.currency || 'GHS';
    const feeCalculation = await this.settingsService.calculateFee(data.amountCents);
    const feePaidBy = (await this.settingsService.getFeeSettings()).paidBy;

    let buyerWalletId: string | null = null;
    let sellerWalletId: string | null = null;

    if (data.useWallet) {
      const buyerWallet = await this.walletService.getOrCreateWallet(data.buyerId, currency);
      const sellerWallet = await this.walletService.getOrCreateWallet(sellerId, currency);
      buyerWalletId = buyerWallet.id;
      sellerWalletId = sellerWallet.id;
    }

    const escrow = await this.prisma.escrowAgreement.create({
      data: {
        buyerId: data.buyerId,
        sellerId,
        buyerWalletId,
        sellerWalletId,
        currency,
        amountCents: data.amountCents,
        feeCents: feeCalculation.feeCents,
        feePercentage: feeCalculation.feePercentage,
        feePaidBy,
        netAmountCents: feeCalculation.netAmountCents,
        description: data.description,
        status: EscrowStatus.AWAITING_FUNDING,
        fundingMethod: data.useWallet ? 'wallet' : 'direct',
        expectedDeliveryDate: data.expectedDeliveryDate,
        autoReleaseDays: data.autoReleaseDays || 7,
        disputeWindowDays: data.disputeWindowDays || 14,
        deliveryRegion: data.deliveryRegion,
        deliveryCity: data.deliveryCity,
        deliveryAddressLine: data.deliveryAddressLine,
        deliveryPhone: data.deliveryPhone,
      },
    });

    if (data.milestones && data.milestones.length > 0) {
      await this.prisma.escrowMilestone.createMany({
        data: data.milestones.map((m) => ({
          escrowId: escrow.id,
          name: m.name,
          description: m.description,
          amountCents: m.amountCents,
          status: 'pending',
        })),
      });
    }

    if (data.useWallet) {
      await this.walletService.reserveForEscrow(buyerWalletId!, data.amountCents, escrow.id);
    }

    await this.auditService.log({
      userId: data.buyerId,
      action: 'escrow_created',
      resource: 'escrow',
      resourceId: escrow.id,
      details: {
        amountCents: data.amountCents,
        currency,
        useWallet: data.useWallet,
        milestones: data.milestones?.length || 0,
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: data.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });

    await this.notificationsService.sendEscrowCreatedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
      amount: `${data.amountCents / 100}`,
      currency,
    });

    return escrow;
  }

  async fundEscrow(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can fund this escrow');
    }

    if (escrow.status !== EscrowStatus.AWAITING_FUNDING) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot fund`);
    }

    if (escrow.fundingMethod === 'wallet') {
      if (!escrow.buyerWalletId) {
        throw new BadRequestException('Buyer wallet not found');
      }
    } else if (escrow.fundingMethod === 'direct') {
      throw new BadRequestException(
        'This escrow uses direct payment. Please pay via Paystack using the "Pay with Paystack" button.',
      );
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    await this.ledgerHelper.createFundingLedgerEntry(escrowId, {
      amountCents: escrow.amountCents,
      feeCents: escrow.feeCents,
      netAmountCents: escrow.netAmountCents,
      currency: escrow.currency,
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowFundedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
      amount: `${escrow.amountCents / 100}`,
      currency: escrow.currency,
    });

    await this.auditService.log({
      userId,
      action: 'escrow_funded',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: EscrowStatus.AWAITING_FUNDING },
      afterState: { status: EscrowStatus.FUNDED },
    });

    // Trigger automation rules for status change
    if (this.rulesEngine) {
      await this.rulesEngine.evaluateRules(
        { type: 'escrow_status_changed', fromStatus: EscrowStatus.AWAITING_FUNDING, toStatus: EscrowStatus.FUNDED },
        {
          escrowId,
          userId,
          status: EscrowStatus.FUNDED,
          buyerId: escrow.buyerId,
          sellerId: escrow.sellerId,
        },
      ).catch((err) => this.logger.error(`Failed to evaluate rules: ${err.message}`));
    }

    return this.getEscrow(escrowId);
  }

  /**
   * Fund escrow from direct Paystack payment (called after payment verification).
   * Credits buyer wallet, sets up wallet IDs, reserves, and marks as funded.
   */
  async fundEscrowFromDirectPayment(escrowId: string, userId: string, _reference: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can fund this escrow');
    }

    if (escrow.status !== EscrowStatus.AWAITING_FUNDING) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot fund`);
    }

    if (escrow.fundingMethod !== 'direct') {
      throw new BadRequestException('This escrow does not use direct payment');
    }

    const currency = escrow.currency || 'GHS';
    const buyerWallet = await this.walletService.getOrCreateWallet(escrow.buyerId, currency);
    const sellerWallet = await this.walletService.getOrCreateWallet(escrow.sellerId, currency);

    await this.walletService.topUpWallet({
      userId: escrow.buyerId,
      sourceType: 'PAYSTACK_TOPUP' as any,
      amountCents: escrow.amountCents,
      externalRef: _reference,
      metadata: { escrowId, type: 'escrow_direct_fund' },
    });

    const updatedEscrow = await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        buyerWalletId: buyerWallet.id,
        sellerWalletId: sellerWallet.id,
        fundingMethod: 'wallet',
      },
    });

    await this.walletService.reserveForEscrow(buyerWallet.id, escrow.amountCents, escrowId);

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    await this.ledgerHelper.createFundingLedgerEntry(escrowId, {
      amountCents: escrow.amountCents,
      feeCents: escrow.feeCents,
      netAmountCents: escrow.netAmountCents,
      currency: escrow.currency || 'GHS',
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowFundedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
      amount: `${escrow.amountCents / 100}`,
      currency: escrow.currency || 'GHS',
    });

    await this.auditService.log({
      userId,
      action: 'escrow_funded_direct',
      resource: 'escrow',
      resourceId: escrowId,
      details: { reference: _reference },
    });

    return this.getEscrow(escrowId);
  }

  async shipEscrow(escrowId: string, userId: string, trackingNumber?: string, carrier?: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.sellerId !== userId) {
      throw new BadRequestException('Only the seller can mark escrow as shipped');
    }

    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.AWAITING_SHIPMENT) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot ship`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });

    const deliveryCode = this.generateDeliveryCode();
    let shortReference = this.generateDeliveryCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.prisma.shipment.findUnique({ where: { shortReference } });
      if (!existing) break;
      shortReference = this.generateDeliveryCode();
    }

    const deliveryAddressJson =
      escrow.deliveryRegion || escrow.deliveryCity || escrow.deliveryAddressLine
        ? {
            region: escrow.deliveryRegion,
            city: escrow.deliveryCity,
            addressLine: escrow.deliveryAddressLine,
            phone: escrow.deliveryPhone,
          }
        : undefined;

    const existingShipment = await this.prisma.shipment.findFirst({
      where: { escrowId },
    });

    if (existingShipment) {
      await this.prisma.shipment.update({
        where: { id: existingShipment.id },
        data: {
          carrier: carrier ?? existingShipment.carrier,
          trackingNumber: trackingNumber ?? existingShipment.trackingNumber,
          status: 'shipped',
          shippedAt: new Date(),
          deliveryCode,
          shortReference,
          deliveryAddress: deliveryAddressJson ?? existingShipment.deliveryAddress,
        },
      });
    } else {
      await this.prisma.shipment.create({
        data: {
          escrowId,
          carrier,
          trackingNumber,
          status: 'shipped',
          shippedAt: new Date(),
          deliveryCode,
          shortReference,
          deliveryAddress: deliveryAddressJson,
        },
      });
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowShippedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
    });

    await this.notificationsService.sendDeliveryCodeToBuyer({
      buyerEmail: buyer!.email,
      buyerPhone: buyer!.phone,
      escrowId: escrow.id,
      deliveryCode,
      shortReference,
      confirmDeliveryUrl: (process.env.CONFIRM_DELIVERY_BASE_URL || process.env.WEB_APP_URL || 'https://myxcrow.com').replace(/\/$/, '') + '/confirm-delivery',
    });

    await this.auditService.log({
      userId,
      action: 'escrow_shipped',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.SHIPPED },
    });

    return this.getEscrow(escrowId);
  }

  /**
   * Service-only flow: seller marks work as completed (no shipping).
   * This moves escrow into AWAITING_RELEASE and sets deliveredAt (used for auto-release timers).
   */
  async markServiceCompleted(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.sellerId !== userId) {
      throw new BadRequestException('Only the seller can mark service as completed');
    }

    if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.AWAITING_SHIPMENT) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot mark service completed`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.AWAITING_RELEASE,
        deliveredAt: new Date(), // Start auto-release window for service completion
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    // Reuse delivered notifications for now (wording still conveys completion to buyer)
    await this.notificationsService.sendEscrowDeliveredNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
    });

    await this.auditService.log({
      userId,
      action: 'escrow_service_completed',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.AWAITING_RELEASE },
    });

    return this.getEscrow(escrowId);
  }

  /**
   * Confirm delivery by verification code (public: delivery person enters ref + code; or buyer in app).
   * Only the system and the recipient (buyer) know the code; delivery person gets it from recipient.
   */
  async confirmDeliveryByCode(shortReference: string, deliveryCode: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { shortReference: shortReference.toUpperCase().trim(), deliveryCode: deliveryCode.toUpperCase().trim() },
      include: { escrow: true },
    });
    if (!shipment) {
      throw new BadRequestException('Invalid reference or code. Please check and try again.');
    }
    const escrowId = shipment.escrowId;
    const escrow = shipment.escrow;
    if (escrow.status !== EscrowStatus.SHIPPED && escrow.status !== EscrowStatus.IN_TRANSIT) {
      throw new BadRequestException(`This delivery was already confirmed or escrow is in ${escrow.status} status.`);
    }
    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.DELIVERED, deliveredAt: new Date() },
    });
    await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: { deliveredAt: new Date(), status: 'delivered' },
    });
    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });
    await this.notificationsService.sendEscrowDeliveredNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId,
    });
    await this.auditService.log({
      userId: null,
      action: 'delivery_confirmed_by_code',
      resource: 'escrow',
      resourceId: escrowId,
      details: { shortReference, shipmentId: shipment.id },
    });
    if (this.rulesEngine) {
      await this.rulesEngine
        .evaluateRules(
          { type: 'escrow_status_changed', fromStatus: escrow.status, toStatus: EscrowStatus.DELIVERED },
          { escrowId, userId: 'delivery_code', status: EscrowStatus.DELIVERED, buyerId: escrow.buyerId, sellerId: escrow.sellerId },
        )
        .catch((err) => this.logger.error(`Failed to evaluate rules: ${err.message}`));
    }
    const autoReleaseDays = escrow.autoReleaseDays ?? 7;
    if (autoReleaseDays === 0) {
      const activeDisputes = await this.prisma.dispute.count({
        where: { escrowId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
      });
      if (activeDisputes === 0) {
        try {
          await this.releaseFunds(escrowId, 'system');
          this.logger.log(`Auto-settled escrow ${escrowId} on delivery (autoReleaseDays=0)`);
        } catch (err: any) {
          this.logger.warn(`Auto-settle on deliver failed for ${escrowId}: ${err.message}`);
        }
      }
    }
    return { success: true, escrowId, message: 'Delivery confirmed successfully.' };
  }

  /**
   * Buyer confirms delivery in app by entering the delivery code (same code they received).
   */
  async confirmDeliveryByCodeForBuyer(escrowId: string, userId: string, deliveryCode: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: { shipments: true },
    });
    if (!escrow) throw new NotFoundException('Escrow not found');
    if (escrow.buyerId !== userId) throw new BadRequestException('Only the buyer can confirm delivery with the code.');
    const shipment = escrow.shipments.find(
      (s) => s.deliveryCode && s.deliveryCode.toUpperCase() === deliveryCode.toUpperCase().trim(),
    );
    if (!shipment) throw new BadRequestException('Invalid delivery code.');
    return this.confirmDeliveryByCode(shipment.shortReference!, shipment.deliveryCode!);
  }

  async deliverEscrow(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can mark escrow as delivered');
    }

    if (escrow.status !== EscrowStatus.SHIPPED && escrow.status !== EscrowStatus.IN_TRANSIT) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot deliver`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowDeliveredNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
    });

    await this.auditService.log({
      userId,
      action: 'escrow_delivered',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.DELIVERED },
    });

    // Trigger automation rules for status change
    if (this.rulesEngine) {
      await this.rulesEngine.evaluateRules(
        { type: 'escrow_status_changed', fromStatus: escrow.status, toStatus: EscrowStatus.DELIVERED },
        {
          escrowId,
          userId,
          status: EscrowStatus.DELIVERED,
          buyerId: escrow.buyerId,
          sellerId: escrow.sellerId,
        },
      ).catch((err) => this.logger.error(`Failed to evaluate rules: ${err.message}`));
    }

    // Auto-settlement: immediate release when autoReleaseDays is 0 and no active dispute
    const autoReleaseDays = escrow.autoReleaseDays ?? 7;
    if (autoReleaseDays === 0) {
      const activeDisputes = await this.prisma.dispute.count({
        where: {
          escrowId,
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      });
      if (activeDisputes === 0) {
        try {
          await this.releaseFunds(escrowId, 'system');
          this.logger.log(`Auto-settled escrow ${escrowId} on delivery (autoReleaseDays=0)`);
        } catch (err: any) {
          this.logger.warn(`Auto-settle on deliver failed for ${escrowId}: ${err.message}`);
        }
      }
    }

    return this.getEscrow(escrowId);
  }

  async releaseFunds(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Safety: only buyer (or system jobs) can release funds.
    if (userId !== 'system' && escrow.buyerId !== userId) {
      throw new BadRequestException('Only the buyer can release funds');
    }

    const validStatuses: EscrowStatus[] = [EscrowStatus.DELIVERED, EscrowStatus.AWAITING_RELEASE];
    if (!validStatuses.includes(escrow.status as EscrowStatus)) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot release funds`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    await this.ledgerHelper.createReleaseLedgerEntry(escrowId, {
      netAmountCents: escrow.netAmountCents,
      currency: escrow.currency,
    });

    if (escrow.sellerWalletId) {
      await this.walletService.releaseToSeller(escrow.sellerWalletId, escrow.netAmountCents, escrowId);
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowReleasedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
      amount: `${escrow.netAmountCents / 100}`,
      currency: escrow.currency,
    });

    await this.auditService.log({
      userId,
      action: 'escrow_released',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.RELEASED },
    });

    return this.getEscrow(escrowId);
  }

  /**
   * Release funds after dispute resolution (admin). Allows DISPUTED escrows.
   */
  async releaseFundsFromDispute(escrowId: string, adminId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    const validStatuses: EscrowStatus[] = [
      EscrowStatus.DELIVERED,
      EscrowStatus.AWAITING_RELEASE,
      EscrowStatus.DISPUTED,
    ];
    if (!validStatuses.includes(escrow.status as EscrowStatus)) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot release from dispute`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    await this.ledgerHelper.createReleaseLedgerEntry(escrowId, {
      netAmountCents: escrow.netAmountCents,
      currency: escrow.currency,
    });

    if (escrow.sellerWalletId) {
      await this.walletService.releaseToSeller(escrow.sellerWalletId, escrow.netAmountCents, escrowId);
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: escrow.buyerId } });
    const seller = await this.prisma.user.findUnique({ where: { id: escrow.sellerId } });

    await this.notificationsService.sendEscrowReleasedNotifications({
      emails: [buyer!.email, seller!.email],
      phones: [buyer!.phone, seller!.phone].filter((p): p is string => !!p),
      escrowId: escrow.id,
      amount: `${escrow.netAmountCents / 100}`,
      currency: escrow.currency,
    });

    await this.auditService.log({
      userId: adminId,
      action: 'escrow_released_from_dispute',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.RELEASED },
    });

    return this.getEscrow(escrowId);
  }

  /**
   * Refund escrow after dispute resolution (admin). Allows DISPUTED escrows.
   */
  async refundEscrowFromDispute(escrowId: string, adminId: string, reason?: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    const refundableStatuses: EscrowStatus[] = [
      EscrowStatus.AWAITING_FUNDING,
      EscrowStatus.FUNDED,
      EscrowStatus.AWAITING_SHIPMENT,
      EscrowStatus.SHIPPED,
      EscrowStatus.IN_TRANSIT,
      EscrowStatus.DELIVERED,
      EscrowStatus.DISPUTED,
    ];
    if (!refundableStatuses.includes(escrow.status as EscrowStatus)) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot refund from dispute`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    await this.ledgerHelper.createRefundLedgerEntry(escrowId, {
      amountCents: escrow.amountCents,
      feeCents: escrow.feeCents,
      currency: escrow.currency,
    });

    if (escrow.buyerWalletId) {
      await this.walletService.refundToBuyer(escrow.buyerWalletId, escrow.amountCents, escrowId);
    }

    await this.auditService.log({
      userId: adminId,
      action: 'escrow_refunded_from_dispute',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.REFUNDED },
      details: { reason },
    });

    return this.getEscrow(escrowId);
  }

  async refundEscrow(escrowId: string, userId: string, reason?: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    const refundableStatuses: EscrowStatus[] = [
      EscrowStatus.AWAITING_FUNDING,
      EscrowStatus.FUNDED,
      EscrowStatus.AWAITING_SHIPMENT,
      EscrowStatus.SHIPPED,
      EscrowStatus.IN_TRANSIT,
      EscrowStatus.DELIVERED,
    ];

    if (!refundableStatuses.includes(escrow.status as EscrowStatus)) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot refund`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    await this.ledgerHelper.createRefundLedgerEntry(escrowId, {
      amountCents: escrow.amountCents,
      feeCents: escrow.feeCents,
      currency: escrow.currency,
    });

    if (escrow.buyerWalletId) {
      await this.walletService.refundToBuyer(escrow.buyerWalletId, escrow.amountCents, escrowId);
    }

    await this.auditService.log({
      userId,
      action: 'escrow_refunded',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.REFUNDED },
      details: { reason },
    });

    return this.getEscrow(escrowId);
  }

  async cancelEscrow(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.AWAITING_FUNDING && escrow.status !== EscrowStatus.DRAFT) {
      throw new BadRequestException(`Escrow is in ${escrow.status} status, cannot cancel`);
    }

    await this.prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    if (escrow.buyerWalletId && escrow.status === EscrowStatus.AWAITING_FUNDING) {
      await this.walletService.refundToBuyer(escrow.buyerWalletId, escrow.amountCents, escrowId);
    }

    await this.auditService.log({
      userId,
      action: 'escrow_cancelled',
      resource: 'escrow',
      resourceId: escrowId,
      beforeState: { status: escrow.status },
      afterState: { status: EscrowStatus.CANCELLED },
    });

    return this.getEscrow(escrowId);
  }

  async getEscrow(id: string, currentUserId?: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id },
      include: {
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
        evidence: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            type: true,
            description: true,
            metadata: true,
            createdAt: true,
            uploadedBy: true,
          },
        },
        milestones: true,
        shipments: {
          include: {
            events: true,
          },
        },
        disputes: {
          where: {
            status: {
              not: 'CLOSED',
            },
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    // Only buyer and system see delivery code/shortReference (recipient gives code to delivery person)
    if (currentUserId && currentUserId !== escrow.buyerId) {
      escrow.shipments = escrow.shipments.map((s) => ({
        ...s,
        deliveryCode: null,
        shortReference: null,
      })) as typeof escrow.shipments;
    }

    return escrow;
  }

  async listEscrows(filters?: {
    userId?: string;
    role?: 'buyer' | 'seller';
    status?: EscrowStatus;
    search?: string;
    counterpartyEmail?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      if (filters.role === 'buyer') {
        where.buyerId = filters.userId;
      } else if (filters.role === 'seller') {
        where.sellerId = filters.userId;
      } else {
        where.OR = [{ buyerId: filters.userId }, { sellerId: filters.userId }];
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.minAmount || filters?.maxAmount) {
      where.amountCents = {};
      if (filters.minAmount) {
        where.amountCents.gte = filters.minAmount * 100; // Convert to cents
      }
      if (filters.maxAmount) {
        where.amountCents.lte = filters.maxAmount * 100; // Convert to cents
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters?.counterpartyEmail) {
      where.OR = [
        ...(where.OR || []),
        {
          buyer: {
            email: {
              contains: filters.counterpartyEmail,
              mode: 'insensitive',
            },
          },
        },
        {
          seller: {
            email: {
              contains: filters.counterpartyEmail,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      where.OR = [
        ...(where.OR || []),
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.escrowAgreement.findMany({
        where,
        include: {
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
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.escrowAgreement.count({ where }),
    ]);

    return {
      data,
      escrows: data, // Alias for compatibility
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  async getEscrowStats(userId: string) {
    const whereBase = { OR: [{ buyerId: userId }, { sellerId: userId }] };

    const completedStatuses: EscrowStatus[] = [
      EscrowStatus.RELEASED,
      EscrowStatus.REFUNDED,
      EscrowStatus.CANCELLED,
    ];

    const pendingStatuses: EscrowStatus[] = [EscrowStatus.AWAITING_FUNDING];

    const [active, pending, completed] = await Promise.all([
      this.prisma.escrowAgreement.count({
        where: {
          ...whereBase,
          status: { notIn: completedStatuses },
        },
      }),
      this.prisma.escrowAgreement.count({
        where: {
          ...whereBase,
          status: { in: pendingStatuses },
        },
      }),
      this.prisma.escrowAgreement.count({
        where: {
          ...whereBase,
          status: { in: completedStatuses },
        },
      }),
    ]);

    return { active, pending, completed };
  }
}
