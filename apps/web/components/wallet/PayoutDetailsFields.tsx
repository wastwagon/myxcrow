import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Building2, Smartphone } from 'lucide-react';
import { form } from '@/lib/form-classes';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { GHANA_BANKS, MOBILE_MONEY_NETWORKS } from '@/lib/withdrawal-payout';
import type { GhanaBank } from '@myxcrow/shared';
import type { PayoutDetailsFormData } from '@/lib/payout-form-schema';

interface PayoutDetailsFieldsProps {
  register: UseFormRegister<PayoutDetailsFormData>;
  errors: FieldErrors<PayoutDetailsFormData>;
  methodType: PayoutDetailsFormData['methodType'];
  setValue: UseFormSetValue<PayoutDetailsFormData>;
}

export function PayoutDetailsFields({
  register,
  errors,
  methodType,
  setValue,
}: PayoutDetailsFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className={form.label}>Payout method *</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'BANK_ACCOUNT', label: 'Bank transfer', icon: Building2 },
              { value: 'MOBILE_MONEY', label: 'Mobile money', icon: Smartphone },
            ] as const
          ).map((option) => {
            const selected = methodType === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('methodType', option.value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-start gap-2 p-4 rounded-[12px] border text-left transition-colors min-h-[56px] touch-manipulation',
                  selected
                    ? 'border-brand-maroon/40 bg-brand-maroon/5 ring-1 ring-brand-maroon/20'
                    : 'border-[rgba(60,60,67,0.12)] bg-[#f2f2f7]',
                )}
              >
                <Icon className={cn('w-5 h-5', selected ? 'text-brand-maroon' : 'text-[rgba(60,60,67,0.6)]')} />
                <span className="text-sm font-semibold text-gray-900">{option.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('methodType')} />
      </div>

      {methodType === 'BANK_ACCOUNT' && (
        <div className="space-y-4 rounded-[12px] bg-[#f2f2f7] p-4">
          <p className="text-sm font-medium text-gray-900">Bank account details</p>
          <div>
            <label htmlFor="accountName" className={form.label}>
              Account holder name *
            </label>
            <input {...register('accountName')} id="accountName" className={form.input} />
            {'accountName' in errors && errors.accountName && (
              <p className={form.inputError}>{errors.accountName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="bankName" className={form.label}>
              Bank *
            </label>
            <Select {...register('bankName')} id="bankName" tone="light" defaultValue="" error={'bankName' in errors && !!errors.bankName}>
              <option value="" disabled>
                Select your bank
              </option>
              {GHANA_BANKS.map((bank: GhanaBank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </Select>
            {'bankName' in errors && errors.bankName && (
              <p className={form.inputError}>{errors.bankName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="accountNumber" className={form.label}>
              Account number *
            </label>
            <input
              {...register('accountNumber')}
              id="accountNumber"
              inputMode="numeric"
              className={form.input}
            />
            {'accountNumber' in errors && errors.accountNumber && (
              <p className={form.inputError}>{errors.accountNumber.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="branch" className={form.label}>
              Branch (optional)
            </label>
            <input {...register('branch')} id="branch" className={form.input} />
          </div>
        </div>
      )}

      {methodType === 'MOBILE_MONEY' && (
        <div className="space-y-4 rounded-[12px] bg-[#f2f2f7] p-4">
          <p className="text-sm font-medium text-gray-900">Mobile money details</p>
          <div>
            <label htmlFor="network" className={form.label}>
              Network *
            </label>
            <Select {...register('network')} id="network" tone="light" defaultValue="" error={'network' in errors && !!errors.network}>
              <option value="" disabled>
                Select network
              </option>
              {MOBILE_MONEY_NETWORKS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            {'network' in errors && errors.network && (
              <p className={form.inputError}>{errors.network.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="mobileNumber" className={form.label}>
              Mobile money number *
            </label>
            <input {...register('mobileNumber')} id="mobileNumber" type="tel" className={form.input} />
            {'mobileNumber' in errors && errors.mobileNumber && (
              <p className={form.inputError}>{errors.mobileNumber.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="momoAccountName" className={form.label}>
              Registered name (optional)
            </label>
            <input {...register('accountName')} id="momoAccountName" className={form.input} />
          </div>
        </div>
      )}
    </div>
  );
}
