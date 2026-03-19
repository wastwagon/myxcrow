import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CheckCircle2, Copy, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function EscrowCreatedPage() {
  const router = useRouter();
  const { id } = router.query;
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  useEffect(() => {
    if (!id || typeof window === 'undefined') return;
    const key = `newEscrowPin:${id}`;
    const pin = sessionStorage.getItem(key);
    if (pin) {
      setGeneratedPin(pin);
      // Show once on confirmation page, then remove from session storage.
      sessionStorage.removeItem(key);
    }
  }, [id]);

  const { data: escrow } = useQuery({
    queryKey: ['escrow', id],
    queryFn: async () => (await apiClient.get(`/escrows/${id}`)).data,
    enabled: !!id,
  });

  const amountText = useMemo(() => {
    if (!escrow?.amountCents) return null;
    return formatCurrency(escrow.amountCents, escrow.currency || 'GHS');
  }, [escrow]);

  if (!isAuthenticated()) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Escrow Created</h1>
              <p className="text-white/80 mt-1">Your escrow is ready. Next step is funding from wallet.</p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60">Escrow ID</p>
              <p className="text-white font-medium break-all">{id}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60">Amount</p>
              <p className="text-white font-medium">{amountText || '—'}</p>
            </div>
          </div>

          {generatedPin && (
            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold mb-1">
                <Shield className="w-4 h-4" />
                Delivery PIN (auto-generated)
              </div>
              <p className="text-sm text-amber-800 mb-2">
                This PIN confirms the rightful owner at delivery before auto-release. Save it now.
              </p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-lg font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded">{generatedPin}</code>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedPin);
                    toast.success('PIN copied');
                  }}
                  className="px-3 py-1.5 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                >
                  <Copy className="w-4 h-4 inline mr-1" />
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/escrows/${id}`}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-brand-gold text-brand-maroon-black font-semibold text-center hover:bg-brand-gold/90"
            >
              View Escrow Details
            </Link>
            <Link
              href="/escrows"
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-center hover:bg-white/5"
            >
              Go to Escrows List
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
