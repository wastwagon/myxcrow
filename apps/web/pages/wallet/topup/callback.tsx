import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WalletTopupCallbackPage() {
  const router = useRouter();
  const { reference } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!reference || typeof reference !== 'string') {
      setStatus('error');
      setMessage('Missing payment reference.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await apiClient.get(`/payments/wallet/topup/verify/${reference}`);
        if (!cancelled) {
          setStatus('success');
          setMessage('Wallet topped up successfully.');
          setTimeout(() => router.replace('/wallet'), 2000);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStatus('error');
          const raw =
            e &&
            typeof e === 'object' &&
            'response' in e &&
            (e as { response?: { data?: { message?: string } } }).response?.data?.message;
          setMessage(typeof raw === 'string' ? raw : 'Verification failed.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <Layout>
      <div className="mx-auto max-w-md py-10">
        <div className="v2-fade-up overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/30 shadow-ios-card">
          <div className="border-b border-white/10 bg-gradient-to-r from-brand-maroon-black to-[#2a1818] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              Payment status
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">Wallet top-up</h1>
          </div>
          <div className="px-6 py-10 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-gold" />
                <p className="text-label-secondary">Verifying payment…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <p className="font-medium text-label-primary">{message}</p>
                <p className="mt-2 text-sm text-label-tertiary">Redirecting to wallet…</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
                <p className="font-medium text-label-primary">{message}</p>
                <Button variant="filled" className="mt-5" onClick={() => router.replace('/wallet')}>
                  Back to Wallet
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
