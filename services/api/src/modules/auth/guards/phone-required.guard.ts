import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to ensure user has a phone number.
 * Forces existing users to add phone before using escrows, payments, etc.
 * Allow profile routes so users can update their phone.
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

    return true;
  }
}
