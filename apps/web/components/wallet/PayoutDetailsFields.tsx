import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Building2, Smartphone } from 'lucide-react';
import { form } from '@/lib/form-classes';
import { cn } from '@/lib/utils';
import { GHANA_BANKS, MOBILE_MONEY_NETWORKS } from '@/lib/withdrawal-payout';
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
                  'flex flex-col items-start gap-2 p-4 rounded-ios-lg border text-left transition-colors',
                  selected
                    ? 'border-brand-gold/50 bg-brand-gold/15 ring-1 ring-brand-gold/30'
                    : 'border-white/15 bg-white/5 hover:bg-white/10',
                )}
              >
                <Icon className={cn('w-5 h-5', selected ? 'text-brand-gold' : 'text-white/60')} />
                <span className="text-sm font-semibold text-white">{option.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('methodType')} />
      </div>

      {methodType === 'BANK_ACCOUNT' && (
        <div className="space-y-4 rounded-ios-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-medium text-white">Bank account details</p>
          <div>
            <label htmlFor="accountName" className={form.label}>
              Account holder name *
            </label>
            <input {...register('accountName')} id="accountName" className={form.input} />
            {'accountName' in errors && errors.accountName && (
              <p className="mt-1 text-sm text-red-400">{errors.accountName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="bankName" className={form.label}>
              Bank *
            </label>
            <select {...register('bankName')} id="bankName" className={form.input} defaultValue="">
              <option value="" disabled>
                Select your bank
              </option>
              {GHANA_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
            {'bankName' in errors && errors.bankName && (
              <p className="mt-1 text-sm text-red-400">{errors.bankName.message}</p>
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
              <p className="mt-1 text-sm text-red-400">{errors.accountNumber.message}</p>
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
        <div className="space-y-4 rounded-ios-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-medium text-white">Mobile money details</p>
          <div>
            <label htmlFor="network" className={form.label}>
              Network *
            </label>
            <select {...register('network')} id="network" className={form.input} defaultValue="">
              <option value="" disabled>
                Select network
              </option>
              {MOBILE_MONEY_NETWORKS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {'network' in errors && errors.network && (
              <p className="mt-1 text-sm text-red-400">{errors.network.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="mobileNumber" className={form.label}>
              Mobile money number *
            </label>
            <input {...register('mobileNumber')} id="mobileNumber" type="tel" className={form.input} />
            {'mobileNumber' in errors && errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.mobileNumber.message}</p>
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
