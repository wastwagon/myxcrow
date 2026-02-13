import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { RulesEngineService } from '../automation/rules-engine.service';

const mockSeller = { id: 'seller-uuid-123', email: 'seller@test.com', phone: null as string | null };
const mockBuyer = { id: 'buyer-uuid-456', email: 'buyer@test.com', phone: null as string | null };

describe('EscrowService', () => {
  let service: EscrowService;
  let prismaUserFindUnique: jest.Mock;
  let prismaEscrowCreate: jest.Mock;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    escrowAgreement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    escrowMilestone: { createMany: jest.fn() },
  };

  const mockSettings = {
    calculateFee: jest.fn().mockResolvedValue({ feeCents: 500, feePercentage: 5, netAmountCents: 9500 }),
    getFeeSettings: jest.fn().mockResolvedValue({ paidBy: 'buyer' }),
  };

  const mockWallet = {
    getOrCreateWallet: jest.fn().mockResolvedValue({ id: 'wallet-id' }),
    reserveForEscrow: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotifications = {
    sendEscrowCreatedNotifications: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedNotifications: jest.fn().mockResolvedValue(undefined),
  };
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockRulesEngine = { evaluateRules: jest.fn().mockResolvedValue(undefined) };
  const mockLedgerHelper = { createFundingLedgerEntry: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaUserFindUnique = mockPrisma.user.findUnique as jest.Mock;
    prismaEscrowCreate = mockPrisma.escrowAgreement.create as jest.Mock;

    prismaUserFindUnique.mockImplementation((args: { where: { email?: string; id?: string } }) => {
      if ('email' in args.where) {
        if (args.where.email === 'seller@test.com') return Promise.resolve({ id: mockSeller.id, email: mockSeller.email });
        return Promise.resolve(null);
      }
      if (args.where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
      if (args.where.id === mockSeller.id) return Promise.resolve(mockSeller);
      return Promise.resolve(null);
    });

    prismaEscrowCreate.mockImplementation((args: { data: any }) =>
      Promise.resolve({
        id: 'escrow-id',
        ...args.data,
        buyerId: mockBuyer.id,
        sellerId: args.data.sellerId,
      }),
    );
    (mockPrisma.escrowMilestone.createMany as jest.Mock).mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SettingsService, useValue: mockSettings },
        { provide: WalletService, useValue: mockWallet },
        { provide: LedgerHelperService, useValue: mockLedgerHelper },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AuditService, useValue: mockAudit },
        { provide: RulesEngineService, useValue: mockRulesEngine },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
  });

  describe('createEscrow seller resolution', () => {
    it('resolves seller by email when sellerId contains @', async () => {
      await service.createEscrow({
        buyerId: mockBuyer.id,
        sellerId: 'seller@test.com',
        amountCents: 10000,
        description: 'Test',
        useWallet: true,
      });

      expect(prismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'seller@test.com' },
        select: { id: true },
      });
      expect(prismaEscrowCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sellerId: mockSeller.id,
          }),
        }),
      );
    });

    it('throws when seller email not found', async () => {
      prismaUserFindUnique.mockImplementation((args: { where: { email?: string; id?: string } }) => {
        if ('email' in args.where && args.where.email === 'unknown@test.com') return Promise.resolve(null);
        if ('id' in args.where && args.where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
        return Promise.resolve(null);
      });

      await expect(
        service.createEscrow({
          buyerId: mockBuyer.id,
          sellerId: 'unknown@test.com',
          amountCents: 10000,
          description: 'Test',
          useWallet: false,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prismaUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'unknown@test.com' },
        select: { id: true },
      });
      expect(prismaEscrowCreate).not.toHaveBeenCalled();
    });

    it('uses sellerId as userId when not email (no @)', async () => {
      await service.createEscrow({
        buyerId: mockBuyer.id,
        sellerId: mockSeller.id,
        amountCents: 10000,
        description: 'Test',
        useWallet: true,
      });

      const emailCalls = prismaUserFindUnique.mock.calls.filter((c: any) => c[0]?.where?.email);
      expect(emailCalls.length).toBe(0);
      expect(prismaEscrowCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sellerId: mockSeller.id,
          }),
        }),
      );
    });
  });

  describe('fundEscrow', () => {
    const escrowId = 'escrow-123';
    const fundedEscrow = {
      id: escrowId,
      buyerId: mockBuyer.id,
      sellerId: mockSeller.id,
      status: 'AWAITING_FUNDING',
      amountCents: 10000,
      feeCents: 500,
      netAmountCents: 9500,
      currency: 'GHS',
      fundingMethod: 'direct' as const,
      buyerWalletId: null,
    };

    beforeEach(() => {
      (mockPrisma.escrowAgreement.findUnique as jest.Mock).mockResolvedValue(fundedEscrow);
      (mockPrisma.escrowAgreement.update as jest.Mock).mockImplementation((args: { where: any; data: any }) =>
        Promise.resolve({ id: args.where.id, ...fundedEscrow, ...args.data }),
      );
      (mockPrisma.user.findUnique as jest.Mock).mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === mockBuyer.id) return Promise.resolve(mockBuyer);
        if (args.where.id === mockSeller.id) return Promise.resolve(mockSeller);
        return Promise.resolve(null);
      });
    });

    it('updates status to FUNDED and creates ledger entry when buyer funds', async () => {
      await service.fundEscrow(escrowId, mockBuyer.id);

      expect(mockPrisma.escrowAgreement.update).toHaveBeenCalledWith({
        where: { id: escrowId },
        data: expect.objectContaining({ status: 'FUNDED' }),
      });
      expect(mockLedgerHelper.createFundingLedgerEntry).toHaveBeenCalledWith(
        escrowId,
        expect.objectContaining({
          amountCents: 10000,
          feeCents: 500,
          netAmountCents: 9500,
          currency: 'GHS',
        }),
      );
    });

    it('throws when non-buyer tries to fund', async () => {
      await expect(service.fundEscrow(escrowId, mockSeller.id)).rejects.toThrow('Only the buyer can fund');
      expect(mockPrisma.escrowAgreement.update).not.toHaveBeenCalled();
    });

    it('returns escrow idempotently when already FUNDED', async () => {
      (mockPrisma.escrowAgreement.findUnique as jest.Mock).mockResolvedValue({
        ...fundedEscrow,
        status: 'FUNDED',
      });

      const result = await service.fundEscrow(escrowId, mockBuyer.id);

      expect(result.status).toBe('FUNDED');
      expect(mockPrisma.escrowAgreement.update).not.toHaveBeenCalled();
    });

    it('throws when escrow is in DISPUTED status', async () => {
      (mockPrisma.escrowAgreement.findUnique as jest.Mock).mockResolvedValue({
        ...fundedEscrow,
        status: 'DISPUTED',
      });

      await expect(service.fundEscrow(escrowId, mockBuyer.id)).rejects.toThrow(
        /Escrow is in DISPUTED status, cannot fund/,
      );
      expect(mockPrisma.escrowAgreement.update).not.toHaveBeenCalled();
    });
  });
});
