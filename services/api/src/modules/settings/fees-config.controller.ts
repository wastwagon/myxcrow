import { Controller, Put, Body, UseGuards } from '@nestjs/common';
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

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateFeeSettings(
    @Body() data: {
      percentage?: number;
      fixedCents?: number;
      feePaidBy?: 'buyer' | 'seller' | 'split';
      paidBy?: 'buyer' | 'seller' | 'split'; // Frontend sends paidBy
    },
    @CurrentUser() admin: any,
  ) {
    const paidBy = data.feePaidBy ?? data.paidBy;
    if (data.percentage !== undefined) {
      await this.settingsService.updateSetting('fees.percentage', data.percentage, admin.id);
    }
    if (data.fixedCents !== undefined) {
      await this.settingsService.updateSetting('fees.fixedCents', data.fixedCents, admin.id);
    }
    if (paidBy) {
      await this.settingsService.updateSetting('fees.paidBy', paidBy, admin.id);
    }

    return this.settingsService.getFeeSettings();
  }
}




