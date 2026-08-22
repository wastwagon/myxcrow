import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import apiClient from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';

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
    <CustomerLayout title="Payment" back>
      <div className="py-10 text-center">
        <div className="rounded-[20px] bg-white p-8">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand-maroon" />
                <p className="text-[rgba(60,60,67,0.6)]">Verifying payment…</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
                <p className="font-medium text-gray-900">{message}</p>
                <p className="mt-2 text-sm text-[rgba(60,60,67,0.6)]">Redirecting to escrow…</p>
                <ButtonLink
                  href={escrowId ? `/escrows/${escrowId}` : '/escrows'}
                  variant="maroon"
                  className="mt-5"
                >
                  View escrow
                </ButtonLink>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <p className="font-medium text-gray-900">{message}</p>
                <Button
                  variant="maroon"
                  className="mt-5"
                  onClick={() => router.replace(escrowId ? `/escrows/${escrowId}` : '/escrows')}
                >
                  Back to Escrows
                </Button>
              </>
            )}
        </div>
      </div>
    </CustomerLayout>
  );
}
