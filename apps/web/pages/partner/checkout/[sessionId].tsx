import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2, ShieldCheck } from 'lucide-react';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000/api'
).replace(/\/$/, '');

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
      if (data.authorizationUrl) {
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
      <div className="flex min-h-screen items-center justify-center bg-[#0f0a0a] pt-safe text-white">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0a0a] px-4 pt-safe text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 text-center">
          <p className="text-lg font-semibold">Checkout unavailable</p>
          <p className="mt-2 text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  const amount = ((session?.amountCents || 0) / 100).toFixed(2);
  const sellerName = [session?.escrow?.seller?.firstName, session?.escrow?.seller?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#1a0f0f] to-[#0f0a0a] px-4 pb-12 text-white"
      style={{ paddingTop: 'calc(3rem + var(--app-sat, env(safe-area-inset-top, 0px)))' }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-amber-400" />
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400/80">MYXCROW Escrow</p>
            <h1 className="text-xl font-bold">Secure checkout</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-xl">
          <p className="text-sm text-white/60">
            Paying via {session?.platform?.name || 'partner'} · Order {session?.externalOrderId}
          </p>
          {sellerName ? (
            <p className="mt-1 text-sm text-white/80">Merchant: {sellerName}</p>
          ) : null}
          <p className="mt-4 text-3xl font-bold tracking-tight">
            {session?.currency || 'GHS'} {amount}
          </p>
          {session?.escrow?.description ? (
            <p className="mt-2 text-sm text-white/70">{session.escrow.description}</p>
          ) : null}

          <label className="mt-6 block text-xs font-medium uppercase tracking-wide text-white/50">
            Email for receipt
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400/60"
            placeholder="you@email.com"
          />

          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

          <button
            type="button"
            disabled={paying}
            onClick={() => void pay()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay securely with MoMo / Card
          </button>

          <p className="mt-4 text-center text-xs text-white/45">
            Funds are held in MYXCROW escrow and released to the merchant after delivery or service
            completion.
          </p>
        </div>
      </div>
    </div>
  );
}
