import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e.response?.data?.message || 'Verification failed.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-12">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying payment…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to wallet…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">{message}</p>
            <button
              onClick={() => router.replace('/wallet')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Wallet
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
