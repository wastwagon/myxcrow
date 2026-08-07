import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000/api'
).replace(/\/$/, '');

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
        if (data.redirectUrl) {
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
    <div className="flex min-h-screen items-center justify-center bg-[#0f0a0a] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 text-center">
        {status === 'loading' && <Loader2 className="mx-auto h-12 w-12 animate-spin text-amber-400" />}
        {status === 'success' && <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />}
        {status === 'error' && <XCircle className="mx-auto h-12 w-12 text-red-400" />}
        <p className="mt-4 font-medium">{message}</p>
      </div>
    </div>
  );
}
