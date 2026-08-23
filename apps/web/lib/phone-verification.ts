import type { User } from '@/lib/auth';

/**
 * Phone OTP at registration sets `kycStatus` to VERIFIED on the server.
 * Registration cannot complete without a valid OTP, so new accounts are always verified.
 */
export function isPhoneVerified(user: Pick<User, 'kycStatus'> | null | undefined): boolean {
  return user?.kycStatus === 'VERIFIED';
}

/** Human-readable phone verification label for profile UI. */
export function formatPhoneVerificationStatus(status: string | undefined | null): string {
  return status === 'VERIFIED' ? 'Verified' : 'Not verified';
}
