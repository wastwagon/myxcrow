import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpCircle, Building2, Smartphone, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { form } from '@/lib/form-classes';
import { type SavedPayoutMethod } from '@/lib/withdrawal-payout';
import {
  payoutDetailsFormSchema,
  toMethodDetailsPayload,
  type PayoutDetailsFormData,
} from '@/lib/payout-form-schema';
import { PayoutDetailsFields } from '@/components/wallet/PayoutDetailsFields';
import Link from 'next/link';

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
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

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
  });

  const { data: savedMethods = [] } = useQuery<SavedPayoutMethod[]>({
    queryKey: ['payout-methods'],
    queryFn: async () => (await apiClient.get('/wallet/payout-methods')).data,
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

  if (!isAuthenticated()) return null;

  const availableBalance = wallet ? wallet.availableCents / 100 : 0;

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshWithdraw} disabled={!isMobile} className="max-w-2xl mx-auto space-y-5">
        <PageHeader
          eyebrow="Wallet"
          title="Request withdrawal"
          subtitle="Choose how you want to receive your payout"
          icon={<ArrowUpCircle className="w-6 h-6" />}
          action={
            <Link href="/wallet/payout-methods" className="text-sm text-brand-gold hover:text-brand-gold/80 font-medium">
              Manage methods
            </Link>
          }
        />

        {wallet && (
          <div className="rounded-ios-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-3">
            <p className="text-sm text-white/80">
              <span className="text-white/60">Available balance: </span>
              <span className="font-semibold text-brand-gold">
                {formatCurrency(wallet.availableCents, wallet.currency || 'GHS')}
              </span>
            </p>
          </div>
        )}

        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-5 md:p-6 space-y-5">
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
                      'w-full text-left p-4 rounded-ios-lg border transition-colors',
                      selected
                        ? 'border-brand-gold/50 bg-brand-gold/10 ring-1 ring-brand-gold/25'
                        : 'border-white/15 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('w-5 h-5 mt-0.5', selected ? 'text-brand-gold' : 'text-white/50')} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {method.label || method.methodLabel}
                          </span>
                          {method.isDefault && (
                            <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-0.5">{method.payoutSummary}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  size="lg"
                  fullWidth
                  loading={withdrawMutation.isPending}
                  onClick={onSubmitSaved}
                >
                  Submit request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitNew)} className="space-y-5">
              <PayoutDetailsFields
                register={register}
                errors={errors}
                methodType={methodType}
                setValue={setValue}
              />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savePayoutMethod}
                  onChange={(e) => setSavePayoutMethod(e.target.checked)}
                  className={form.checkbox}
                />
                <span className="text-sm text-white/80">Save these payout details for future withdrawals</span>
              </label>

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

              <div className="rounded-ios-lg border border-amber-500/35 bg-amber-500/15 p-4">
                <p className="text-sm text-amber-100/90">
                  Withdrawals are reviewed manually. You will be notified when your request is processed.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled" size="lg" fullWidth loading={withdrawMutation.isPending}>
                  Submit request
                </Button>
              </div>
            </form>
          )}
        </div>
      </PullToRefresh>
    </Layout>
  );
}
