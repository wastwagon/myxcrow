import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { form } from '@/lib/form-classes';

const withdrawalSchema = z.object({
  amountCents: z.number().min(100, 'Amount must be at least 1.00'),
  methodType: z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY'], {
    required_error: 'Please select a withdrawal method',
  }),
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().optional(),
  mobileNumber: z.string().optional(),
  network: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO']).optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();

  const refreshWithdraw = async () => {
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet');
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { methodType: 'BANK_ACCOUNT' },
  });

  const methodType = watch('methodType');

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const methodDetails: Record<string, string | undefined> = {};
      if (data.methodType === 'BANK_ACCOUNT') {
        methodDetails.accountNumber = data.accountNumber;
        methodDetails.bankName = data.bankName;
      } else {
        methodDetails.mobileNumber = data.mobileNumber;
        methodDetails.network = data.network;
      }

      return apiClient.post('/wallet/withdraw', {
        amountCents: Math.round(data.amountCents * 100),
        methodType: data.methodType,
        methodDetails,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      toast.success('Withdrawal request submitted');
      router.push('/wallet');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to request withdrawal');
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    withdrawMutation.mutate(data);
  };

  if (!isAuthenticated()) {
    return null;
  }

  const availableBalance = wallet ? wallet.availableCents / 100 : 0;

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshWithdraw} disabled={!isMobile} className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Request withdrawal"
          subtitle="Withdraw funds from your wallet"
          icon={<ArrowUpCircle className="w-6 h-6" />}
        />

        {wallet && (
          <div className="rounded-ios-lg border border-brand-gold/30 bg-brand-gold/10 px-4 py-3">
            <p className="text-ios-subhead text-label-primary">
              <span className="text-label-secondary">Available balance: </span>
              <span className="font-semibold text-brand-gold">
                {formatCurrency(wallet.availableCents, wallet.currency || 'GHS')}
              </span>
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6 space-y-6"
        >
          <div>
            <label htmlFor="amountCents" className={form.label}>
              Amount (₵) *
            </label>
            <input
              {...register('amountCents', { valueAsNumber: true })}
              type="number"
              id="amountCents"
              step="0.01"
              min="1"
              max={availableBalance}
              placeholder="100.00"
              className={form.input}
            />
            {errors.amountCents && (
              <p className="mt-1 text-sm text-red-400">{errors.amountCents.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="methodType" className={form.label}>
              Withdrawal method *
            </label>
            <select {...register('methodType')} id="methodType" className={form.input}>
              <option value="BANK_ACCOUNT">Bank transfer</option>
              <option value="MOBILE_MONEY">Mobile money</option>
            </select>
            {errors.methodType && (
              <p className="mt-1 text-sm text-red-400">{errors.methodType.message}</p>
            )}
          </div>

          {methodType === 'BANK_ACCOUNT' && (
            <>
              <div>
                <label htmlFor="accountNumber" className={form.label}>
                  Account number *
                </label>
                <input
                  {...register('accountNumber')}
                  type="text"
                  id="accountNumber"
                  placeholder="1234567890"
                  className={form.input}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-400">{errors.accountNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="bankName" className={form.label}>
                  Bank name
                </label>
                <input
                  {...register('bankName')}
                  type="text"
                  id="bankName"
                  placeholder="e.g., GCB Bank"
                  className={form.input}
                />
              </div>
            </>
          )}

          {methodType === 'MOBILE_MONEY' && (
            <>
              <div>
                <label htmlFor="mobileNumber" className={form.label}>
                  Mobile number *
                </label>
                <input
                  {...register('mobileNumber')}
                  type="tel"
                  id="mobileNumber"
                  placeholder="0244123456"
                  className={form.input}
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-400">{errors.mobileNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="network" className={form.label}>
                  Network *
                </label>
                <select {...register('network')} id="network" className={form.input}>
                  <option value="">Select network</option>
                  <option value="MTN">MTN</option>
                  <option value="VODAFONE">Vodafone</option>
                  <option value="AIRTELTIGO">AirtelTigo</option>
                </select>
                {errors.network && (
                  <p className="mt-1 text-sm text-red-400">{errors.network.message}</p>
                )}
              </div>
            </>
          )}

          <div className="rounded-ios-lg border border-amber-500/35 bg-amber-500/15 p-4">
            <p className="text-sm text-amber-100/90">
              <strong className="text-amber-200">Note:</strong> Withdrawal requests are processed manually.
              You will be notified once your request is approved or denied.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="filled" size="lg" fullWidth loading={withdrawMutation.isPending}>
              Submit request
            </Button>
          </div>
        </form>
      </PullToRefresh>
    </Layout>
  );
}
