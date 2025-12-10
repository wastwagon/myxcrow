import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EscrowParticipantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const escrowId = request.params.id || request.body.escrowId;

    if (!escrowId) {
      throw new ForbiddenException('Escrow ID is required');
    }

    const escrow = await this.prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new ForbiddenException('Escrow not found');
    }

    if (escrow.buyerId !== user.id && escrow.sellerId !== user.id) {
      throw new ForbiddenException('You are not a participant in this escrow');
    }

    request.escrow = escrow;
    return true;
  }
}




