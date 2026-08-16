import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, X, Copy } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { form } from '@/lib/form-classes';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import EscrowFeeSummary from '@/components/EscrowFeeSummary';
import { calculateEscrowFees } from '@/lib/fee-calculator';
import {
  ESCROW_CATEGORY,
  ESCROW_CATEGORY_LABELS,
  PROFESSIONAL_SERVICE_TYPES,
  type EscrowCategory,
} from '@/lib/escrow-services';
import { formatCurrency } from '@/lib/utils';

const milestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  amountCents: z.number().min(1, 'Amount must be at least 0.01'),
  targetDate: z.string().optional(),
  approvalWindowDays: z.number().int().min(1, 'Min 1 day').max(30, 'Max 30 days').optional(),
});

const createEscrowSchema = z.object({
  sellerId: z.string().regex(/^0[0-9]{9}$/, 'Enter seller Ghana phone (e.g. 0551234567)'),
  amountCents: z.number().min(1, 'Amount must be at least ₵1.00'),
  currency: z.string().default('GHS'),
  description: z.string().min(1, 'Description is required'),
  escrowCategory: z.enum([ESCROW_CATEGORY.PHYSICAL_GOODS, ESCROW_CATEGORY.PROFESSIONAL_SERVICE]),
  serviceType: z.string().optional(),
  useMilestones: z.boolean().default(false),
  milestones: z.array(milestoneSchema).optional(),
  deliveryRegion: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddressLine: z.string().optional(),
  deliveryPhone: z.string().optional(),
  useDeliveryPin: z.boolean().default(false),
  deliveryPin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits').optional(),
}).refine((data) => {
  if (data.escrowCategory === ESCROW_CATEGORY.PROFESSIONAL_SERVICE) {
    return !!data.serviceType?.trim();
  }
  return true;
}, {
  message: 'Select a professional service type',
  path: ['serviceType'],
}).refine((data) => {
  if (data.escrowCategory === ESCROW_CATEGORY.PHYSICAL_GOODS) {
    return !!data.deliveryRegion?.trim() && !!data.deliveryCity?.trim() && !!data.deliveryAddressLine?.trim();
  }
  return true;
}, {
  message: 'Delivery region, city, and street address are required for physical goods',
  path: ['deliveryAddressLine'],
}).refine((data) => {
  if (data.useMilestones && data.milestones && data.milestones.length > 0) {
    const totalMilestones = data.milestones.reduce((sum, m) => sum + m.amountCents, 0);
    return totalMilestones <= data.amountCents;
  }
  return true;
}, {
  message: 'Total milestone amounts cannot exceed escrow amount',
  path: ['milestones'],
}).refine((data) => {
  if (data.useDeliveryPin) return /^\d{6}$/.test(data.deliveryPin || '');
  return true;
}, {
  message: 'Delivery PIN must be exactly 6 digits',
  path: ['deliveryPin'],
});

