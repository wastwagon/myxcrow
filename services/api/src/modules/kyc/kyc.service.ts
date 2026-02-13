import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as MinIO from 'minio';
import { KYCStatus } from '@prisma/client';

@Injectable()
export class KYCService {
  private minioClient: MinIO.Client;
  private bucketName: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    // Initialize MinIO client (same as EvidenceService)
    const endpoint =
      this.configService.get<string>('S3_ENDPOINT') ||
      this.configService.get<string>('MINIO_ENDPOINT') ||
      'minio';
    const accessKey =
      this.configService.get<string>('S3_ACCESS_KEY') ||
      this.configService.get<string>('MINIO_ACCESS_KEY') ||
      'minioadmin';
    const secretKey =
      this.configService.get<string>('S3_SECRET_KEY') ||
      this.configService.get<string>('MINIO_SECRET_KEY') ||
      'minioadmin';

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

    this.bucketName =
      this.configService.get<string>('S3_BUCKET') ||
      this.configService.get<string>('MINIO_BUCKET') ||
      'escrow-evidence';
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error: any) {
      // Best-effort only; per-request ops will fail clearly if bucket is unavailable
      console.warn(`Could not ensure KYC bucket exists: ${error?.message || String(error)}`);
    }
  }

  /**
   * Upload file to MinIO and return object key
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, userId: string, fileType: 'card-front' | 'card-back' | 'selfie'): Promise<string> {
    const objectName = `kyc/${userId}/${fileType}-${Date.now()}-${fileName}`;

    try {
      await this.ensureBucketExists();
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
   * Process KYC registration (NO face matching - admin review required)
   */
  async processKYCRegistration(data: {
    userId: string;
    ghanaCardNumber: string;
    cardFrontBuffer: Buffer;
    cardBackBuffer: Buffer;
    selfieBuffer: Buffer;
  }): Promise<{ success: boolean; message: string }> {
    // Upload files to MinIO (no face matching validation)
    const cardFrontUrl = await this.uploadFile(data.cardFrontBuffer, 'card-front.jpg', data.userId, 'card-front');
    const cardBackUrl = await this.uploadFile(data.cardBackBuffer, 'card-back.jpg', data.userId, 'card-back');
    const selfieUrl = await this.uploadFile(data.selfieBuffer, 'selfie.jpg', data.userId, 'selfie');

    // Create or update KYC record (NO face matching)
    await this.prisma.kYCDetail.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        ghanaCardNumber: data.ghanaCardNumber,
        cardFrontUrl: cardFrontUrl,
        cardBackUrl: cardBackUrl,
        selfieUrl: selfieUrl,
        documentType: 'GHANA_CARD',
        // NO faceMatchScore or faceMatchPassed
      },
      update: {
        ghanaCardNumber: data.ghanaCardNumber,
        cardFrontUrl: cardFrontUrl,
        cardBackUrl: cardBackUrl,
        selfieUrl: selfieUrl,
        adminApproved: false, // Reset approval on re-submission
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        rejectionReason: null,
      },
    });

    // Update user status to PENDING (always requires admin review)
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        kycStatus: KYCStatus.PENDING, // Always PENDING, never auto-approved
      },
    });

    // Notify admin of KYC pending (non-blocking)
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true },
    });
    if (user?.email) {
      this.emailService.sendAdminKycPendingNotification({
        userEmail: user.email,
        userId: data.userId,
      }).catch((err) => console.error('Failed to send admin KYC notification:', err));
    }

    return {
      success: true,
      message: 'KYC documents submitted successfully. Admin will review your submission.',
    };
  }

  /**
   * Allow an authenticated user to resubmit KYC (e.g. after rejection).
   * Uses the same document storage flow as registration (NO face matching).
   */
  async resubmitKYC(data: {
    userId: string;
    ghanaCardNumber: string;
    cardFrontBuffer: Buffer;
    cardBackBuffer: Buffer;
    selfieBuffer: Buffer;
  }): Promise<{ success: boolean; message: string; kycStatus: KYCStatus }> {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.kycStatus === KYCStatus.VERIFIED) {
      throw new BadRequestException('Your KYC is already verified');
    }

    const result = await this.processKYCRegistration({
      userId: data.userId,
      ghanaCardNumber: data.ghanaCardNumber,
      cardFrontBuffer: data.cardFrontBuffer,
      cardBackBuffer: data.cardBackBuffer,
      selfieBuffer: data.selfieBuffer,
    });

    const updated = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { kycStatus: true },
    });

    return {
      ...result,
      kycStatus: updated?.kycStatus || KYCStatus.PENDING,
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
   * List pending KYC verifications (for admin) - aligns with User Management PENDING status
   * Returns:
   * - kycDetails: users who submitted documents (can approve/reject)
   * - awaitingSubmission: users with PENDING status but no KYC documents yet
   */
  async listPendingVerifications(limit: number = 50, offset: number = 0) {
    const [kycDetails, awaitingSubmission, totalAwaitingReview] = await Promise.all([
      this.prisma.kYCDetail.findMany({
        where: {
          adminApproved: false,
          user: { kycStatus: KYCStatus.PENDING },
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
      this.prisma.user.findMany({
        where: {
          kycStatus: KYCStatus.PENDING,
          kycDetails: { is: null }, // No KYCDetail - never submitted documents
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          kycStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.kYCDetail.count({
        where: {
          adminApproved: false,
          user: { kycStatus: KYCStatus.PENDING },
        },
      }),
    ]);

    const total = totalAwaitingReview + awaitingSubmission.length;

    return {
      kycDetails,
      awaitingSubmission,
      total,
      totalAwaitingReview,
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

  /**
   * Handle Smile ID job completion callback
   */
  async handleSmileIDCallback(result: {
    userId: string;
    jobId: string;
    passed: boolean;
    resultText: string;
    resultCode: string;
    raw: any;
  }) {
    // Update KYC details with Smile ID results
    await this.prisma.kYCDetail.update({
      where: { userId: result.userId },
      data: {
        smileJobId: result.jobId,
        smileResultCode: result.resultCode,
        smileResultText: result.resultText,
        faceMatchPassed: result.passed,
        livenessVerified: result.passed, // Assuming passed means liveness too for DOCUMENT_VERIFICATION
        // faceMatchScore can be extracted from raw result if needed
      },
    });

    // Update user status
    // If it passed Smile verification, it still needs ADMIN review per user request
    await this.prisma.user.update({
      where: { id: result.userId },
      data: {
        kycStatus: result.passed ? KYCStatus.PENDING : KYCStatus.REJECTED,
      },
    });

    return { success: true };
  }
}

