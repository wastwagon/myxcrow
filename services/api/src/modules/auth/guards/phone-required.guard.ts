import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { KYCStatus } from '@prisma/client';

const STAFF_ROLES = new Set(['ADMIN', 'AUDITOR', 'SUPPORT']);

/**
 * Ensures the user has a Ghana phone on file and completed SMS verification at registration
 * (`kycStatus === VERIFIED` — legacy DB field name).
 */
@Injectable()
export class PhoneRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const phone = (user.phone || '').trim();
    if (!phone) {
      throw new ForbiddenException(
        'Phone number required. Please add your Ghana phone number in your profile to continue.',
      );
    }

    const isStaff = user.roles?.some((role: string) => STAFF_ROLES.has(role));
    if (!isStaff && user.kycStatus !== KYCStatus.VERIFIED) {
      throw new ForbiddenException(
        'Phone verification required. Complete SMS verification during registration.',
      );
    }

    if (user.isActive === false) {
      throw new ForbiddenException('Account is inactive');
    }

    return true;
  }
}
