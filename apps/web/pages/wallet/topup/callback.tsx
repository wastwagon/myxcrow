import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

export default function WalletTopupCallbackPage() {
  const router = useRouter();
  const authed = useRequireAuth();
  const { reference } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!authed || !router.isReady) return;
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
  }, [reference, router, authed, router.isReady]);

  if (!authed) return <PageSpinner />;

  const verifying = !router.isReady || status === 'loading';

  return (
    <CustomerLayout title="Top up" back>
      <div className="py-10 text-center">
        <div className="rounded-[20px] bg-white p-8">
            {verifying && (
              <>
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-maroon" />
                <p className="text-[rgba(60,60,67,0.6)]">Verifying payment…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
                <p className="font-medium text-gray-900">{message}</p>
                <p className="mt-2 text-sm text-[rgba(60,60,67,0.6)]">Redirecting to wallet…</p>
                <ButtonLink href="/wallet" variant="maroon" className="mt-5">
                  View wallet
                </ButtonLink>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <p className="font-medium text-gray-900">{message}</p>
                <Button variant="maroon" className="mt-5" onClick={() => router.replace('/wallet')}>
                  Back to Wallet
                </Button>
              </>
            )}
        </div>
      </div>
    </CustomerLayout>
  );
}
