import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import { MessageCircle, HelpCircle, ChevronDown, ChevronRight, Shield, Wallet, FileText, AlertCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How are my funds protected?',
    a: 'MYXCROW holds funds in a secure escrow account. Money is released only when both buyer and seller confirm the transaction is complete. If there is a dispute, our team mediates before any release.',
  },
  {
    q: 'What fees do you charge?',
    a: 'We charge a small percentage fee on each successful transaction. There are no monthly subscriptions or hidden charges. The exact fee is shown before you confirm an escrow. See our Terms for full details.',
  },
  {
    q: 'Is MYXCROW available in Ghana?',
    a: 'Yes. MYXCROW is built for Ghana and operates in Ghana Cedis (₵). It is suitable for local and diaspora transactions, including real estate, goods, and services.',
  },
  {
    q: 'How do I start an escrow?',
    a: 'Register, complete KYC verification, then create a new escrow. Add the other party (buyer or seller), set the amount and terms, and fund the escrow. The other party receives instructions to complete their part.',
  },
  {
    q: 'How do I fund my wallet?',
    a: 'Go to Wallet → Top up. You can add funds via Paystack (card or mobile money). Once payment is confirmed, the amount is credited to your wallet and you can use it to fund escrows.',
  },
  {
    q: 'How long does withdrawal take?',
    a: 'Withdrawal requests are reviewed by our team. Once approved, funds are sent to your registered bank or mobile money account. Typical processing is within 1–3 business days. You can check status in Wallet → Withdraw.',
  },
  {
    q: 'What if I have a dispute with the other party?',
    a: 'Open a dispute from the escrow page. Add a reason and any evidence (e.g. photos, messages). Our team will review and may mediate. Funds remain held until the dispute is resolved (e.g. release to seller or refund to buyer).',
  },
  {
    q: 'How do I verify my identity (KYC)?',
    a: 'During registration you upload your Ghana Card (front and back) and a selfie. We verify these and may request additional documents. Once verified, you can create and fund escrows. Check your KYC status in Profile.',
  },
  {
    q: 'I forgot my password. How do I reset it?',
    a: 'On the login page, click “Forgot password?” and enter your email or phone. We’ll send you a reset link or code. Use it to set a new password. If you don’t receive it, check spam or contact support.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes. In Profile → Security, use “Delete my account”. You’ll need to enter your password. Account data is anonymized and you will be signed out. This cannot be undone.',
  },
];

export default function SupportPage() {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>Support - MYXCROW</title>
        <meta name="description" content="Get help with MYXCROW escrow. Contact support via chat or email. FAQs on fees, escrow, wallet, disputes, and account." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-3xl md:text-4xl font-bold text-brand-maroon-black mb-2">Support</h1>
              <p className="text-gray-600 mb-8">
                We’re here to help with escrows, payments, account issues, and disputes. Use the options below or contact us directly.
              </p>

              {/* Contact options */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-brand-maroon-black mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-brand-gold" />
                  How to contact us
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-brand-gold mt-0.5">•</span>
                    <span><strong>Live chat:</strong> Use the chat widget in the bottom-right corner of the site. Fastest for quick questions and account-specific issues.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-gold mt-0.5">•</span>
                    <span><strong>Email:</strong> If chat isn’t available, email us from your registered account so we can identify you. Include your escrow ID when the issue is about a transaction.</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-sm text-brand-maroon-black">
                  <strong>Tip:</strong> When reporting an issue, include your <strong>escrow ID</strong> (from the escrow page or URL) and any <strong>screenshots</strong>. This helps us resolve things faster.
                </div>
              </section>

              {/* Quick help topics */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-brand-maroon-black mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-gold" />
                  Quick help topics
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <Shield className="w-5 h-5 text-brand-maroon mb-2" />
                    <h3 className="font-semibold text-brand-maroon-black mb-1">Escrow & payments</h3>
                    <p className="text-sm text-gray-600">Creating escrows, funding, milestones, release, and refunds.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <Wallet className="w-5 h-5 text-brand-maroon mb-2" />
                    <h3 className="font-semibold text-brand-maroon-black mb-1">Wallet & withdrawals</h3>
                    <p className="text-sm text-gray-600">Top-up via Paystack, balance, and withdrawal requests.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <AlertCircle className="w-5 h-5 text-brand-maroon mb-2" />
                    <h3 className="font-semibold text-brand-maroon-black mb-1">Disputes</h3>
                    <p className="text-sm text-gray-600">Opening a dispute, evidence, and resolution process.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                    <FileText className="w-5 h-5 text-brand-maroon mb-2" />
                    <h3 className="font-semibold text-brand-maroon-black mb-1">Account & KYC</h3>
                    <p className="text-sm text-gray-600">Registration, verification, password, and account settings.</p>
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-brand-maroon-black mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-gold" />
                  Frequently asked questions
                </h2>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, id) => {
                    const isOpen = openFaqId === id;
                    return (
                      <div
                        key={id}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : id)}
                          className="w-full flex items-center justify-between gap-4 p-4 text-left font-medium text-brand-maroon-black hover:bg-gray-50 transition-colors"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronDown className="w-5 h-5 shrink-0 text-brand-gold" />
                          ) : (
                            <ChevronRight className="w-5 h-5 shrink-0 text-gray-400" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0">
                            <p className="text-gray-600 text-sm leading-relaxed pl-0">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Legal */}
              <section className="pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-4">
                  See our{' '}
                  <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>
                  {' '}for full legal and data protection information.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/terms" className="text-brand-maroon font-semibold hover:underline text-sm">Terms</Link>
                  <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline text-sm">Privacy</Link>
                  <Link href="/" className="text-brand-maroon font-semibold hover:underline text-sm">Home</Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
