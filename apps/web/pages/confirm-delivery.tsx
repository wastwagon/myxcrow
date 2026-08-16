import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publicForm } from '@/lib/form-classes';
import PublicPage from '@/components/PublicPage';

import { getApiBaseUrl } from '@/lib/api-base';

const API_BASE = getApiBaseUrl();

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
    <PublicPage
      title="Confirm delivery"
      subtitle="Enter the reference and code or PIN from the parcel before funds are released."
      maxWidthClass="max-w-md"
      documentTitle="Confirm Delivery - MYXCROW"
      description="Enter the delivery reference and code or PIN to confirm delivery. Funds may auto-release when confirmed."
    >
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
              className="inline-flex min-h-[44px] items-center text-[15px] text-brand-maroon font-semibold touch-manipulation"
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
          Confirm delivery
        </Button>
      </form>

      <p className={`mt-6 ${publicForm.hint}`}>
        The reference and code or PIN are on the parcel and in the buyer&apos;s and seller&apos;s escrow
        details. Entering them here confirms delivery; escrow funds are then released automatically.
      </p>

      <div className="mt-8 pt-6 border-t border-[rgba(60,60,67,0.12)]">
        <Link href="/" className="inline-flex min-h-[44px] items-center text-brand-maroon font-semibold touch-manipulation">
          Home
        </Link>
      </div>
    </PublicPage>
  );
}
