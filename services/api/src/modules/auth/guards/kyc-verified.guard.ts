import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KYCStatus } from '@prisma/client';

/**
 * Guard to ensure user has verified KYC status
 * Blocks access to protected routes until admin approves KYC
 */
@Injectable()
export class KYCVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admins, auditors, and support can bypass KYC check
    if (user.roles?.includes('ADMIN') || user.roles?.includes('AUDITOR') || user.roles?.includes('SUPPORT')) {
      return true;
    }

    // Get user's current KYC status
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { kycStatus: true, isActive: true },
    });

    if (!userRecord) {
      throw new ForbiddenException('User not found');
    }

    if (!userRecord.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    // Only allow if KYC is verified
    if (userRecord.kycStatus !== KYCStatus.VERIFIED) {
      throw new ForbiddenException(
        'KYC verification required. Your account is pending admin approval. ' +
          'You can access your dashboard but cannot perform transactions until verified.',
      );
    }

    return true;
  }
}




