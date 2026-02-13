import { UserRole, KYCStatus } from '@prisma/client';

/**
 * User object attached to request by JwtStrategy.
 * Used for @CurrentUser() decorator in controllers.
 */
export interface CurrentUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  kycStatus: KYCStatus;
  isActive: boolean;
}
