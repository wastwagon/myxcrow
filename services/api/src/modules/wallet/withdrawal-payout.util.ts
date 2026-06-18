import { BadRequestException } from '@nestjs/common';
import { WithdrawalMethod } from '@prisma/client';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { isValidGhanaPhone, normalizeGhanaPhone } from '../../common/utils/phone.util';
import { GHANA_BANKS, WITHDRAWAL_METHOD_LABELS } from './payout.constants';

export { GHANA_BANKS };

export type MobileMoneyNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export interface BankPayoutDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
}

export interface MobileMoneyPayoutDetails {
  accountName?: string;
  mobileNumber: string;
  network: MobileMoneyNetwork;
}

export type PayoutDetailsInput = BankPayoutDetails | MobileMoneyPayoutDetails;

const SENSITIVE_KEYS = new Set(['accountNumber', 'mobileNumber']);

export function validatePayoutDetails(
  methodType: WithdrawalMethod,
  raw: Record<string, unknown>,
): PayoutDetailsInput {
  if (methodType === WithdrawalMethod.BANK_ACCOUNT) {
    const accountName = String(raw.accountName ?? '').trim();
    const accountNumber = String(raw.accountNumber ?? '').replace(/\s/g, '');
    const bankName = String(raw.bankName ?? '').trim();
    const branch = raw.branch ? String(raw.branch).trim() : undefined;

    if (accountName.length < 2) {
      throw new BadRequestException('Account holder name is required');
    }
    if (!/^\d{8,20}$/.test(accountNumber)) {
      throw new BadRequestException('Enter a valid bank account number (8–20 digits)');
    }
    if (bankName.length < 2) {
      throw new BadRequestException('Bank name is required');
    }
    if (!GHANA_BANKS.includes(bankName as (typeof GHANA_BANKS)[number])) {
      throw new BadRequestException('Select a valid Ghana bank');
    }

    return { accountName, accountNumber, bankName, branch };
  }

  if (methodType === WithdrawalMethod.MOBILE_MONEY) {
    const mobileNumber = normalizeGhanaPhone(String(raw.mobileNumber ?? ''));
    const network = String(raw.network ?? '').toUpperCase() as MobileMoneyNetwork;
    const accountName = raw.accountName ? String(raw.accountName).trim() : undefined;

    if (!isValidGhanaPhone(mobileNumber)) {
      throw new BadRequestException('Enter a valid Ghana mobile money number');
    }
    if (!['MTN', 'VODAFONE', 'AIRTELTIGO'].includes(network)) {
      throw new BadRequestException('Select a valid mobile money network');
    }

    return { accountName, mobileNumber, network };
  }

  throw new BadRequestException('Unsupported withdrawal method');
}

export function encryptPayoutDetailsForStorage(
  details: PayoutDetailsInput,
  encryptionService: EncryptionService,
): Record<string, string | undefined> {
  const stored: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null || value === '') continue;
    const str = String(value);
    stored[key] = SENSITIVE_KEYS.has(key) ? encryptionService.encrypt(str) : str;
  }

  return stored;
}

export function decryptPayoutDetails(
  stored: Record<string, unknown> | null | undefined,
  encryptionService: EncryptionService,
): Record<string, string> {
  if (!stored || typeof stored !== 'object') return {};

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(stored)) {
    if (value === undefined || value === null) continue;
    const str = String(value);
    result[key] = SENSITIVE_KEYS.has(key) && encryptionService.isEncrypted(str)
      ? encryptionService.decrypt(str)
      : str;
  }
  return result;
}

export function maskAccountNumber(value: string): string {
  const digits = value.replace(/\s/g, '');
  if (digits.length <= 4) return '****';
  return `****${digits.slice(-4)}`;
}

export function maskPhoneNumber(value: string): string {
  const normalized = normalizeGhanaPhone(value);
  if (normalized.length < 4) return '****';
  return `*** *** ${normalized.slice(-4)}`;
}

