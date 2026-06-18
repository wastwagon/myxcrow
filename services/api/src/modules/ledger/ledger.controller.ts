import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EscrowAccessGuard } from '../escrow/guards/escrow-access.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('escrow/:id')
  @UseGuards(EscrowAccessGuard)
  async getEscrowLedger(@Param('id') id: string) {
    return this.ledgerService.getEscrowLedger(id);
  }
}




