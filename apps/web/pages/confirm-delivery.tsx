import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publicForm } from '@/lib/form-classes';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export default function ConfirmDeliveryPage() {
  const [shortReference, setShortReference] = useState('');
  const [codeOrPin, setCodeOrPin] = useState('');
  const [usePin, setUsePin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setShortReference(ref.toUpperCase());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = shortReference.trim().toUpperCase();
    const value = codeOrPin.trim();
    if (!ref || !value) {
      setResult({ success: false, message: 'Please enter reference and code or PIN.' });
      return;
    }
    setLoading(true);
    setResult(null);
    const body = usePin
      ? { shortReference: ref, deliveryPin: value }
      : { shortReference: ref, deliveryCode: value.toUpperCase() };
    try {
      const res = await fetch(`${API_BASE}/delivery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setResult({ success: true, message: data.message || 'Delivery confirmed successfully.' });
        setShortReference('');
        setCodeOrPin('');
      } else {
        setResult({
          success: false,
          message: data.message || 'Invalid reference or code/PIN. Please try again.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirm Delivery - MYXCROW</title>
        <meta
          name="description"
          content="Enter the delivery reference and code or PIN to confirm delivery. Funds may auto-release when confirmed."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="mb-6 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">Delivery</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">Confirm delivery</h1>
            <p className="mt-1 text-sm text-white/55">
              Enter the reference and code or PIN from the parcel to confirm delivery before funds are released.
            </p>
          </div>
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ref" className={publicForm.labelCompact}>
                    Reference
                  </label>
                  <Input
                    id="ref"
                    tone="light"
                    type="text"
                    value={shortReference}
                    onChange={(e) => setShortReference(e.target.value.toUpperCase())}
                    placeholder="e.g. MV7K2A"
                    className="font-mono uppercase"
                    maxLength={6}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label htmlFor="codeOrPin" className={publicForm.labelCompact}>
                      {usePin ? 'Transaction PIN' : 'Delivery code'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUsePin((v) => !v)}
                      className="text-xs text-brand-maroon font-medium hover:underline"
                    >
                      Use {usePin ? 'code' : 'PIN'} instead
                    </button>
                  </div>
                  <Input
                    id="codeOrPin"
                    tone="light"
                    type={usePin ? 'password' : 'text'}
                    inputMode={usePin ? 'numeric' : 'text'}
                    value={codeOrPin}
                    onChange={(e) => setCodeOrPin(e.target.value)}
                    placeholder={usePin ? '4–8 digit PIN' : 'e.g. ABC123'}
                    className="font-mono"
                    maxLength={usePin ? 8 : 6}
                    autoComplete={usePin ? 'one-time-code' : 'off'}
                  />
                </div>
                {result && (
                  <div className={result.success ? publicForm.resultSuccess : publicForm.resultError}>
                    {result.message}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading || !shortReference.trim() || !codeOrPin.trim()}
                  loading={loading}
                  variant="maroon"
                  fullWidth
                  size="lg"
                >
                  Confirm Delivery
                </Button>
              </form>

              <p className={`mt-6 ${publicForm.hint}`}>
                The reference and code or PIN are on the parcel and in the buyer&apos;s and seller&apos;s escrow
                details. Entering them here confirms delivery; escrow funds are then released automatically.
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link href="/" className="text-brand-maroon font-semibold hover:underline">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