export function formatPayoutSummary(
  methodType: WithdrawalMethod,
  details: Record<string, string>,
): string {
  if (methodType === WithdrawalMethod.BANK_ACCOUNT) {
    const bank = details.bankName || 'Bank';
    const acct = details.accountNumber ? maskAccountNumber(details.accountNumber) : '****';
    return `${bank} • ${acct}`;
  }
  if (methodType === WithdrawalMethod.MOBILE_MONEY) {
    const network = details.network || 'MoMo';
    const phone = details.mobileNumber ? maskPhoneNumber(details.mobileNumber) : '****';
    return `${network} • ${phone}`;
  }
  return String(methodType ?? '').replace(/_/g, ' ');
}

export function formatMethodLabel(methodType: WithdrawalMethod | string): string {
  return (
    WITHDRAWAL_METHOD_LABELS[methodType] ??
    String(methodType).replace(/_/g, ' ')
  );
}

export function maskPayoutDetailsForUser(
  methodType: WithdrawalMethod,
  details: Record<string, string>,
): Record<string, string> {
  if (methodType === WithdrawalMethod.BANK_ACCOUNT) {
    return {
      accountName: details.accountName,
      bankName: details.bankName,
      branch: details.branch,
      accountNumber: details.accountNumber
        ? maskAccountNumber(details.accountNumber)
        : '****',
    };
  }
  if (methodType === WithdrawalMethod.MOBILE_MONEY) {
    return {
      accountName: details.accountName,
      network: details.network,
      mobileNumber: details.mobileNumber
        ? maskPhoneNumber(details.mobileNumber)
        : '****',
    };
  }
  return {};
}

export function serializeWithdrawalForUser(
  withdrawal: {
    id: string;
    methodType: WithdrawalMethod;
    methodDetails: unknown;
    amountCents: number;
    feeCents: number;
    status: string;
    failureReason?: string | null;
    createdAt: Date;
    processedAt?: Date | null;
  },
  encryptionService: EncryptionService,
) {
  const decrypted = decryptPayoutDetails(
    withdrawal.methodDetails as Record<string, unknown>,
    encryptionService,
  );

  return {
    id: withdrawal.id,
    methodType: withdrawal.methodType,
    methodLabel: formatMethodLabel(withdrawal.methodType),
    payoutSummary: formatPayoutSummary(withdrawal.methodType, decrypted),
    methodDetails: maskPayoutDetailsForUser(withdrawal.methodType, decrypted),
    amountCents: withdrawal.amountCents,
    feeCents: withdrawal.feeCents,
    status: withdrawal.status,
    failureReason: withdrawal.failureReason,
    createdAt: withdrawal.createdAt,
    processedAt: withdrawal.processedAt,
  };
}

export function serializeWithdrawalForAdmin(
  withdrawal: {
    id: string;
    methodType: WithdrawalMethod;
    methodDetails: unknown;
    amountCents: number;
    feeCents: number;
    status: string;
    failureReason?: string | null;
    requestedBy: string;
    processedBy?: string | null;
    processedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    wallet?: {
      currency?: string;
      user?: {
        id: string;
        email: string;
        phone?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      };
    };
  },
  encryptionService: EncryptionService,
) {
  const decrypted = decryptPayoutDetails(
    withdrawal.methodDetails as Record<string, unknown>,
    encryptionService,
  );

  return {
    id: withdrawal.id,
    methodType: withdrawal.methodType,
    methodLabel: formatMethodLabel(withdrawal.methodType),
    payoutSummary: formatPayoutSummary(withdrawal.methodType, decrypted),
    methodDetails: decrypted,
    amountCents: withdrawal.amountCents,
    feeCents: withdrawal.feeCents,
    currency: withdrawal.wallet?.currency ?? 'GHS',
    status: withdrawal.status,
    failureReason: withdrawal.failureReason,
    requestedBy: withdrawal.requestedBy,
    processedBy: withdrawal.processedBy,
    processedAt: withdrawal.processedAt,
    createdAt: withdrawal.createdAt,
    updatedAt: withdrawal.updatedAt,
    wallet: withdrawal.wallet
      ? {
          currency: withdrawal.wallet.currency,
          user: withdrawal.wallet.user,
        }
      : undefined,
  };
}
