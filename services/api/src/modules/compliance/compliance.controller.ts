import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SanctionsScreeningService } from './sanctions-screening.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly screeningService: SanctionsScreeningService) {}

  @Post('screen/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async screenUser(@Param('userId') userId: string) {
    return this.screeningService.screenUser(userId);
  }

  @Post('allowlist/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addToAllowList(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: any,
  ) {
    return this.screeningService.addToAllowList(userId, reason, admin.id);
  }

  @Post('denylist/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addToDenyList(
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: any,
  ) {
    return this.screeningService.addToDenyList(userId, reason, admin.id);
  }

  @Delete('allowlist/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeFromAllowList(@Param('userId') userId: string, @CurrentUser() admin: any) {
    return this.screeningService.removeFromList(userId, 'allow', admin.id);
  }

  @Delete('denylist/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeFromDenyList(@Param('userId') userId: string, @CurrentUser() admin: any) {
    return this.screeningService.removeFromList(userId, 'deny', admin.id);
  }
}




