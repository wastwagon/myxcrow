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
import EscrowFeeSummary from '@/components/EscrowFeeSummary';
import { ESCROW_CATEGORY } from '@/lib/escrow-services';
import { buildEscrowReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';

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
      sessionStorage.removeItem(key);
    }
  }, [id]);

  const { data: escrow } = useQuery({
    queryKey: ['escrow', id],
    queryFn: async () => (await apiClient.get(`/escrows/${id}`)).data,
    enabled: !!id,
  });

  const isFunded = escrow?.status === 'FUNDED';
  const isProfessional = escrow?.escrowCategory === ESCROW_CATEGORY.PROFESSIONAL_SERVICE;

  const amountText = useMemo(() => {
    if (!escrow?.amountCents) return null;
    return formatCurrency(escrow.amountCents, escrow.currency || 'GHS');
  }, [escrow]);

  const feeSummary = useMemo(() => {
    if (!escrow?.amountCents) return null;
    return {
      amountCents: escrow.amountCents,
      feeCents: escrow.feeCents ?? 0,
      feePercentage: escrow.feePercentage ?? 0,
      buyerFeeCents: escrow.buyerFeeCents ?? 0,
      sellerFeeCents: escrow.sellerFeeCents ?? escrow.feeCents ?? 0,
      fundingAmountCents: escrow.fundingAmountCents || escrow.amountCents,
      netAmountCents: escrow.netAmountCents ?? escrow.amountCents,
      paidBy: escrow.feePaidBy || 'seller',
    };
  }, [escrow]);

  const fundAmountText = useMemo(() => {
    if (!feeSummary) return amountText;
    return formatCurrency(feeSummary.fundingAmountCents, escrow?.currency || 'GHS');
  }, [feeSummary, amountText, escrow?.currency]);

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
              <h1 className="text-3xl font-bold text-white">
                {isFunded ? 'Escrow created & funded' : 'Escrow created'}
              </h1>
              <p className="text-white/80 mt-1">
                {isFunded
                  ? isProfessional
                    ? 'Funds are secured. The seller can start the service.'
                    : 'Funds are secured. The seller can ship when ready.'
                  : 'Complete wallet funding from escrow details to activate this deal.'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 sm:col-span-2">
              <p className="text-white/60">Escrow ID</p>
              <p className="text-white font-medium break-all">{id}</p>
            </div>
            {escrow?.serviceType && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 sm:col-span-2">
                <p className="text-white/60">Service</p>
                <p className="text-white font-medium">{escrow.serviceType}</p>
              </div>
            )}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60">Deal amount</p>
              <p className="text-white font-medium">{amountText || '—'}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/60">{isFunded ? 'Funded from wallet' : 'Amount to fund'}</p>
              <p className="text-white font-medium">{fundAmountText || '—'}</p>
            </div>
          </div>

          {feeSummary && feeSummary.feeCents > 0 && (
            <div className="mt-4">
              <EscrowFeeSummary fees={feeSummary} />
            </div>
          )}

          {generatedPin && (
            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-semibold mb-1">
                <Shield className="w-4 h-4" />
                Delivery PIN (auto-generated)
              </div>
              <p className="text-sm text-amber-800 mb-2">
                This PIN confirms delivery before auto-release. It is also saved on your escrow details page.
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
            {escrow && (
              <PrintReceiptButton
                receipt={buildEscrowReceipt(escrow, { viewerRole: 'buyer' })}
                className="sm:flex-none"
                variant="secondary"
              />
            )}
            <Link
              href={`/escrows/${id}`}
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-brand-gold text-brand-maroon-black font-semibold text-center hover:bg-brand-gold/90"
            >
              View escrow details
            </Link>
            <Link
              href="/escrows"
              className="flex-1 min-h-[48px] px-6 py-3 rounded-xl border border-white/20 text-white font-semibold text-center hover:bg-white/5"
            >
              Go to escrows list
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
