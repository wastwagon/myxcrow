import { z } from 'zod';
import { GHANA_BANKS } from '@myxcrow/shared';

const ghanaPhoneSchema = z
  .string()
  .min(10, 'Enter a valid Ghana phone number')
  .refine(
    (val) => /^(\+?233|0)[0-9]{9}$/.test(val.replace(/\s/g, '')),
    'Enter a valid Ghana phone number',
  );

const ghanaBankEnum = z.enum(GHANA_BANKS as unknown as [string, ...string[]], {
  errorMap: () => ({ message: 'Select your bank' }),
});

export const payoutDetailsFormSchema = z.discriminatedUnion('methodType', [
  z.object({
    methodType: z.literal('BANK_ACCOUNT'),
    accountName: z.string().min(2, 'Account holder name is required'),
    accountNumber: z
      .string()
      .min(8, 'Account number is required')
      .regex(/^\d{8,20}$/, 'Enter 8–20 digits only'),
    bankName: ghanaBankEnum,
    branch: z.string().optional(),
  }),
  z.object({
    methodType: z.literal('MOBILE_MONEY'),
    accountName: z.string().optional(),
    mobileNumber: ghanaPhoneSchema,
    network: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO'], {
      required_error: 'Select a network',
    }),
  }),
]);

export type PayoutDetailsFormData = z.infer<typeof payoutDetailsFormSchema>;

export function toMethodDetailsPayload(
  data: PayoutDetailsFormData,
): Record<string, string | undefined> {
  if (data.methodType === 'BANK_ACCOUNT') {
    return {
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      bankName: data.bankName,
      branch: data.branch,
    };
  }
  return {
    accountName: data.accountName,
    mobileNumber: data.mobileNumber,
    network: data.network,
  };
}
