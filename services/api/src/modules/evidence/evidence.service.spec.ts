import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';

// Mock MinIO
jest.mock('minio');

describe('EvidenceService', () => {
  let service: EvidenceService;
  let prismaService: PrismaService;
  let minioClient: jest.Mocked<MinIO.Client>;

  const mockEscrow = {
    id: 'escrow-id-123',
    buyerId: 'buyer-id-123',
    sellerId: 'seller-id-123',
    status: 'SHIPPED',
  };

  const mockEvidence = {
    id: 'evidence-id-123',
    escrowId: 'escrow-id-123',
    uploadedBy: 'buyer-id-123',
    fileName: 'receipt.pdf',
    fileKey: 'escrow/escrow-id-123/receipt.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    type: 'document',
    description: 'Proof of payment',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    escrowAgreement: {
      findUnique: jest.fn(),
    },
    dispute: {
      findUnique: jest.fn(),
    },
    evidence: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        S3_ENDPOINT: 'localhost',
        S3_PORT: '9000',
        S3_ACCESS_KEY: 'minioadmin',
        S3_SECRET_KEY: 'minioadmin',
        S3_BUCKET: 'evidence',
      };
      return config[key];
    }),
  };

  const mockMinioClient = {
    presignedPutObject: jest.fn().mockResolvedValue('https://presigned-upload-url'),
    presignedGetObject: jest.fn().mockResolvedValue('https://presigned-download-url'),
    statObject: jest.fn().mockResolvedValue({ size: 1024 }),
    removeObject: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (MinIO.Client as jest.MockedClass<typeof MinIO.Client>).mockImplementation(() => mockMinioClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    prismaService = module.get<PrismaService>(PrismaService);
    minioClient = mockMinioClient as any;
  });

  describe('getUploadUrl', () => {
    it('should generate presigned upload URL for escrow evidence', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      const result = await service.getUploadUrl('buyer-id-123', {
        escrowId: 'escrow-id-123',
        fileName: 'receipt.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });

      expect(result).toHaveProperty('uploadUrl', 'https://presigned-upload-url');
      expect(result).toHaveProperty('fileKey');
      expect(minioClient.presignedPutObject).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not part of escrow', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.getUploadUrl('random-user-id', {
          escrowId: 'escrow-id-123',
          fileName: 'receipt.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if file too large', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.getUploadUrl('buyer-id-123', {
          escrowId: 'escrow-id-123',
          fileName: 'large-file.pdf',
          fileSize: 20 * 1024 * 1024, // 20MB
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.getUploadUrl('buyer-id-123', {
          escrowId: 'escrow-id-123',
          fileName: 'script.exe',
          fileSize: 1024,
          mimeType: 'application/x-msdownload',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAndCreateEvidence', () => {
    it('should verify upload and create evidence record', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.evidence.create.mockResolvedValue(mockEvidence);

      const result = await service.verifyAndCreateEvidence('buyer-id-123', {
        escrowId: 'escrow-id-123',
        fileKey: 'escrow/escrow-id-123/receipt.pdf',
        fileName: 'receipt.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        type: 'document',
        description: 'Proof of payment',
      });

      expect(result).toHaveProperty('id', 'evidence-id-123');
      expect(mockPrismaService.evidence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          escrowId: 'escrow-id-123',
          uploadedBy: 'buyer-id-123',
          fileName: 'receipt.pdf',
        }),
      });
      expect(minioClient.statObject).toHaveBeenCalled();
    });

    it('should throw BadRequestException if file not found in storage', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      minioClient.statObject.mockRejectedValue(new Error('Not found'));

      await expect(
        service.verifyAndCreateEvidence('buyer-id-123', {
          escrowId: 'escrow-id-123',
          fileKey: 'non-existent-file',
          fileName: 'receipt.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          type: 'document',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const evidenceWithEscrow = {
        ...mockEvidence,
        escrow: mockEscrow,
      };
      mockPrismaService.evidence.findUnique.mockResolvedValue(evidenceWithEscrow);

      const result = await service.getDownloadUrl('evidence-id-123', 'buyer-id-123');

      expect(result).toHaveProperty('downloadUrl', 'https://presigned-download-url');
      expect(minioClient.presignedGetObject).toHaveBeenCalled();
    });

    it('should throw NotFoundException if evidence not found', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(null);

      await expect(service.getDownloadUrl('non-existent-evidence', 'buyer-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user not authorized', async () => {
      const evidenceWithEscrow = {
        ...mockEvidence,
        escrow: mockEscrow,
      };
      mockPrismaService.evidence.findUnique.mockResolvedValue(evidenceWithEscrow);

      await expect(service.getDownloadUrl('evidence-id-123', 'random-user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence successfully', async () => {
      const evidenceWithEscrow = {
        ...mockEvidence,
        escrow: mockEscrow,
      };
      mockPrismaService.evidence.findUnique.mockResolvedValue(evidenceWithEscrow);
      mockPrismaService.evidence.delete.mockResolvedValue(mockEvidence);

      await service.deleteEvidence('evidence-id-123', 'buyer-id-123', ['BUYER']);

      expect(mockPrismaService.evidence.delete).toHaveBeenCalledWith({
        where: { id: 'evidence-id-123' },
      });
      expect(minioClient.removeObject).toHaveBeenCalled();
    });

    it('should allow admin to delete any evidence', async () => {
      const evidenceWithEscrow = {
        ...mockEvidence,
        escrow: mockEscrow,
      };
      mockPrismaService.evidence.findUnique.mockResolvedValue(evidenceWithEscrow);
      mockPrismaService.evidence.delete.mockResolvedValue(mockEvidence);

      await service.deleteEvidence('evidence-id-123', 'admin-id-123', ['ADMIN']);

      expect(mockPrismaService.evidence.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user not uploader', async () => {
      const evidenceWithEscrow = {
        ...mockEvidence,
        escrow: mockEscrow,
      };
      mockPrismaService.evidence.findUnique.mockResolvedValue(evidenceWithEscrow);

      await expect(
        service.deleteEvidence('evidence-id-123', 'seller-id-123', ['SELLER']),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listEvidenceForEscrow', () => {
    it('should list all evidence for escrow', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);
      mockPrismaService.evidence.findMany.mockResolvedValue([mockEvidence]);

      const result = await service.listEvidenceForEscrow('escrow-id-123', 'buyer-id-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'evidence-id-123');
    });

    it('should throw ForbiddenException if user not authorized', async () => {
      mockPrismaService.escrowAgreement.findUnique.mockResolvedValue(mockEscrow);

      await expect(
        service.listEvidenceForEscrow('escrow-id-123', 'random-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
