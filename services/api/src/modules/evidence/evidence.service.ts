import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AntivirusService } from '../../common/security/antivirus.service';
import * as MinIO from 'minio';

@Injectable()
export class EvidenceService {
  private minioClient: MinIO.Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private antivirusService: AntivirusService,
  ) {
    // Support both S3_* and MINIO_* environment variables
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 
                     this.configService.get<string>('MINIO_ENDPOINT') || 
                     'minio';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY') || 
                      this.configService.get<string>('MINIO_ACCESS_KEY') || 
                      'minioadmin';
    const secretKey = this.configService.get<string>('S3_SECRET_KEY') || 
                     this.configService.get<string>('MINIO_SECRET_KEY') || 
                     'minioadmin';
    
    // Extract host and port from endpoint URL if it's a full URL
    let endPoint = endpoint;
    let port = 9000;
    let useSSL = false;

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      endPoint = url.hostname;
      useSSL = url.protocol === 'https:';
      port = parseInt(url.port || (useSSL ? '443' : '80'), 10);
    } else {
      endPoint = endpoint.replace(/^http:\/\//, '').replace(/^https:\/\//, '').split(':')[0];
      const portMatch = endpoint.match(/:(\d+)/);
      if (portMatch) {
        port = parseInt(portMatch[1], 10);
      }
    }

    this.minioClient = new MinIO.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.bucketName = this.configService.get<string>('S3_BUCKET') || 
                      this.configService.get<string>('MINIO_BUCKET') || 
                      'evidence';
    
    const hasStorageConfig = this.configService.get<string>('S3_ENDPOINT') || this.configService.get<string>('MINIO_ENDPOINT');
    if (hasStorageConfig) {
      this.ensureBucketExists();
    }
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error) {
      // Log but don't fail - bucket creation will be handled per-request if needed
      console.warn(`Could not ensure bucket exists: ${error.message}`);
    }
  }

  private async assertEscrowParticipant(escrowId: string, userId: string) {
    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      select: { buyerId: true, sellerId: true },
    });
    if (!escrow || (escrow.buyerId !== userId && escrow.sellerId !== userId)) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }
  }

  async generatePresignedUploadUrl(
    escrowId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    userId: string,
  ) {
    await this.assertEscrowParticipant(escrowId, userId);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const objectName = `escrow/${escrowId}/${Date.now()}_${safeName}`;
    const expiresIn = 3600; // 1 hour

    const url = await this.minioClient.presignedPutObject(this.bucketName, objectName, expiresIn);

    return {
      uploadUrl: url,
      objectName,
      expiresIn,
    };
  }

  async verifyAndCreateEvidence(data: {
    escrowId: string;
    uploadedBy: string;
    objectName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: string;
    description?: string;
    fileBuffer?: Buffer; // Optional buffer for scanning
    latitude?: number;
    longitude?: number;
  }) {
    await this.assertEscrowParticipant(data.escrowId, data.uploadedBy);
    const expectedPrefix = `escrow/${data.escrowId}/`;
    if (!data.objectName?.startsWith(expectedPrefix)) {
      throw new BadRequestException('Invalid upload object');
    }

    // Scan file if buffer is provided
    if (data.fileBuffer) {
      const scanResult = await this.antivirusService.scanFile(
        data.fileBuffer,
        data.fileName,
        data.mimeType,
      );

      if (!scanResult.safe) {
        throw new BadRequestException(`File security check failed: ${scanResult.reason}`);
      }
    }

    const metadata: { latitude?: number; longitude?: number; capturedAt?: string } | undefined =
      data.latitude != null && data.longitude != null
        ? {
            latitude: data.latitude,
            longitude: data.longitude,
            capturedAt: new Date().toISOString(),
          }
        : undefined;

    const evidence = await this.prisma.evidence.create({
      data: {
        escrowId: data.escrowId,
        uploadedBy: data.uploadedBy,
        fileKey: data.objectName, // Database uses fileKey, not fileUrl
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        type: data.type,
        description: data.description,
        metadata: metadata ?? undefined,
      },
    });

    return evidence;
  }

  async generatePresignedDownloadUrl(evidenceId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    const expiresIn = 3600; // 1 hour
    const url = await this.minioClient.presignedGetObject(this.bucketName, evidence.fileKey, expiresIn);

    return {
      downloadUrl: url,
      expiresIn,
    };
  }

  async getEvidence(id: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) throw new NotFoundException('Evidence not found');
    await this.assertEscrowParticipant(evidence.escrowId, userId);
    return evidence;
  }

  async getDownloadUrlForEvidence(id: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) throw new NotFoundException('Evidence not found');
    await this.assertEscrowParticipant(evidence.escrowId, userId);
    return this.generatePresignedDownloadUrl(id);
  }

  async deleteEvidence(id: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }
    await this.assertEscrowParticipant(evidence.escrowId, userId);

    await this.minioClient.removeObject(this.bucketName, evidence.fileKey);
    await this.prisma.evidence.delete({
      where: { id },
    });

    return { success: true };
  }
}

