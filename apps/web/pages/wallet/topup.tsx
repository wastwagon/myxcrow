import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

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
  const creditCents = amountCents - feeCents;

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
        <button
          onClick={() => router.back()}
          className="text-brand-gold hover:text-brand-gold/80 font-medium transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">Top Up Wallet</h1>
        <p className="text-white/80">Add funds via Paystack (card, bank, mobile money).</p>

        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl p-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-white/90 mb-1">
              Amount to pay (₵) *
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[48px] px-4 py-3 border-2 border-white/20 rounded-xl bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
            />
          </div>
          {amountCents >= 100 && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1 text-sm">
              <p className="text-white/70">
                Paystack processing fee (1.95%): <span className="font-semibold text-white">{formatCurrency(feeCents, 'GHS')}</span>
              </p>
              <p className="text-white/90">
                You will receive: <span className="font-semibold text-brand-gold">{formatCurrency(creditCents, 'GHS')}</span>
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => topupMutation.mutate()}
            disabled={topupMutation.isPending || amountCents < 100}
            className="w-full min-h-[48px] py-3 px-6 bg-gradient-to-r from-brand-gold to-amber-600 text-brand-maroon-black rounded-xl hover:from-brand-gold/90 hover:to-amber-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all touch-manipulation"
          >
            {topupMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting…
              </>
            ) : (
              'Continue to Paystack'
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
