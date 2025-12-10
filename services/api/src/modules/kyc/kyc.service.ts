import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FaceMatchingService } from './face-matching.service';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';
import { KYCStatus } from '@prisma/client';

@Injectable()
export class KYCService {
  private minioClient: MinIO.Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private faceMatchingService: FaceMatchingService,
    private configService: ConfigService,
  ) {
    // Initialize MinIO client (same as EvidenceService)
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'minio';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin';

    let endPoint = endpoint;
    let port = 9000;

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      endPoint = url.hostname;
      port = parseInt(url.port || '9000', 10);
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
      useSSL: false,
      accessKey,
      secretKey,
    });

    this.bucketName = this.configService.get<string>('S3_BUCKET') || 'escrow-evidence';
  }

  /**
   * Upload file to MinIO and return object key
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, userId: string, fileType: 'card-front' | 'card-back' | 'selfie'): Promise<string> {
    const objectName = `kyc/${userId}/${fileType}-${Date.now()}-${fileName}`;

    try {
      await this.minioClient.putObject(this.bucketName, objectName, fileBuffer, fileBuffer.length, {
        'Content-Type': 'image/jpeg',
      });

      return objectName;
    } catch (error) {
      throw new BadRequestException(`Failed to upload ${fileType}: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for downloading KYC documents (admin only)
   */
  async getPresignedDownloadUrl(objectName: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, expiresIn);
      return url;
    } catch (error) {
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  /**
   * Process KYC registration with face matching
   */
  async processKYCRegistration(data: {
    userId: string;
    ghanaCardNumber: string;
    cardFrontBuffer: Buffer;
    cardBackBuffer: Buffer;
    selfieBuffer: Buffer;
  }): Promise<{ faceMatchScore: number; faceMatchPassed: boolean }> {
    // Validate images
    await this.faceMatchingService.validateImage(data.cardFrontBuffer, 'Ghana Card front');
    await this.faceMatchingService.validateImage(data.selfieBuffer, 'Selfie');

    // Perform face matching
    const matchResult = await this.faceMatchingService.compareFaces(data.cardFrontBuffer, data.selfieBuffer);

    // Upload files to MinIO
    const cardFrontUrl = await this.uploadFile(data.cardFrontBuffer, 'card-front.jpg', data.userId, 'card-front');
    const cardBackUrl = await this.uploadFile(data.cardBackBuffer, 'card-back.jpg', data.userId, 'card-back');
    const selfieUrl = await this.uploadFile(data.selfieBuffer, 'selfie.jpg', data.userId, 'selfie');

    // Create or update KYC record
    await this.prisma.kYCDetail.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        ghanaCardNumber: data.ghanaCardNumber,
        cardFrontUrl: cardFrontUrl,
        cardBackUrl: cardBackUrl,
        selfieUrl: selfieUrl,
        faceMatchScore: matchResult.score,
        faceMatchPassed: matchResult.passed,
        documentType: 'GHANA_CARD',
      },
      update: {
        ghanaCardNumber: data.ghanaCardNumber,
        cardFrontUrl: cardFrontUrl,
        cardBackUrl: cardBackUrl,
        selfieUrl: selfieUrl,
        faceMatchScore: matchResult.score,
        faceMatchPassed: matchResult.passed,
        adminApproved: false, // Reset approval on re-submission
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        rejectionReason: null,
      },
    });

    // Update user KYC status
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        kycStatus: matchResult.passed ? KYCStatus.IN_PROGRESS : KYCStatus.PENDING,
      },
    });

    return {
      faceMatchScore: matchResult.score,
      faceMatchPassed: matchResult.passed,
    };
  }

  /**
   * Get KYC details for a user
   */
  async getKYCDetails(userId: string) {
    return this.prisma.kYCDetail.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            kycStatus: true,
          },
        },
      },
    });
  }

  /**
   * List pending KYC verifications (for admin)
   */
  async listPendingVerifications(limit: number = 50, offset: number = 0) {
    const [kycDetails, total] = await Promise.all([
      this.prisma.kYCDetail.findMany({
        where: {
          adminApproved: false,
          faceMatchPassed: true, // Only show those that passed automatic check
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              kycStatus: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.kYCDetail.count({
        where: {
          adminApproved: false,
          faceMatchPassed: true,
        },
      }),
    ]);

    return {
      kycDetails,
      total,
      limit,
      offset,
    };
  }

  /**
   * Admin approves KYC verification
   */
  async approveKYC(userId: string, adminId: string, notes?: string) {
    const kycDetail = await this.prisma.kYCDetail.findUnique({
      where: { userId },
    });

    if (!kycDetail) {
      throw new NotFoundException('KYC details not found');
    }

    // Update KYC detail
    await this.prisma.kYCDetail.update({
      where: { userId },
      data: {
        adminApproved: true,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        verifiedAt: new Date(),
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.VERIFIED,
        kycVerifiedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Admin rejects KYC verification
   */
  async rejectKYC(userId: string, adminId: string, reason: string) {
    const kycDetail = await this.prisma.kYCDetail.findUnique({
      where: { userId },
    });

    if (!kycDetail) {
      throw new NotFoundException('KYC details not found');
    }

    // Update KYC detail
    await this.prisma.kYCDetail.update({
      where: { userId },
      data: {
        adminApproved: false,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.REJECTED,
      },
    });

    return { success: true };
  }
}

