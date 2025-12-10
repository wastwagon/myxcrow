import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DefaultSettings {
  fees: {
    percentage: number;
    fixedCents: number;
    paidBy: string;
  };
  security: {
    rateLimitRequestsPerMinute: number;
    sessionTimeoutHours: number;
  };
  audit: {
    logAllActions: boolean;
    retentionDays: number;
  };
  notifications: {
    emailEnabled: boolean;
  };
  dataRetention: {
    evidenceDays: number;
    disputeDays: number;
    emailDays: number;
  };
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeDefaults();
  }

  private async initializeDefaults() {
    const defaults: DefaultSettings = {
      fees: {
        percentage: 2.0,
        fixedCents: 0,
        paidBy: 'buyer',
      },
      security: {
        rateLimitRequestsPerMinute: 60,
        sessionTimeoutHours: 24,
      },
      audit: {
        logAllActions: true,
        retentionDays: 365,
      },
      notifications: {
        emailEnabled: true,
      },
      dataRetention: {
        evidenceDays: 90,
        disputeDays: 365,
        emailDays: 90,
      },
    };

    for (const [category, settings] of Object.entries(defaults)) {
      for (const [key, value] of Object.entries(settings)) {
        const fullKey = `${category}.${key}`;
        const existing = await this.prisma.platformSettings.findUnique({
          where: { key: fullKey },
        });

        if (!existing) {
          await this.prisma.platformSettings.create({
            data: {
              key: fullKey,
              value: value as any,
              category,
              description: `Default ${category} setting: ${key}`,
              isPublic: category === 'fees',
            },
          });
        }
      }
    }
  }

  async getSetting(key: string) {
    const setting = await this.prisma.platformSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found`);
    }

    return setting;
  }

  async updateSetting(key: string, value: any, updatedBy?: string) {
    return this.prisma.platformSettings.upsert({
      where: { key },
      update: {
        value: value as any,
        updatedBy,
      },
      create: {
        key,
        value: value as any,
        category: key.split('.')[0],
        updatedBy,
      },
    });
  }

  async getFeeSettings() {
    const percentage = await this.getSetting('fees.percentage');
    const fixedCents = await this.getSetting('fees.fixedCents');
    const paidBy = await this.getSetting('fees.paidBy');

    return {
      percentage: percentage.value as number,
      fixedCents: fixedCents.value as number,
      paidBy: paidBy.value as string,
    };
  }

  async calculateFee(amountCents: number) {
    const feeSettings = await this.getFeeSettings();
    const percentageFee = Math.round((amountCents * feeSettings.percentage) / 100);
    const totalFee = percentageFee + feeSettings.fixedCents;
    const netAmount = amountCents - totalFee;

    return {
      feeCents: totalFee,
      feePercentage: feeSettings.percentage,
      netAmountCents: netAmount,
    };
  }

  async getRateLimitConfig(): Promise<number> {
    const setting = await this.getSetting('security.rateLimitRequestsPerMinute');
    return setting.value as number;
  }
}




