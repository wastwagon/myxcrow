import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, DisputeStatus, DisputeReason } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  async create(
    @Body() data: { escrowId: string; reason: DisputeReason; description?: string },
    @CurrentUser() user: any,
  ) {
    return this.disputesService.createDispute({
      ...data,
      initiatorId: user.id,
    });
  }

  @Get()
  async list(
    @Query('escrowId') escrowId?: string,
    @Query('status') status?: DisputeStatus,
    @CurrentUser() user?: any,
  ) {
    return this.disputesService.listDisputes({
      escrowId,
      initiatorId: user?.id,
      status,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const dispute = await this.disputesService.getDispute(id);
    const sla = await this.disputesService.getDisputeSLA(id);
    return {
      ...dispute,
      sla,
    };
  }

  @Get(':id/sla')
  async getSLA(@Param('id') id: string) {
    return this.disputesService.getDisputeSLA(id);
  }

  @Post(':id/message')
  async addMessage(
    @Param('id') id: string,
    @Body() data: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.disputesService.addMessage(id, user.id, data.content);
  }

  @Put(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async resolve(
    @Param('id') id: string,
    @Body() data: { resolution: string },
    @CurrentUser() user: any,
  ) {
    return this.disputesService.resolveDispute(id, user.id, data.resolution);
  }

  @Put(':id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.disputesService.closeDispute(id, user.id);
  }
}

