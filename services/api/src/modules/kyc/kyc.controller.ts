import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('kyc')
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async listPendingVerifications(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.kycService.listPendingVerifications(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getKYCDetails(@Param('userId') userId: string) {
    return this.kycService.getKYCDetails(userId);
  }

  @Put('approve/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveKYC(
    @Param('userId') userId: string,
    @Body() body: { notes?: string },
    @CurrentUser() admin: any,
  ) {
    return this.kycService.approveKYC(userId, admin.id, body.notes);
  }

  @Put('reject/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectKYC(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: any,
  ) {
    return this.kycService.rejectKYC(userId, admin.id, body.reason);
  }

  @Get('download/:objectName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getDownloadUrl(@Param('objectName') objectName: string) {
    const url = await this.kycService.getPresignedDownloadUrl(objectName);
    return { downloadUrl: url };
  }
}




