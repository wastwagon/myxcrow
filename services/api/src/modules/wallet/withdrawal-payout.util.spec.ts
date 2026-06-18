import { WithdrawalMethod } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import {
  formatPayoutSummary,
  maskAccountNumber,
  validatePayoutDetails,
} from './withdrawal-payout.util';

describe('withdrawal-payout.util', () => {
  describe('validatePayoutDetails', () => {
    it('validates bank account details', () => {
      const result = validatePayoutDetails(WithdrawalMethod.BANK_ACCOUNT, {
        accountName: 'Jane Doe',
        accountNumber: '1234567890',
        bankName: 'GCB Bank',
        branch: 'Accra',
      });

      expect(result).toEqual({
        accountName: 'Jane Doe',
        accountNumber: '1234567890',
        bankName: 'GCB Bank',
        branch: 'Accra',
      });
    });

    it('validates mobile money details', () => {
      const result = validatePayoutDetails(WithdrawalMethod.MOBILE_MONEY, {
        mobileNumber: '+233551234567',
        network: 'MTN',
        accountName: 'Jane Doe',
      });

      expect(result).toMatchObject({
        mobileNumber: '0551234567',
        network: 'MTN',
        accountName: 'Jane Doe',
      });
    });

    it('rejects unknown bank name', () => {
      expect(() =>
        validatePayoutDetails(WithdrawalMethod.BANK_ACCOUNT, {
          accountName: 'Jane Doe',
          accountNumber: '1234567890',
          bankName: 'Unknown Bank',
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects invalid bank account', () => {
      expect(() =>
        validatePayoutDetails(WithdrawalMethod.BANK_ACCOUNT, {
          accountName: 'J',
          accountNumber: '12',
          bankName: '',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('maskAccountNumber', () => {
    it('masks all but last four digits', () => {
      expect(maskAccountNumber('1234567890')).toBe('****7890');
    });
  });

  describe('formatPayoutSummary', () => {
    it('formats bank summary', () => {
      expect(
        formatPayoutSummary(WithdrawalMethod.BANK_ACCOUNT, {
          bankName: 'GCB Bank',
          accountNumber: '1234567890',
        }),
      ).toBe('GCB Bank • ****7890');
    });
  });
});
