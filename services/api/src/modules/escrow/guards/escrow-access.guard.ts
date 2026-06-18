import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.AUDITOR, UserRole.SUPPORT];

export function isEscrowStaff(user?: { roles?: string[] }): boolean {
  return !!user?.roles?.some((role) => STAFF_ROLES.includes(role as UserRole));
}

@Injectable()
export class EscrowAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const escrowId = request.params.id || request.params.escrowId || request.body?.escrowId;

    if (!escrowId) {
      throw new ForbiddenException('Escrow ID is required');
    }

    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new ForbiddenException('Escrow not found');
    }

    if (isEscrowStaff(user)) {
      request.escrow = escrow;
      request.isStaffEscrowView = true;
      return true;
    }

    if (escrow.buyerId === user.id || escrow.sellerId === user.id) {
      request.escrow = escrow;
      return true;
    }

    throw new ForbiddenException('You do not have access to this escrow');
  }
}
