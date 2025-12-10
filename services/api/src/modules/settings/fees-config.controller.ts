import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('settings/fees')
@UseGuards(JwtAuthGuard)
export class FeesConfigController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getFeeSettings() {
    return this.settingsService.getFeeSettings();
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateFeeSettings(
    @Body() data: {
      percentage?: number;
      fixedCents?: number;
      feePaidBy?: 'buyer' | 'seller' | 'split';
    },
    @CurrentUser() admin: any,
  ) {
    if (data.percentage !== undefined) {
      await this.settingsService.updateSetting('fees.percentage', data.percentage, admin.id);
    }
    if (data.fixedCents !== undefined) {
      await this.settingsService.updateSetting('fees.fixedCents', data.fixedCents, admin.id);
    }
    if (data.feePaidBy) {
      await this.settingsService.updateSetting('fees.paidBy', data.feePaidBy, admin.id);
    }

    return this.settingsService.getFeeSettings();
  }
}




