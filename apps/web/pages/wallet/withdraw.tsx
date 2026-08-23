import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { cn, formatCurrency } from '@/lib/utils';
import { Building2, Smartphone, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Checkbox } from '@/components/ui/Checkbox';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { form } from '@/lib/form-classes';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { type SavedPayoutMethod } from '@/lib/withdrawal-payout';
import {
  payoutDetailsFormSchema,
  toMethodDetailsPayload,
  type PayoutDetailsFormData,
} from '@/lib/payout-form-schema';
import { PayoutDetailsFields } from '@/components/wallet/PayoutDetailsFields';

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const [amountGhs, setAmountGhs] = useState<string>('');
  const [payoutMode, setPayoutMode] = useState<'saved' | 'new'>('new');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [savePayoutMethod, setSavePayoutMethod] = useState(false);
  const [payoutLabel, setPayoutLabel] = useState('');

  const refreshWithdraw = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] }),
    ]);
  };

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
    enabled: authed,
  });

  const { data: savedMethods = [] } = useQuery<SavedPayoutMethod[]>({
    queryKey: ['payout-methods'],
    queryFn: async () => (await apiClient.get('/wallet/payout-methods')).data,
    enabled: authed,
  });

  useEffect(() => {
    if (savedMethods.length > 0 && !selectedMethodId) {
      const preferred = savedMethods.find((m) => m.isDefault) || savedMethods[0];
      setSelectedMethodId(preferred.id);
      setPayoutMode('saved');
    }
  }, [savedMethods, selectedMethodId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PayoutDetailsFormData>({
    resolver: zodResolver(payoutDetailsFormSchema),
    defaultValues: { methodType: 'BANK_ACCOUNT' },
  });

  const methodType = watch('methodType');

  const withdrawMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiClient.post('/wallet/withdraw', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Withdrawal request submitted');
      router.push('/wallet');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to request withdrawal');
    },
  });

  const submitWithdrawal = (payload: Record<string, unknown>) => {
    const amount = parseFloat(amountGhs);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount (minimum GH₵1.00)');
      return;
    }
    if (wallet && amount * 100 > wallet.availableCents) {
      toast.error('Amount exceeds available balance');
      return;
    }
    withdrawMutation.mutate({
      amountCents: Math.round(amount * 100),
      ...payload,
    });
  };

  const onSubmitNew = (data: PayoutDetailsFormData) => {
    submitWithdrawal({
      methodType: data.methodType,
      methodDetails: toMethodDetailsPayload(data),
      savePayoutMethod,
      payoutLabel: payoutLabel.trim() || undefined,
    });
  };

  const onSubmitSaved = () => {
    if (!selectedMethodId) {
      toast.error('Select a payout method');
      return;
    }
    submitWithdrawal({ payoutMethodId: selectedMethodId });
  };

  if (!authed) return <PageSpinner />;

  const availableBalance = wallet ? wallet.availableCents / 100 : 0;

  return (
    <CustomerLayout title="Withdraw" back>
      <PullToRefresh onRefresh={refreshWithdraw} disabled={!isMobile} className="space-y-5">
        {walletLoading ? (
          <div className="h-4 w-40 animate-pulse rounded-[8px] bg-black/5" aria-hidden />
        ) : wallet ? (
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">
            Available {formatCurrency(wallet.availableCents, wallet.currency || 'GHS')}
          </p>
        ) : null}

        <div className={`${form.panel} space-y-5`}>
          <div>
            <label htmlFor="amountGhs" className={form.label}>
              Amount (₵) *
            </label>
            <input
              type="number"
              id="amountGhs"
              step="0.01"
              min="1"
              max={availableBalance || undefined}
              placeholder="100.00"
              value={amountGhs}
              onChange={(e) => setAmountGhs(e.target.value)}
              className={form.input}
            />
          </div>

          {savedMethods.length > 0 && (
            <SegmentedControl
              className="w-full"
              tone="light"
              value={payoutMode}
              onChange={setPayoutMode}
              options={[
                { value: 'saved', label: 'Saved method' },
                { value: 'new', label: 'New details' },
              ]}
            />
          )}

          {payoutMode === 'saved' && savedMethods.length > 0 ? (
            <div className="space-y-3">
              <p className={form.label}>Select payout method *</p>
              {savedMethods.map((method) => {
                const Icon = method.methodType === 'BANK_ACCOUNT' ? Building2 : Smartphone;
                const selected = selectedMethodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethodId(method.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-[20px] border transition-colors min-h-[56px] touch-manipulation',
                      selected
                        ? 'border-brand-maroon/40 bg-brand-maroon/5 ring-1 ring-brand-maroon/20'
                        : 'border-[rgba(60,60,67,0.12)] bg-[#f2f2f7]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('w-5 h-5 mt-0.5', selected ? 'text-brand-maroon' : 'text-[rgba(60,60,67,0.6)]')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {method.label || method.methodLabel}
                          </span>
                          {method.isDefault && (
                            <Star className="w-3.5 h-3.5 text-brand-maroon fill-brand-maroon" />
                          )}
                        </div>
                        <p className="text-sm text-[rgba(60,60,67,0.6)] mt-0.5">{method.payoutSummary}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <Button
                type="button"
                variant="maroon"
                size="lg"
                fullWidth
                loading={withdrawMutation.isPending}
                onClick={onSubmitSaved}
              >
                Submit request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitNew)} className="space-y-5">
              <PayoutDetailsFields
                register={register}
                errors={errors}
                methodType={methodType}
                setValue={setValue}
              />

              <Checkbox
                id="save-payout-method"
                tone="light"
                checked={savePayoutMethod}
                onChange={(e) => setSavePayoutMethod(e.target.checked)}
                label="Save these payout details for future withdrawals"
              />

              {savePayoutMethod && (
                <div>
                  <label htmlFor="payoutLabel" className={form.label}>Label (optional)</label>
                  <input
                    id="payoutLabel"
                    value={payoutLabel}
                    onChange={(e) => setPayoutLabel(e.target.value)}
                    placeholder="e.g. My salary account"
                    className={form.input}
                  />
                </div>
              )}

              <div className="rounded-[20px] border border-amber-500/25 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Withdrawals are reviewed manually. You will be notified when your request is processed.
                </p>
              </div>

              <Button type="submit" variant="maroon" size="lg" fullWidth loading={withdrawMutation.isPending}>
                Submit request
              </Button>
            </form>
          )}
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
