import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EscrowParticipantGuard } from '../escrow/guards/escrow-participant.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('escrow/:id')
  @UseGuards(EscrowParticipantGuard)
  async getEscrowLedger(@Param('id') id: string) {
    return this.ledgerService.getEscrowLedger(id);
  }
}




