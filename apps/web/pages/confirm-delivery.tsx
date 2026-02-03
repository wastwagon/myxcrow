import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export default function ConfirmDeliveryPage() {
  const [shortReference, setShortReference] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
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
    const code = deliveryCode.trim().toUpperCase();
    if (!ref || !code) {
      setResult({ success: false, message: 'Please enter both reference and code.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/delivery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortReference: ref, deliveryCode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setResult({ success: true, message: 'Delivery confirmed successfully.' });
        setShortReference('');
        setDeliveryCode('');
      } else {
        setResult({ success: false, message: data.message || 'Invalid reference or code. Please try again.' });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirm Delivery - MYXCROW</title>
        <meta name="description" content="Enter the delivery reference and code to confirm delivery. Only the recipient and delivery person use this page." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-2xl font-bold text-brand-maroon-black mb-2">Confirm Delivery</h1>
              <p className="text-sm text-gray-600 mb-6">
                Enter the <strong>reference</strong> and <strong>code</strong> you received from the recipient. This confirms that the item was delivered (signature validation).
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ref" className="block text-sm font-semibold text-gray-700 mb-1">Reference</label>
                  <input
                    id="ref"
                    type="text"
                    value={shortReference}
                    onChange={(e) => setShortReference(e.target.value.toUpperCase())}
                    placeholder="e.g. MV7K2A"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1">Delivery code</label>
                  <input
                    id="code"
                    type="text"
                    value={deliveryCode}
                    onChange={(e) => setDeliveryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none"
                    maxLength={6}
                  />
                </div>
                {result && (
                  <div className={`p-4 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {result.message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !shortReference.trim() || !deliveryCode.trim()}
                  className="w-full py-3 px-6 bg-brand-maroon text-white rounded-xl hover:bg-brand-maroon-dark focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Confirming...' : 'Confirm Delivery'}
                </button>
              </form>

              <p className="mt-6 text-xs text-gray-500">
                Only the recipient (buyer) and the system know the code. The delivery person gets the reference and code from the recipient and enters them here to confirm delivery.
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link href="/" className="text-brand-maroon font-semibold hover:underline">← Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
