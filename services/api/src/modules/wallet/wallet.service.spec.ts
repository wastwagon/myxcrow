import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockWallet = {
    id: 'wallet-id-123',
    userId: 'user-id-123',
    currency: 'GHS',
    availableCents: 100000, // 1000 GHS
    pendingCents: 50000, // 500 GHS
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
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

  describe('getWalletBalance', () => {
    it('should return wallet balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWalletBalance('user-id-123');

      expect(result).toEqual({
        availableCents: 100000,
        pendingCents: 50000,
        totalCents: 150000,
        currency: 'GHS',
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getWalletBalance('non-existent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('credit', () => {
    it('should credit wallet successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const updatedWallet = { ...mockWallet, availableCents: 150000 };
      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.credit('wallet-id-123', 50000, 'PAYSTACK_TOPUP', 'Test credit');

      expect(result.availableCents).toBe(150000);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: { availableCents: 150000 },
      });
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative amount', async () => {
      await expect(service.credit('wallet-id-123', -100, 'PAYSTACK_TOPUP', 'Test')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.credit('non-existent-wallet', 1000, 'PAYSTACK_TOPUP', 'Test')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('debit', () => {
    it('should debit wallet successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const updatedWallet = { ...mockWallet, availableCents: 50000 };
      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.debit('wallet-id-123', 50000, 'Test debit');

      expect(result.availableCents).toBe(50000);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: { availableCents: 50000 },
      });
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.debit('wallet-id-123', 200000, 'Test debit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative amount', async () => {
      await expect(service.debit('wallet-id-123', -100, 'Test')).rejects.toThrow(BadRequestException);
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

      const result = await service.reserveForEscrow('wallet-id-123', 50000);

      expect(result.availableCents).toBe(50000);
      expect(result.pendingCents).toBe(100000);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: {
          availableCents: 50000,
          pendingCents: 100000,
        },
      });
    });

    it('should throw BadRequestException for insufficient available balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.reserveForEscrow('wallet-id-123', 200000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('releaseReservedFunds', () => {
    it('should release reserved funds successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      const updatedWallet = {
        ...mockWallet,
        pendingCents: 0,
      };
      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.releaseReservedFunds('wallet-id-123', 50000);

      expect(result.pendingCents).toBe(0);
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-id-123' },
        data: { pendingCents: 0 },
      });
    });

    it('should throw BadRequestException for insufficient pending balance', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.releaseReservedFunds('wallet-id-123', 100000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestWithdrawal', () => {
    it('should create withdrawal request successfully', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const mockWithdrawal = {
        id: 'withdrawal-id-123',
        walletId: 'wallet-id-123',
        amountCents: 50000,
        status: 'REQUESTED',
      };
      mockPrismaService.withdrawal.create.mockResolvedValue(mockWithdrawal);

      const result = await service.requestWithdrawal('user-id-123', {
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
        service.requestWithdrawal('user-id-123', {
          amountCents: 200000,
          methodType: 'BANK_ACCOUNT',
          methodDetails: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for amount below minimum', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.requestWithdrawal('user-id-123', {
          amountCents: 500, // 5 GHS, below minimum
          methodType: 'BANK_ACCOUNT',
          methodDetails: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
