import { useEffect, useState, type ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-base';
import { isPaystackCheckoutUrl } from '@/lib/safe-url';
import { publicForm } from '@/lib/form-classes';

const API_BASE = getApiBaseUrl();

function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>Secure checkout - MYXCROW</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div
        className="min-h-screen bg-[#f2f2f7] px-4 pb-12"
        style={{ paddingTop: 'calc(2rem + var(--app-sat, env(safe-area-inset-top, 0px)))' }}
      >
        <div className="mx-auto max-w-md">{children}</div>
      </div>
    </>
  );
}

/**
 * Hosted partner checkout — buyer pays on MYXCROW, then returns to commerce platform.
 */
export default function PartnerCheckoutPage() {
  const router = useRouter();
  const sessionId = typeof router.query.sessionId === 'string' ? router.query.sessionId : '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{
    amountCents: number;
    currency: string;
    externalOrderId: string;
    platform?: { name: string };
    escrow?: { description: string | null; seller?: { firstName: string | null; lastName: string | null } };
    buyerEmail?: string | null;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/partner/checkout/${sessionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Session not found');
        if (!cancelled) {
          setSession(data);
          if (data.buyerEmail) setEmail(data.buyerEmail);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load checkout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function pay() {
    if (!sessionId) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/partner/checkout/${sessionId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Could not start payment');
      if (data.authorizationUrl && isPaystackCheckoutUrl(data.authorizationUrl)) {
        window.location.href = data.authorizationUrl;
        return;
      }
      throw new Error('No payment URL returned');
    } catch (e: any) {
      setError(e?.message || 'Payment failed');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <CheckoutShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-maroon" />
        </div>
      </CheckoutShell>
    );
  }

  if (error && !session) {
    return (
      <CheckoutShell>
        <div className="rounded-[12px] bg-white p-8 text-center">
          <p className="text-[22px] font-bold text-gray-900">Checkout unavailable</p>
          <p className="mt-2 text-[15px] text-[rgba(60,60,67,0.6)]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-brand-maroon px-5 text-[17px] font-semibold text-white touch-manipulation"
          >
            Try again
          </button>
        </div>
      </CheckoutShell>
    );
  }

  const amount = ((session?.amountCents || 0) / 100).toFixed(2);
  const sellerName = [session?.escrow?.seller?.firstName, session?.escrow?.seller?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <CheckoutShell>
      <div className="mb-5 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-brand-maroon" />
        <div>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">MYXCROW escrow</p>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Secure checkout</h1>
        </div>
      </div>

      <div className="rounded-[12px] bg-white p-5 sm:p-6">
        <p className="text-[13px] text-[rgba(60,60,67,0.6)]">
          Paying via {session?.platform?.name || 'partner'} · Order {session?.externalOrderId}
        </p>
        {sellerName ? (
          <p className="mt-1 text-[15px] text-gray-900">Merchant: {sellerName}</p>
        ) : null}
        <p className="mt-4 text-[34px] font-bold tracking-tight leading-none text-gray-900">
          {session?.currency || 'GHS'} {amount}
        </p>
        {session?.escrow?.description ? (
          <p className="mt-2 text-[15px] text-[rgba(60,60,67,0.6)]">{session.escrow.description}</p>
        ) : null}

        <label htmlFor="checkout-email" className={`${publicForm.labelCompact} mt-6`}>
          Email for receipt
        </label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={publicForm.inputTouch}
          placeholder="you@email.com"
          autoComplete="email"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={paying}
          onClick={() => void pay()}
          className="mt-6 flex w-full min-h-[50px] items-center justify-center gap-2 rounded-[12px] bg-brand-maroon px-4 py-3 text-[17px] font-semibold text-white touch-manipulation disabled:opacity-60"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Pay securely with MoMo / Card
        </button>

        <p className="mt-4 text-center text-[13px] text-[rgba(60,60,67,0.6)]">
          Funds are held in MYXCROW escrow and released to the merchant after delivery or service
          completion.
        </p>
      </div>
    </CheckoutShell>
  );
}
