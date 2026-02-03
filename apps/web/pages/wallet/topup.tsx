import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WalletTopupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>('100');

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const topupMutation = useMutation({
    mutationFn: async () => {
      const user = getUser();
      const amountCents = Math.round(parseFloat(amount || '0') * 100);
      if (amountCents < 100) throw new Error('Amount must be at least 1.00 GHS');
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
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Top Up Wallet</h1>
        <p className="text-gray-600">Add funds via Paystack (card, bank, mobile money).</p>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (GHS) *
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => topupMutation.mutate()}
            disabled={topupMutation.isPending}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
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
