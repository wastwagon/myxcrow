import { useEffect, useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CheckCircle2, Copy, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import EscrowFeeSummary from '@/components/EscrowFeeSummary';
import { Banner } from '@/components/ui/Banner';
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
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">Success</p>
          <div className="mt-3 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {isFunded ? 'Escrow created & funded' : 'Escrow created'}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {isFunded
                  ? isProfessional
                    ? 'Funds are secured. The seller can start the service.'
                    : 'Funds are secured. The seller can ship when ready.'
                  : 'Complete wallet funding from escrow details to activate this deal.'}
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-6 md:p-8 shadow-ios-card">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 sm:col-span-2">
              <p className="text-white/60">Escrow ID</p>
              <p className="text-white font-medium break-all">{id}</p>
            </div>
            {escrow?.serviceType && (
              <div className="rounded-ios-lg bg-white/5 border border-white/10 p-4 sm:col-span-2">
                <p className="text-white/60">Service</p>
                <p className="text-white font-medium">{escrow.serviceType}</p>
              </div>
            )}
            <div className="rounded-ios-lg bg-white/5 border border-white/10 p-4">
              <p className="text-white/60">Deal amount</p>
              <p className="text-white font-medium">{amountText || '—'}</p>
            </div>
            <div className="rounded-ios-lg bg-white/5 border border-white/10 p-4">
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
            <Banner
              tone="warning"
              title="Delivery PIN (auto-generated)"
              icon={<Shield className="w-5 h-5" />}
              className="mt-6"
            >
              <p className="mb-3">
                This PIN confirms delivery before auto-release. It is also saved on your escrow details page.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-lg font-bold text-label-primary bg-black/20 px-3 py-1 rounded-ios">
                  {generatedPin}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedPin);
                    toast.success('PIN copied');
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </Banner>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {escrow && (
              <PrintReceiptButton
                receipt={buildEscrowReceipt(escrow, { viewerRole: 'buyer' })}
                className="sm:flex-none"
                variant="secondary"
              />
            )}
            <ButtonLink href={`/escrows/${id}`} className="flex-1">
              View escrow details
            </ButtonLink>
            <ButtonLink href="/escrows" variant="secondary" className="flex-1">
              Go to escrows list
            </ButtonLink>
          </div>
        </div>
      </div>
    </Layout>
  );
}
