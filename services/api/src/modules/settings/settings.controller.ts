import { Controller, Get, Put, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('fees')
  async getFeeSettings() {
    return this.settingsService.getFeeSettings();
  }

  @Get('fees/calculate')
  async calculateFeePreview(@Query('amountCents') amountCents?: string) {
    const cents = parseInt(amountCents ?? '', 10);
    if (!Number.isFinite(cents) || cents < 1) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    return this.settingsService.calculateFee(cents);
  }

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getPublicSetting(key);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: any,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSetting(key, value, user.id);
  }
}




