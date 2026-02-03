import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

describe('DisputesService', () => {
  let service: DisputesService;
  let prismaService: PrismaService;

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
      count: jest.fn(),
    },
  };

  const mockNotificationsService = {
    sendDisputeCreatedNotification: jest.fn().mockResolvedValue(undefined),
    sendDisputeResolvedNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('createDispute', () => {
    it('should create dispute successfully for buyer', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.dispute.create.mockResolvedValue(mockDispute);
      mockPrismaService.escrowAgreement.update.mockResolvedValue({
        ...mockEscrow,
        status: 'DISPUTED',
      });

      const result = await service.createDispute('buyer-id-123', {
        escrowId: 'escrow-id-123',
        reason: 'NOT_AS_DESCRIBED',
        description: 'Item does not match description',
      });

      expect(result).toHaveProperty('id', 'dispute-id-123');
      expect(mockPrismaService.dispute.create).toHaveBeenCalled();
      expect(mockPrismaService.escrowAgreement.update).toHaveBeenCalledWith({
        where: { id: 'escrow-id-123' },
        data: { status: 'DISPUTED' },
      });
      expect(mockNotificationsService.sendDisputeCreatedNotification).toHaveBeenCalled();
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

      const result = await service.createDispute('seller-id-123', {
        escrowId: 'escrow-id-123',
        reason: 'PARTIAL_DELIVERY',
        description: 'Buyer claims partial delivery',
      });

      expect(result.initiatorId).toBe('seller-id-123');
    });

    it('should throw NotFoundException if escrow not found', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(null);

      await expect(
        service.createDispute('buyer-id-123', {
          escrowId: 'non-existent-escrow',
          reason: 'NOT_AS_DESCRIBED',
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not part of escrow', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.createDispute('random-user-id', {
          escrowId: 'escrow-id-123',
          reason: 'NOT_AS_DESCRIBED',
          description: 'Test',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if escrow not in valid status', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue({
        ...mockEscrow,
        status: 'AWAITING_FUNDING',
      });

      await expect(
        service.createDispute('buyer-id-123', {
          escrowId: 'escrow-id-123',
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

      const result = await service.getDispute('dispute-id-123', 'buyer-id-123');

      expect(result).toHaveProperty('escrow');
      expect(result).toHaveProperty('initiator');
    });

    it('should throw NotFoundException if dispute not found', async () => {
      mockPrismaService.dispute.findUnique.mockResolvedValue(null);

      await expect(service.getDispute('non-existent-dispute', 'buyer-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user not authorized', async () => {
      const disputeWithRelations = {
        ...mockDispute,
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithRelations);

      await expect(service.getDispute('dispute-id-123', 'random-user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute successfully (admin)', async () => {
      const disputeWithRelations = {
        ...mockDispute,
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithRelations);
      mockPrismaService.dispute.update.mockResolvedValue({
        ...mockDispute,
        status: 'RESOLVED',
        resolution: 'Refund issued',
      });

      const result = await service.resolveDispute(
        'dispute-id-123',
        'admin-id-123',
        {
          resolution: 'Refund issued',
          outcome: 'BUYER_WINS',
        },
        ['ADMIN'],
      );

      expect(result.status).toBe('RESOLVED');
      expect(mockPrismaService.dispute.update).toHaveBeenCalledWith({
        where: { id: 'dispute-id-123' },
        data: {
          status: 'RESOLVED',
          resolution: 'Refund issued',
          outcome: 'BUYER_WINS',
          resolvedAt: expect.any(Date),
          resolvedBy: 'admin-id-123',
        },
      });
      expect(mockNotificationsService.sendDisputeResolvedNotification).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not admin', async () => {
      const disputeWithRelations = {
        ...mockDispute,
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithRelations);

      await expect(
        service.resolveDispute(
          'dispute-id-123',
          'buyer-id-123',
          {
            resolution: 'Test',
            outcome: 'BUYER_WINS',
          },
          ['BUYER'],
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if dispute already resolved', async () => {
      const disputeWithRelations = {
        ...mockDispute,
        status: 'RESOLVED',
        escrow: mockEscrow,
      };
      mockPrismaService.dispute.findUnique.mockResolvedValue(disputeWithRelations);

      await expect(
        service.resolveDispute(
          'dispute-id-123',
          'admin-id-123',
          {
            resolution: 'Test',
            outcome: 'BUYER_WINS',
          },
          ['ADMIN'],
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listDisputes', () => {
    it('should list disputes for user', async () => {
      const disputes = [mockDispute];
      mockPrismaService.dispute.findMany.mockResolvedValue(disputes);
      mockPrismaService.dispute.count.mockResolvedValue(1);

      const result = await service.listDisputes('buyer-id-123', {});

      expect(result.disputes).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.dispute.findMany.mockResolvedValue([mockDispute]);
      mockPrismaService.dispute.count.mockResolvedValue(1);

      await service.listDisputes('buyer-id-123', { status: 'OPEN' });

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
