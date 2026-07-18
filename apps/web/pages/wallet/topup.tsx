import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { form } from '@/lib/form-classes';

/** Paystack processing fee % passed to customer (must match backend) */
const PAYSTACK_FEE_PERCENT = 1.95;

export default function WalletTopupPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('100');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

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
      if (data?.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast.error('Could not get payment URL');
      }
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Failed to start top-up');
    },
  });

  if (!isAuthenticated()) return null;

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          eyebrow="Wallet"
          title="Top up wallet"
          subtitle="Add funds via Paystack (card, bank, mobile money)"
          icon={<Wallet className="w-6 h-6" />}
        />

        <div className={`${form.panel} space-y-4`}>
          <div>
            <label htmlFor="amount" className={form.label}>
              Amount to add to wallet (₵) *
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
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1 text-sm">
              <p className="text-white/90">
                Exact wallet credit: <span className="font-semibold text-brand-gold">{formatCurrency(amountCents, 'GHS')}</span>
              </p>
              <p className="text-white/70">
                Paystack processing fee (1.95%, added at checkout): <span className="font-semibold text-white">{formatCurrency(feeCents, 'GHS')}</span>
              </p>
              <p className="text-white/90 pt-1 border-t border-white/10">
                Total charged at checkout (wallet amount + fee): <span className="font-semibold text-white">{formatCurrency(totalChargedCents, 'GHS')}</span>
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="filled"
            size="lg"
            fullWidth
            loading={topupMutation.isPending}
            disabled={amountCents < 100}
            onClick={() => topupMutation.mutate()}
          >
            Continue to Paystack
          </Button>
        </div>
      </div>
    </Layout>
  );
}
