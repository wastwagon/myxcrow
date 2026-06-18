import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WithdrawalMethod } from '@prisma/client';
import { PayoutMethodService } from './payout-method.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../../common/crypto/encryption.service';

describe('PayoutMethodService', () => {
  let service: PayoutMethodService;

  const mockEncryptionService = {
    encrypt: jest.fn((value: string) => `enc:${value}`),
    decrypt: jest.fn((value: string) => (value.startsWith('enc:') ? value.slice(4) : value)),
    isEncrypted: jest.fn((value: string) => value.startsWith('enc:')),
  };

  const mockPrisma = {
    payoutMethod: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutMethodService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get(PayoutMethodService);
  });

  describe('createForUser', () => {
    it('creates first payout method as default', async () => {
      mockPrisma.payoutMethod.count.mockResolvedValue(0);
      mockPrisma.payoutMethod.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.payoutMethod.create.mockResolvedValue({
        id: 'pm-1',
        userId: 'user-1',
        methodType: WithdrawalMethod.BANK_ACCOUNT,
        label: 'GCB Bank account',
        details: {
          accountName: 'Jane Doe',
          bankName: 'GCB Bank',
          accountNumber: 'enc:1234567890',
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createForUser('user-1', {
        methodType: WithdrawalMethod.BANK_ACCOUNT,
        methodDetails: {
          accountName: 'Jane Doe',
          accountNumber: '1234567890',
          bankName: 'GCB Bank',
        },
      });

      expect(result.id).toBe('pm-1');
      expect(result.isDefault).toBe(true);
      expect(result.payoutSummary).toContain('GCB Bank');
      expect(mockPrisma.payoutMethod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            isDefault: true,
          }),
        }),
      );
    });
  });

  describe('getDecryptedForUser', () => {
    it('throws when payout method is missing', async () => {
      mockPrisma.payoutMethod.findFirst.mockResolvedValue(null);

      await expect(service.getDecryptedForUser('user-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns decrypted details for saved method', async () => {
      mockPrisma.payoutMethod.findFirst.mockResolvedValue({
        id: 'pm-1',
        userId: 'user-1',
        methodType: WithdrawalMethod.MOBILE_MONEY,
        label: 'MTN wallet',
        details: {
          mobileNumber: 'enc:0551234567',
          network: 'MTN',
        },
      });

      const result = await service.getDecryptedForUser('user-1', 'pm-1');

      expect(result.methodType).toBe(WithdrawalMethod.MOBILE_MONEY);
      expect(result.details).toMatchObject({
        mobileNumber: '0551234567',
        network: 'MTN',
      });
    });
  });

  describe('deleteForUser', () => {
    it('promotes another method to default when default is deleted', async () => {
      mockPrisma.payoutMethod.findFirst
        .mockResolvedValueOnce({
          id: 'pm-default',
          userId: 'user-1',
          isDefault: true,
        })
        .mockResolvedValueOnce({ id: 'pm-next', userId: 'user-1' });
      mockPrisma.payoutMethod.delete.mockResolvedValue({});
      mockPrisma.payoutMethod.update.mockResolvedValue({});

      await service.deleteForUser('user-1', 'pm-default');

      expect(mockPrisma.payoutMethod.update).toHaveBeenCalledWith({
        where: { id: 'pm-next' },
        data: { isDefault: true },
      });
    });
  });
});
