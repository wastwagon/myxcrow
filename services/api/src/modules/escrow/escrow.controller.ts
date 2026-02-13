import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { MilestoneEscrowService } from './milestone-escrow.service';
import { EscrowMessageService } from './escrow-message.service';
import { EscrowExportService } from './escrow-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PhoneRequiredGuard } from '../auth/guards/phone-required.guard';
import { EscrowParticipantGuard } from './guards/escrow-participant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as ICurrentUser } from '../auth/interfaces/current-user.interface';
import { EscrowStatus } from '@prisma/client';
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('escrows')
@UseGuards(JwtAuthGuard, PhoneRequiredGuard)
export class EscrowController {
  constructor(
    private readonly escrowService: EscrowService,
    private readonly milestoneService: MilestoneEscrowService,
    private readonly messageService: EscrowMessageService,
    private readonly exportService: EscrowExportService,
  ) {}

  @Post()
  async create(@Body() data: any, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.createEscrow({
      ...data,
      buyerId: user.id,
    });
  }

  @Get()
  async list(
    @Query('status') status?: EscrowStatus,
    @Query('role') role?: 'buyer' | 'seller',
    @Query('search') search?: string,
    @Query('counterpartyEmail') counterpartyEmail?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: any,
  ) {
    // Admins should see all escrows, not filtered by userId
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('AUDITOR') || user?.roles?.includes('SUPPORT');
    
    return this.escrowService.listEscrows({
      userId: isAdmin ? undefined : user?.id,
      role,
      status,
      search,
      counterpartyEmail,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      currency,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('stats')
  async stats(@CurrentUser() user: ICurrentUser) {
    return this.escrowService.getEscrowStats(user.id);
  }

  @Get(':id')
  @UseGuards(EscrowParticipantGuard)
  async getOne(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.getEscrow(id, user?.id);
  }

  @Put(':id/fund')
  @UseGuards(EscrowParticipantGuard)
  async fund(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.fundEscrow(id, user.id);
  }

  @Put(':id/ship')
  @UseGuards(EscrowParticipantGuard)
  async ship(
    @Param('id') id: string,
    @Body() data: { trackingNumber?: string; carrier?: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.escrowService.shipEscrow(id, user.id, data.trackingNumber, data.carrier);
  }

  @Put(':id/deliver')
  @UseGuards(EscrowParticipantGuard)
  async deliver(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.deliverEscrow(id, user.id);
  }

  @Put(':id/confirm-delivery')
  @UseGuards(EscrowParticipantGuard)
  async confirmDelivery(
    @Param('id') id: string,
    @Body() body: { deliveryCode: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.escrowService.confirmDeliveryByCodeForBuyer(id, user.id, body.deliveryCode);
  }

  @Put(':id/service-completed')
  @UseGuards(EscrowParticipantGuard)
  async serviceCompleted(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.markServiceCompleted(id, user.id);
  }

  @Put(':id/release')
  @UseGuards(EscrowParticipantGuard)
  async release(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.releaseFunds(id, user.id);
  }

  @Put(':id/refund')
  @UseGuards(EscrowParticipantGuard)
  async refund(
    @Param('id') id: string,
    @Body() data: { reason?: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.escrowService.refundEscrow(id, user.id, data.reason);
  }

  @Put(':id/cancel')
  @UseGuards(EscrowParticipantGuard)
  async cancel(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.escrowService.cancelEscrow(id, user.id);
  }

  @Get(':id/milestones')
  @UseGuards(EscrowParticipantGuard)
  async getMilestones(@Param('id') id: string) {
    return this.milestoneService.getMilestones(id);
  }

  @Post(':id/milestones')
  @UseGuards(EscrowParticipantGuard)
  async createMilestones(
    @Param('id') id: string,
    @Body() data: { milestones: Array<{ name: string; description?: string; amountCents: number }> },
  ) {
    return this.milestoneService.createMilestones(id, data.milestones);
  }

  @Put(':id/milestones/:milestoneId/complete')
  @UseGuards(EscrowParticipantGuard)
  async completeMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.milestoneService.completeMilestone(id, milestoneId, user.id);
  }

  @Put(':id/milestones/:milestoneId/release')
  @UseGuards(EscrowParticipantGuard)
  async releaseMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.milestoneService.releaseMilestone(id, milestoneId, user.id);
  }

  @Get(':id/messages')
  @UseGuards(EscrowParticipantGuard)
  async getMessages(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    return this.messageService.getMessages(id, user.id);
  }

  @Post(':id/messages')
  @UseGuards(EscrowParticipantGuard)
  async sendMessage(
    @Param('id') id: string,
    @Body() data: { content: string },
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.messageService.sendMessage(id, user.id, data.content);
  }

  @Get('export/csv')
  async exportCsv(
    @Res() res: Response,
    @Query('status') status?: EscrowStatus,
    @Query('role') role?: 'buyer' | 'seller',
    @Query('search') search?: string,
    @Query('counterpartyEmail') counterpartyEmail?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('currency') currency?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    const csv = await this.exportService.exportEscrowsToCsv({
      userId: user?.id,
      role,
      status,
      search,
      counterpartyEmail,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      currency,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const filename = `escrows_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
