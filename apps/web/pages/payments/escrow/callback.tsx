import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EscrowPaymentCallbackPage() {
  const router = useRouter();
  const { reference } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [escrowId, setEscrowId] = useState<string | null>(null);

  useEffect(() => {
    if (!reference || typeof reference !== 'string') {
      setStatus('error');
      setMessage('Missing payment reference.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get(`/payments/escrow/verify/${reference}`);
        if (!cancelled) {
          setStatus('success');
          setMessage('Escrow funded successfully.');
          const escrowIdFromRef = reference.split('_')[1];
          if (escrowIdFromRef) setEscrowId(escrowIdFromRef);
          setTimeout(
            () => router.replace(escrowIdFromRef ? `/escrows/${escrowIdFromRef}` : '/escrows'),
            2000
          );
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStatus('error');
          const raw =
            e &&
            typeof e === 'object' &&
            'response' in e &&
            (e as { response?: { data?: { message?: string } } }).response?.data?.message;
          setMessage(typeof raw === 'string' ? raw : 'Payment verification failed.');
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
            <Loader2 className="w-12 h-12 text-brand-gold animate-spin mx-auto mb-4" />
            <p className="text-label-secondary">Verifying payment…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-label-primary font-medium">{message}</p>
            <p className="text-sm text-label-tertiary mt-2">Redirecting to escrow…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-label-primary font-medium">{message}</p>
            <Button variant="filled" className="mt-4" onClick={() => router.replace('/escrows')}>
              Back to Escrows
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
