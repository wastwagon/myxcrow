import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WithdrawalMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../../common/crypto/encryption.service';
import {
  decryptPayoutDetails,
  encryptPayoutDetailsForStorage,
  formatMethodLabel,
  formatPayoutSummary,
  maskPayoutDetailsForUser,
  validatePayoutDetails,
  type PayoutDetailsInput,
} from './withdrawal-payout.util';

@Injectable()
export class PayoutMethodService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async listForUser(userId: string) {
    const rows = await this.prisma.payoutMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    return rows.map((row) => this.serializeForUser(row));
  }

  async getDecryptedForUser(userId: string, payoutMethodId: string) {
    const row = await this.prisma.payoutMethod.findFirst({
      where: { id: payoutMethodId, userId },
    });

    if (!row) {
      throw new NotFoundException('Payout method not found');
    }

    if (
      row.methodType !== WithdrawalMethod.BANK_ACCOUNT &&
      row.methodType !== WithdrawalMethod.MOBILE_MONEY
    ) {
      throw new BadRequestException('Unsupported payout method type');
    }

    const details = decryptPayoutDetails(
      row.details as Record<string, unknown>,
      this.encryptionService,
    );

    return {
      id: row.id,
      methodType: row.methodType,
      label: row.label,
      details: details as unknown as PayoutDetailsInput,
    };
  }

  async createForUser(
    userId: string,
    data: {
      methodType: WithdrawalMethod;
      methodDetails: Record<string, unknown>;
      label?: string;
      setDefault?: boolean;
    },
  ) {
    const payoutDetails = validatePayoutDetails(data.methodType, data.methodDetails);
    const encryptedDetails = encryptPayoutDetailsForStorage(
      payoutDetails,
      this.encryptionService,
    );

    const existingCount = await this.prisma.payoutMethod.count({ where: { userId } });
    const isDefault = data.setDefault ?? existingCount === 0;

    if (isDefault) {
      await this.prisma.payoutMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const row = await this.prisma.payoutMethod.create({
      data: {
        userId,
        methodType: data.methodType,
        label: data.label?.trim() || this.defaultLabel(data.methodType, payoutDetails),
        details: encryptedDetails,
        isDefault,
      },
    });

    return this.serializeForUser(row);
  }

  async createFromValidatedDetails(
    userId: string,
    methodType: WithdrawalMethod,
    payoutDetails: PayoutDetailsInput,
    label?: string,
    setDefault?: boolean,
  ) {
    return this.createForUser(userId, {
      methodType,
      methodDetails: payoutDetails as unknown as Record<string, unknown>,
      label,
      setDefault,
    });
  }

  async deleteForUser(userId: string, payoutMethodId: string) {
    const row = await this.prisma.payoutMethod.findFirst({
      where: { id: payoutMethodId, userId },
    });

    if (!row) {
      throw new NotFoundException('Payout method not found');
    }

    await this.prisma.payoutMethod.delete({ where: { id: payoutMethodId } });

    if (row.isDefault) {
      const next = await this.prisma.payoutMethod.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      if (next) {
        await this.prisma.payoutMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async setDefaultForUser(userId: string, payoutMethodId: string) {
    const row = await this.prisma.payoutMethod.findFirst({
      where: { id: payoutMethodId, userId },
    });

    if (!row) {
      throw new NotFoundException('Payout method not found');
    }

    await this.prisma.$transaction([
      this.prisma.payoutMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      this.prisma.payoutMethod.update({
        where: { id: payoutMethodId },
        data: { isDefault: true },
      }),
    ]);

    return this.serializeForUser({ ...row, isDefault: true });
  }

  private defaultLabel(methodType: WithdrawalMethod, details: PayoutDetailsInput): string {
    if (methodType === WithdrawalMethod.BANK_ACCOUNT) {
      const bank = (details as { bankName?: string }).bankName || 'Bank';
      return `${bank} account`;
    }
    const network = (details as { network?: string }).network || 'MoMo';
    return `${network} wallet`;
  }

  private serializeForUser(row: {
    id: string;
    methodType: WithdrawalMethod;
    label: string | null;
    details: unknown;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const decrypted = decryptPayoutDetails(
      row.details as Record<string, unknown>,
      this.encryptionService,
    );

    return {
      id: row.id,
      methodType: row.methodType,
      methodLabel: formatMethodLabel(row.methodType),
      label: row.label,
      payoutSummary: formatPayoutSummary(row.methodType, decrypted),
      details: maskPayoutDetailsForUser(row.methodType, decrypted),
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