type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const generatePin = () => {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });

  const { data: feeSettings } = useQuery({
    queryKey: ['fee-settings'],
    queryFn: async () => (await apiClient.get('/settings/fees')).data,
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
    setValue,
    getValues,
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      currency: 'GHS',
      escrowCategory: ESCROW_CATEGORY.PHYSICAL_GOODS as EscrowCategory,
      useMilestones: false,
      milestones: [],
      useDeliveryPin: false,
      deliveryPin: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  const useMilestones = watch('useMilestones');
  const amountCents = watch('amountCents');
  const escrowCategory = watch('escrowCategory');
  const serviceType = watch('serviceType');
  const milestones = watch('milestones');
  const useDeliveryPin = watch('useDeliveryPin');
  const deliveryPin = watch('deliveryPin');
  const isPhysicalGoods = escrowCategory === ESCROW_CATEGORY.PHYSICAL_GOODS;

  useEffect(() => {
    if (!useDeliveryPin) {
      setValue('deliveryPin', undefined);
      return;
    }
    if (!getValues('deliveryPin')) {
      setValue('deliveryPin', generatePin(), { shouldValidate: true });
    }
  }, [useDeliveryPin, getValues, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateEscrowFormData) => {
      const payload: any = {
        ...data,
        sellerPhone: data.sellerId,
        useWallet: true, // Always use wallet for escrow funding - Paystack is only for wallet top-up
        amountCents: Math.round(data.amountCents * 100),
        deliveryRegion: data.deliveryRegion || undefined,
        deliveryCity: data.deliveryCity || undefined,
        deliveryAddressLine: data.deliveryAddressLine || undefined,
        deliveryPhone: data.deliveryPhone || undefined,
        deliveryConfirmationMode: data.useDeliveryPin ? 'pin' : 'code',
        deliveryPin: data.useDeliveryPin ? data.deliveryPin : undefined,
        escrowCategory: data.escrowCategory,
        serviceType:
          data.escrowCategory === ESCROW_CATEGORY.PROFESSIONAL_SERVICE
            ? data.serviceType
            : undefined,
      };
      if (data.escrowCategory === ESCROW_CATEGORY.PHYSICAL_GOODS) {
        payload.deliveryRegion = data.deliveryRegion || undefined;
        payload.deliveryCity = data.deliveryCity || undefined;
        payload.deliveryAddressLine = data.deliveryAddressLine || undefined;
        payload.deliveryPhone = data.deliveryPhone || undefined;
      } else {
        delete payload.deliveryRegion;
        delete payload.deliveryCity;
        delete payload.deliveryAddressLine;
        delete payload.deliveryPhone;
      }
      if (data.useMilestones && data.milestones && data.milestones.length > 0) {
        payload.milestones = data.milestones.map(m => ({
          ...m,
          amountCents: Math.round(m.amountCents * 100),
          targetDate: m.targetDate ? new Date(m.targetDate).toISOString() : undefined,
          approvalWindowDays: m.approvalWindowDays || 5,
        }));
      } else {
        delete payload.milestones;
      }
      delete payload.useMilestones;
      delete payload.useDeliveryPin;
      return apiClient.post('/escrows', payload);
    },
    onSuccess: (response) => {
      const escrowId = response.data.id;
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Escrow created and funded from your wallet');
      router.push(`/escrows/created/${escrowId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create escrow');
    },
  });

  const onSubmit = (data: CreateEscrowFormData) => {
    createMutation.mutate(data);
  };

  const addMilestone = () => {
    append({ name: '', description: '', amountCents: 0, targetDate: '', approvalWindowDays: 5 });
  };

  const totalMilestoneAmount = milestones?.reduce((sum, m) => sum + (m.amountCents || 0), 0) || 0;
  const remainingAmount = (amountCents || 0) - totalMilestoneAmount;

  const feePreview = useMemo(() => {
    if (!feeSettings || !amountCents || amountCents < 1) return null;
    return calculateEscrowFees(Math.round(amountCents * 100), feeSettings);
  }, [amountCents, feeSettings]);

  const fundingRequiredCents = feePreview?.fundingAmountCents ?? (amountCents ? Math.round(amountCents * 100) : 0);
  const hasSufficientBalance =
    wallet && fundingRequiredCents > 0 && wallet.availableCents >= fundingRequiredCents;

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <CustomerLayout title="New escrow" back>
      <form onSubmit={handleSubmit(onSubmit)} className={`${form.panel} space-y-6`}>
          <div>
            <label htmlFor="sellerId" className={form.label}>
              Seller Phone *
            </label>
            <input
              {...register('sellerId')}
              type="tel"
              id="sellerId"
              placeholder="0551234567"
              className={form.input}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the seller&apos;s Ghana phone number. They must be registered.
            </p>
            {errors.sellerId && (
              <p className={form.inputError}>{errors.sellerId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={form.label}>
              Description *
            </label>
            <Textarea
              {...register('description')}
              id="description"
              tone="light"
              rows={4}
              placeholder="Describe the item or service being escrowed..."
              error={!!errors.description}
            />
            {errors.description && (
              <p className={form.inputError}>{errors.description.message}</p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-[rgba(60,60,67,0.6)] mb-2">Type of transaction *</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.entries(ESCROW_CATEGORY_LABELS) as [EscrowCategory, string][]).map(([value, label]) => {
                const selected = escrowCategory === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setValue('escrowCategory', value, { shouldValidate: true });
                      if (value === ESCROW_CATEGORY.PHYSICAL_GOODS) {
                        setValue('serviceType', undefined);
                      }
                    }}
                    className={`p-4 rounded-[12px] border text-left transition-colors touch-manipulation min-h-[56px] ${
                      selected
                        ? 'border-brand-maroon/40 bg-brand-maroon/5 ring-1 ring-brand-maroon/20'
                        : 'border-[rgba(60,60,67,0.12)] bg-[#f2f2f7]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('escrowCategory')} />
          </div>

          {escrowCategory === ESCROW_CATEGORY.PROFESSIONAL_SERVICE && (
            <div>
              <label htmlFor="serviceType" className={form.label}>
                Professional service *
              </label>
              <Select
                {...register('serviceType')}
                id="serviceType"
                tone="light"
                defaultValue=""
                error={!!errors.serviceType}
              >
                <option value="" disabled>
                  Select a service category
                </option>
                {PROFESSIONAL_SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                No shipping address needed — the seller marks the service complete when finished. Your transaction PIN still applies as the deal identifier.
              </p>
              {errors.serviceType && (
                <p className={form.inputError}>{errors.serviceType.message}</p>
              )}
            </div>
          )}

          {isPhysicalGoods && (
          <>
          <div className="border-t border-[rgba(60,60,67,0.12)] pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery address (ship to)</h3>
            <p className="text-xs text-gray-500 mb-3">Where the seller should send the item. Only you and the seller see this.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryRegion" className={form.label}>Region</label>
                <input
                  {...register('deliveryRegion')}
                  id="deliveryRegion"
                  placeholder="e.g. Greater Accra"
                  className={form.input}
                />
              </div>
              <div>
                <label htmlFor="deliveryCity" className={form.label}>City / Town</label>
                <input
                  {...register('deliveryCity')}
                  id="deliveryCity"
                  placeholder="e.g. Accra"
                  className={form.input}
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="deliveryAddressLine" className={form.label}>Street address / Landmark</label>
              <input
                {...register('deliveryAddressLine')}
                id="deliveryAddressLine"
                placeholder="Street, area, or landmark"
                className={form.input}
              />
              {errors.deliveryAddressLine && (
                <p className={form.inputError}>{errors.deliveryAddressLine.message}</p>
              )}
            </div>
            <div className="mt-4">
              <label htmlFor="deliveryPhone" className={form.label}>Contact phone for delivery (optional)</label>
              <input
                {...register('deliveryPhone')}
                id="deliveryPhone"
                type="tel"
                placeholder="0551234567"
                className={form.input}
              />
            </div>
          </div>
          </>
          )}

          <div className="border-t border-[rgba(60,60,67,0.12)] pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Transaction confirmation</h3>
            <p className="text-xs text-gray-500 mb-3">
              Default: reference + delivery code (physical goods when shipped). Or use a <strong>transaction PIN</strong>: you and the seller both see this PIN on the escrow details — it identifies the deal for handoff or delivery. Entering the reference + PIN confirms completion before funds auto-release.
            </p>
            <Checkbox
              id="useDeliveryPin"
              tone="light"
              {...register('useDeliveryPin')}
              label="Use PIN to confirm completion (auto-generate secure PIN for this escrow)"
            />
            {useDeliveryPin && (
              <div className="mt-2">
                <label htmlFor="deliveryPin" className={form.label}>
                  Generated Transaction PIN (6 digits)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="deliveryPin"
                    value={deliveryPin || ''}
                    readOnly
                    className={`${form.input} font-mono tracking-[0.3em] select-all`}
                    aria-readonly="true"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 min-w-[44px] !px-3"
                    onClick={async () => {
                      if (!deliveryPin) return;
                      await navigator.clipboard.writeText(deliveryPin);
                      toast.success('PIN copied');
                    }}
                    aria-label="Copy PIN"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This PIN is saved on your escrow details and shared with the seller. You can view it anytime before completion.
                </p>
                {errors.deliveryPin && (
                  <p className={form.inputError}>{errors.deliveryPin.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amountCents" className={form.label}>
                Amount ({CURRENCY_SYMBOL}) *
              </label>
              <input
                type="number"
                id="amountCents"
                step="0.01"
                min="1"
                placeholder="100.00"
                className={form.input}
                {...register('amountCents', { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter amount in Ghana Cedis
              </p>
              {errors.amountCents && (
                <p className={form.inputError}>{errors.amountCents.message}</p>
              )}
            </div>

            <div>
              <input type="hidden" {...register('currency')} value="GHS" />
            </div>
          </div>

          {feePreview && <EscrowFeeSummary fees={feePreview} />}

          {wallet && (
            <div className="text-sm text-[rgba(60,60,67,0.6)]">
              Wallet available:{' '}
              <span className="font-medium text-gray-900">
                {formatCurrency(wallet.availableCents, wallet.currency || 'GHS')}
              </span>
            </div>
          )}

          <div className={`p-4 rounded-[12px] border ${
            hasSufficientBalance === false
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          }`}>
            <p className={`text-sm ${hasSufficientBalance === false ? 'text-red-800' : 'text-amber-950'}`}>
              {hasSufficientBalance === false ? (
                <>
                  <strong>Insufficient balance.</strong> Top up your wallet before creating this escrow.
                  {fundingRequiredCents > 0 && (
                    <> You need {formatCurrency(fundingRequiredCents, 'GHS')} available.</>
                  )}
                  <span className="block mt-3">
                    <ButtonLink href="/wallet/topup" size="sm" variant="maroon" className="mt-1">
                      Top up wallet
                    </ButtonLink>
                  </span>
                </>
              ) : (
                <>
                  <strong>One-step funding:</strong> When you submit, MYXCROW will create and fund this escrow from your wallet
                  {fundingRequiredCents > 0 && (
                    <> ({formatCurrency(fundingRequiredCents, 'GHS')} including fees)</>
                  )}
                  . No extra fund button needed.
                </>
              )}
            </p>
          </div>

          <div className="border-t pt-6">
            <Checkbox
              id="useMilestones"
              tone="light"
              {...register('useMilestones')}
              label="Use Milestone Payments"
            />
            <p className="text-xs text-gray-500 mb-4">
              Split the escrow into multiple milestone payments. Funds will be released incrementally as milestones are completed.
            </p>

            {useMilestones && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-[12px] bg-[#f2f2f7]">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Milestone {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 inline-flex items-center justify-center text-red-600 touch-manipulation"
                        aria-label={`Remove milestone ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={form.label}>
                          Milestone Name *
                        </label>
                        <input
                          {...register(`milestones.${index}.name`)}
                          className={form.input}
                          placeholder="e.g., Phase 1, Design Complete"
                        />
                        {errors.milestones?.[index]?.name && (
                          <p className={form.inputError}>
                            {errors.milestones[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={form.label}>
                          Description (Optional)
                        </label>
                        <Textarea
                          {...register(`milestones.${index}.description`)}
                          tone="light"
                          rows={2}
                          placeholder="Describe what needs to be completed..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={form.label}>
                            Target Date (Optional)
                          </label>
                          <input
                            type="date"
                            {...register(`milestones.${index}.targetDate`)}
                            className={form.input}
                          />
                          {errors.milestones?.[index]?.targetDate && (
                            <p className={form.inputError}>
                              {errors.milestones[index]?.targetDate?.message as string}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className={form.label}>
                            Approval Window (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            {...register(`milestones.${index}.approvalWindowDays`, { valueAsNumber: true })}
                            className={form.input}
                            placeholder="5"
                          />
                          {errors.milestones?.[index]?.approvalWindowDays && (
                            <p className={form.inputError}>
                              {errors.milestones[index]?.approvalWindowDays?.message as string}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={form.label}>
                          Amount ({CURRENCY_SYMBOL}) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...register(`milestones.${index}.amountCents`, { valueAsNumber: true })}
                          className={form.input}
                          placeholder="0.00"
                        />
                        {errors.milestones?.[index]?.amountCents && (
                          <p className={form.inputError}>
                            {errors.milestones[index]?.amountCents?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </Button>

                {fields.length > 0 && (
                  <div className="p-4 bg-[#f2f2f7] rounded-[12px]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgba(60,60,67,0.6)]">Total Milestones:</span>
                      <span className="font-medium text-gray-900">{CURRENCY_SYMBOL} {totalMilestoneAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-[rgba(60,60,67,0.6)]">Remaining Amount:</span>
                      <span className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {CURRENCY_SYMBOL} {remainingAmount.toFixed(2)}
                      </span>
                    </div>
                    {remainingAmount < 0 && (
                      <p className="mt-2 text-xs text-red-600">
                        Total milestone amounts exceed escrow amount
                      </p>
                    )}
                  </div>
                )}

                {errors.milestones && (
                  <p className={form.inputError}>{errors.milestones.message}</p>
                )}
              </div>
            )}
          </div>

            <Button type="submit" variant="maroon" size="lg" fullWidth loading={createMutation.isPending} disabled={hasSufficientBalance === false || createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create & fund'}
            </Button>
        </form>
    </CustomerLayout>
  );
}
