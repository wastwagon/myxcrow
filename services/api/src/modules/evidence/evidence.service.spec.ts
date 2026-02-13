import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AntivirusService } from '../../common/security/antivirus.service';
import * as MinIO from 'minio';

jest.mock('minio');

describe('EvidenceService', () => {
  let service: EvidenceService;
  let mockMinioClient: {
    presignedPutObject: jest.Mock;
    presignedGetObject: jest.Mock;
    statObject: jest.Mock;
    removeObject: jest.Mock;
  };

  const mockEvidence = {
    id: 'evidence-id-123',
    escrowId: 'escrow-id-123',
    uploadedBy: 'buyer-id-123',
    fileName: 'receipt.pdf',
    fileKey: 'escrow/escrow-id-123/123_receipt.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    type: 'document',
    description: 'Proof of payment',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    evidence: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY: 'minioadmin',
        S3_SECRET_KEY: 'minioadmin',
        S3_BUCKET: 'evidence',
      };
      return config[key];
    }),
  };

  const mockAntivirusService = {
    scanFile: jest.fn().mockResolvedValue({ safe: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMinioClient = {
      presignedPutObject: jest.fn().mockResolvedValue('https://presigned-upload-url'),
      presignedGetObject: jest.fn().mockResolvedValue('https://presigned-download-url'),
      statObject: jest.fn().mockResolvedValue({ size: 1024 }),
      removeObject: jest.fn().mockResolvedValue(undefined),
    };
    (MinIO.Client as jest.MockedClass<typeof MinIO.Client>).mockImplementation(
      () => mockMinioClient as unknown as MinIO.Client,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AntivirusService, useValue: mockAntivirusService },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned upload URL', async () => {
      const result = await service.generatePresignedUploadUrl(
        'escrow-id-123',
        'receipt.pdf',
        1024,
        'application/pdf',
      );

      expect(result).toHaveProperty('uploadUrl', 'https://presigned-upload-url');
      expect(result).toHaveProperty('objectName');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(mockMinioClient.presignedPutObject).toHaveBeenCalled();
    });
  });

  describe('verifyAndCreateEvidence', () => {
    it('should create evidence record without file scan', async () => {
      mockPrismaService.evidence.create.mockResolvedValue(mockEvidence);

      const result = await service.verifyAndCreateEvidence({
        escrowId: 'escrow-id-123',
        uploadedBy: 'buyer-id-123',
        objectName: 'escrow/escrow-id-123/receipt.pdf',
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
    });

    it('should throw BadRequestException when file scan fails', async () => {
      mockAntivirusService.scanFile.mockResolvedValue({ safe: false, reason: 'Virus detected' });

      await expect(
        service.verifyAndCreateEvidence({
          escrowId: 'escrow-id-123',
          uploadedBy: 'buyer-id-123',
          objectName: 'file.pdf',
          fileName: 'file.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          type: 'document',
          fileBuffer: Buffer.from('test'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(mockEvidence);

      const result = await service.generatePresignedDownloadUrl('evidence-id-123');

      expect(result).toHaveProperty('downloadUrl', 'https://presigned-download-url');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalled();
    });

    it('should throw NotFoundException if evidence not found', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(null);

      await expect(service.generatePresignedDownloadUrl('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEvidence', () => {
    it('should return evidence by id', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(mockEvidence);

      const result = await service.getEvidence('evidence-id-123');

      expect(result).toEqual(mockEvidence);
      expect(mockPrismaService.evidence.findUnique).toHaveBeenCalledWith({
        where: { id: 'evidence-id-123' },
      });
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence successfully', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(mockEvidence);
      mockPrismaService.evidence.delete.mockResolvedValue(mockEvidence);

      const result = await service.deleteEvidence('evidence-id-123');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.evidence.delete).toHaveBeenCalledWith({
        where: { id: 'evidence-id-123' },
      });
      expect(mockMinioClient.removeObject).toHaveBeenCalled();
    });

    it('should throw NotFoundException if evidence not found', async () => {
      mockPrismaService.evidence.findUnique.mockResolvedValue(null);

      await expect(service.deleteEvidence('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
