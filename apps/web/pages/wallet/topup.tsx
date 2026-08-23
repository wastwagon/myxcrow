import { useMemo, useState } from 'react';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { form } from '@/lib/form-classes';
import { isPaystackCheckoutUrl } from '@/lib/safe-url';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

/** Paystack processing fee % passed to customer (must match backend) */
const PAYSTACK_FEE_PERCENT = 1.95;

export default function WalletTopupPage() {
  const authed = useRequireAuth();
  const [amount, setAmount] = useState<string>('100');

  const amountCents = useMemo(() => Math.round(parseFloat(amount || '0') * 100), [amount]);
  const feeCents = useMemo(() => Math.round((amountCents * PAYSTACK_FEE_PERCENT) / 100), [amountCents]);
  const totalChargedCents = amountCents + feeCents;

  const topupMutation = useMutation({
    mutationFn: async () => {
      const user = getUser();
      if (amountCents < 100) throw new Error('Amount must be at least ₵1.00');
      const r = await apiClient.post('/payments/wallet/topup', {
        amountCents,
        email: user?.email,
      });
      return r.data;
    },
    onSuccess: (data) => {
      if (data?.authorizationUrl && isPaystackCheckoutUrl(data.authorizationUrl)) {
        window.location.href = data.authorizationUrl;
      } else {
        toast.error('Could not get a valid payment URL');
      }
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Failed to start top-up');
    },
  });

  if (!authed) return <PageSpinner />;

  return (
    <CustomerLayout title="Top up" back>
      <div className={`${form.panel} space-y-4`}>
          <p className="text-[14px] leading-relaxed text-[rgba(60,60,67,0.6)]">
            Add funds via Paystack (card or mobile money). Processing fee is shown before you pay.
          </p>
          <div>
            <label htmlFor="amount" className={form.label}>
              Amount (₵)
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={form.input}
            />
          </div>
          {amountCents >= 100 && (
            <p className="text-[13px] text-[rgba(60,60,67,0.6)]">
              You’ll be charged {formatCurrency(totalChargedCents, 'GHS')} including a 1.95% processing fee.
              {formatCurrency(amountCents, 'GHS')} is credited to your wallet.
            </p>
          )}
          <Button
            type="button"
            variant="maroon"
            size="lg"
            fullWidth
            loading={topupMutation.isPending}
            disabled={amountCents < 100}
            onClick={() => topupMutation.mutate()}
          >
            Continue
          </Button>
      </div>
    </CustomerLayout>
  );
}
