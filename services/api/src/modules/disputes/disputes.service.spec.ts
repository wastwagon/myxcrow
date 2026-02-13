import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { EscrowService } from '../escrow/escrow.service';

describe('DisputesService', () => {
  let service: DisputesService;

  const mockEscrow = {
    id: 'escrow-id-123',
    buyerId: 'buyer-id-123',
    sellerId: 'seller-id-123',
    status: 'DELIVERED',
    amountCents: 100000,
  };

  const mockDispute = {
    id: 'dispute-id-123',
    escrowId: 'escrow-id-123',
    initiatorId: 'buyer-id-123',
    reason: 'NOT_AS_DESCRIBED',
    description: 'Item does not match description',
    status: 'OPEN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    escrowAgreement: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dispute: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    disputeMessage: {
      create: jest.fn(),
    },
  };

  const mockNotificationsService = {
    sendDisputeOpenedNotifications: jest.fn().mockResolvedValue(undefined),
    sendDisputeResolvedNotifications: jest.fn().mockResolvedValue(undefined),
    sendDisputeMessageNotifications: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockEscrowService = {
    releaseFundsFromDispute: jest.fn().mockResolvedValue(undefined),
    refundEscrowFromDispute: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.user.findUnique.mockImplementation((args: { where: { id: string } }) =>
      Promise.resolve({
        id: args.where.id,
        email: `${args.where.id.replace('-', '')}@test.com`,
        phone: '0551234567',
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EscrowService, useValue: mockEscrowService },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  describe('createDispute', () => {
    it('should create dispute successfully for buyer', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.dispute.create.mockResolvedValue(mockDispute);
      mockPrismaService.escrowAgreement.update.mockResolvedValue({
        ...mockEscrow,
        status: 'DISPUTED',
      });

      const result = await service.createDispute({
        escrowId: 'escrow-id-123',
        initiatorId: 'buyer-id-123',
        reason: 'NOT_AS_DESCRIBED',
        description: 'Item does not match description',
      });

      expect(result).toHaveProperty('id', 'dispute-id-123');
      expect(mockPrismaService.dispute.create).toHaveBeenCalled();
      expect(mockPrismaService.escrowAgreement.update).toHaveBeenCalledWith({
        where: { id: 'escrow-id-123' },
        data: { status: 'DISPUTED' },
      });
      expect(mockNotificationsService.sendDisputeOpenedNotifications).toHaveBeenCalled();
    });

    it('should create dispute successfully for seller', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.dispute.create.mockResolvedValue({
        ...mockDispute,
        initiatorId: 'seller-id-123',
      });
      mockPrismaService.escrowAgreement.update.mockResolvedValue({
        ...mockEscrow,
        status: 'DISPUTED',
      });

      const result = await service.createDispute({
        escrowId: 'escrow-id-123',
        initiatorId: 'seller-id-123',
        reason: 'PARTIAL_DELIVERY',
        description: 'Buyer claims partial delivery',
      });

      expect(result.initiatorId).toBe('seller-id-123');
    });

    it('should throw NotFoundException if escrow not found', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(null);

      await expect(
        service.createDispute({
          escrowId: 'non-existent-escrow',
          initiatorId: 'buyer-id-123',
          reason: 'NOT_AS_DESCRIBED',
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user not part of escrow', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.createDispute({
          escrowId: 'escrow-id-123',
          initiatorId: 'random-user-id',
          reason: 'NOT_AS_DESCRIBED',
          description: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDispute', () => {
    it('should return dispute with relations', async () => {
      const disputeWithRelations = {
        ...mockDispute,
        escrow: mockEscrow,
        initiator: { id: 'buyer-id-123', email: 'buyer@test.com' },
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithRelations);

      const result = await service.getDispute('dispute-id-123');

      expect(result).toHaveProperty('escrow');
      expect(result).toHaveProperty('initiator');
    });

    it('should return null if dispute not found', async () => {
      mockPrismaService.dispute.findUnique.mockResolvedValue(null);

      const result = await service.getDispute('non-existent-dispute');

      expect(result).toBeNull();
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute with REFUND_TO_BUYER', async () => {
      const disputeWithEscrow = {
        ...mockDispute,
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithEscrow);
      mockPrismaService.dispute.update.mockResolvedValue({
        ...mockDispute,
        status: 'RESOLVED',
        resolution: 'Refund issued',
        resolutionOutcome: 'REFUND_TO_BUYER',
      });

      const result = await service.resolveDispute(
        'dispute-id-123',
        'admin-id-123',
        'Refund issued',
        'REFUND_TO_BUYER',
      );

      expect(result.status).toBe('RESOLVED');
      expect(mockEscrowService.refundEscrowFromDispute).toHaveBeenCalledWith(
        'escrow-id-123',
        'admin-id-123',
        'Refund issued',
      );
      expect(mockNotificationsService.sendDisputeResolvedNotifications).toHaveBeenCalled();
    });

    it('should resolve dispute with RELEASE_TO_SELLER', async () => {
      const disputeWithEscrow = {
        ...mockDispute,
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithEscrow);
      mockPrismaService.dispute.update.mockResolvedValue({
        ...mockDispute,
        status: 'RESOLVED',
        resolution: 'Release to seller',
        resolutionOutcome: 'RELEASE_TO_SELLER',
      });

      await service.resolveDispute(
        'dispute-id-123',
        'admin-id-123',
        'Release to seller',
        'RELEASE_TO_SELLER',
      );

      expect(mockEscrowService.releaseFundsFromDispute).toHaveBeenCalledWith(
        'escrow-id-123',
        'admin-id-123',
      );
    });

    it('should throw NotFoundException if dispute not found', async () => {
      mockPrismaService.dispute.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveDispute(
          'non-existent',
          'admin-id-123',
          'Test',
          'REFUND_TO_BUYER',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listDisputes', () => {
    it('should list disputes for user', async () => {
      mockPrismaService.dispute.findMany.mockResolvedValue([mockDispute]);

      const result = await service.listDisputes({ userId: 'buyer-id-123' });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'dispute-id-123');
    });

    it('should filter by status', async () => {
      mockPrismaService.dispute.findMany.mockResolvedValue([mockDispute]);

      await service.listDisputes({ userId: 'buyer-id-123', status: 'OPEN' });

      expect(mockPrismaService.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'OPEN',
          }),
        }),
      );
    });
  });
});
