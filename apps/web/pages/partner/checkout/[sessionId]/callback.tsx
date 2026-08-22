import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/api-base';
import { isSafeHttpsRedirect } from '@/lib/safe-url';

const API_BASE = getApiBaseUrl();

export default function PartnerCheckoutCallbackPage() {
  const router = useRouter();
  const sessionId = typeof router.query.sessionId === 'string' ? router.query.sessionId : '';
  const reference = typeof router.query.reference === 'string' ? router.query.reference : '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying payment…');

  useEffect(() => {
    if (!sessionId || !reference) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/partner/checkout/${sessionId}/verify?reference=${encodeURIComponent(reference)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Verification failed');
        if (cancelled) return;
        setStatus('success');
        setMessage('Payment received. Returning to store…');
        if (data.redirectUrl && isSafeHttpsRedirect(data.redirectUrl)) {
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 1200);
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e?.message || 'Payment verification failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, reference]);

  return (
    <>
      <Head>
        <title>Payment status - MYXCROW</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f7] px-4">
        <div className="w-full max-w-md rounded-[20px] bg-white p-8 text-center">
          {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-maroon" />}
          {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-green-600" />}
          {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-red-500" />}
          <p className="mt-4 text-[17px] font-medium text-gray-900">{message}</p>
          {status === 'error' && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[20px] bg-brand-maroon px-5 text-[17px] font-semibold text-white touch-manipulation"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </>
  );
}
