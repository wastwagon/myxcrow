import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LedgerHelperService } from '../payments/ledger-helper.service';
import { EmailService } from '../email/email.service';

describe('WalletService', () => {
  let service: WalletService;
  let auditService: AuditService;

  const mockWallet = {
    id: 'wallet-id-123',
    userId: 'user-id-123',
    currency: 'GHS',
    availableCents: 100000,
    pendingCents: 50000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    withdrawal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    walletFunding: {
      create: jest.fn(),
    },
    ledgerEntry: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    sendWithdrawalRequestedNotification: jest.fn().mockResolvedValue(undefined),
    sendWithdrawalApprovedNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockLedgerHelper = {
    createWalletTopUpEntry: jest.fn().mockResolvedValue(undefined),
    createWithdrawalEntry: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmailService = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.$transaction.mockImplementation((fn: (tx: typeof mockPrismaService) => Promise<unknown>) =>
      fn(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: LedgerHelperService, useValue: mockLedgerHelper },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet if found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet('user-id-123');

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-id-123' },
      });
      expect(mockPrismaService.wallet.create).not.toHaveBeenCalled();
    });

    it('should create new wallet if not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(mockWallet);

      const result = await service.getOrCreateWallet('user-id-123');

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          currency: 'GHS',
          availableCents: 0,
          pendingCents: 0,
        },
      });
    });
  });

  describe('getWallet', () => {
    it('should return wallet with balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWallet('user-id-123');

      expect(result).toEqual(mockWallet);
      expect(result.availableCents).toBe(100000);
      expect(result.pendingCents).toBe(50000);
    });

    it('should create wallet if not found (getOrCreateWallet)', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(mockWallet);

      const result = await service.getWallet('user-id-123');

      expect(result).toEqual(mockWallet);
    });
  });

  describe('reserveForEscrow', () => {
    it('should reserve funds for escrow successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const updatedWallet = {
        ...mockWallet,
        availableCents: 50000,
        pendingCents: 100000,
      };
      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.reserveForEscrow('wallet-id-123', 50000, 'escrow-id-1');

      expect(result.availableCents).toBe(50000);
      expect(result.pendingCents).toBe(100000);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: {
          availableCents: { decrement: 50000 },
          pendingCents: { increment: 50000 },
        },
      });
    });

    it('should throw BadRequestException for insufficient available balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.reserveForEscrow('wallet-id-123', 200000, 'escrow-id-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(
        service.reserveForEscrow('non-existent-wallet', 50000, 'escrow-id-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('refundToBuyer', () => {
    it('should refund escrow funds to buyer wallet', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const updatedWallet = { ...mockWallet, pendingCents: 0, availableCents: 150000 };
      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.refundToBuyer('wallet-id-123', 50000, 'escrow-id-1');

      expect(result.availableCents).toBe(150000);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: {
          pendingCents: { decrement: 50000 },
          availableCents: { increment: 50000 },
        },
      });
    });
  });

  describe('requestWithdrawal', () => {
    it('should create withdrawal request successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const mockWithdrawal = {
        id: 'withdrawal-id-123',
        walletId: 'wallet-id-123',
        amountCents: 50000,
        status: 'REQUESTED',
      };
      mockPrismaService.withdrawal.create.mockResolvedValue(mockWithdrawal);
      mockPrismaService.wallet.update.mockResolvedValue({ ...mockWallet, availableCents: 50000 });

      const result = await service.requestWithdrawal({
        userId: 'user-id-123',
        amountCents: 50000,
        methodType: 'BANK_ACCOUNT',
        methodDetails: {
          accountNumber: '1234567890',
          accountName: 'Test User',
          bankName: 'Test Bank',
        },
      });

      expect(result).toHaveProperty('id', 'withdrawal-id-123');
      expect(mockPrismaService.withdrawal.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.requestWithdrawal({
          userId: 'user-id-123',
          amountCents: 200000,
          methodType: 'BANK_ACCOUNT',
          methodDetails: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create withdrawal with feeCents', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.withdrawal.create.mockResolvedValue({
        id: 'withdrawal-id-456',
        walletId: 'wallet-id-123',
        amountCents: 50000,
        feeCents: 500,
        status: 'REQUESTED',
      });
      mockPrismaService.wallet.update.mockResolvedValue({});

      const result = await service.requestWithdrawal({
        userId: 'user-id-123',
        amountCents: 50000,
        feeCents: 500,
        methodType: 'BANK_ACCOUNT',
        methodDetails: {},
      });

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.withdrawal.create).toHaveBeenCalled();
    });
  });
});
