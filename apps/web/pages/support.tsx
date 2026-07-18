import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import PublicHeader from '@/components/PublicHeader';
import { publicForm } from '@/lib/form-classes';
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

  const topics = [
    { icon: Shield, title: 'Escrow & payments', body: 'Creating escrows, funding, milestones, release, and refunds.' },
    { icon: Wallet, title: 'Wallet & withdrawals', body: 'Top-up via Paystack, balance, and withdrawal requests.' },
    { icon: AlertCircle, title: 'Disputes', body: 'Opening a dispute, evidence, and resolution process.' },
    { icon: FileText, title: 'Account & KYC', body: 'Registration, verification, password, and account settings.' },
  ] as const;

  return (
    <>
      <Head>
        <title>Support - MYXCROW</title>
        <meta
          name="description"
          content="Get help with MYXCROW escrow. Contact support via chat or email. FAQs on fees, escrow, wallet, disputes, and account."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
          <section className="relative mb-6 min-h-[170px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
            <Image
              src="/images/v2/diaspora.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-[center_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
            <div className="relative z-10 flex min-h-[170px] flex-col justify-end p-5 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/90">Help center</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-white">Support</h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/75">
                We’re here to help with escrows, payments, account issues, and disputes.
              </p>
            </div>
          </section>

          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <section className="mb-10">
                <h2 className={publicForm.sectionTitle}>
                  <MessageCircle className="w-5 h-5 text-brand-gold" />
                  How to contact us
                </h2>
                <ul className={publicForm.bodyList}>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-gold mt-0.5">•</span>
                    <span>
                      <strong>Live chat:</strong> Use the chat widget in the bottom-right corner of the
                      site. Fastest for quick questions and account-specific issues.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-brand-gold mt-0.5">•</span>
                    <span>
                      <strong>Email:</strong> If chat isn’t available, email us from your registered
                      account so we can identify you. Include your escrow ID when the issue is about a
                      transaction.
                    </span>
                  </li>
                </ul>
                <div className={publicForm.tipCallout}>
                  <strong>Tip:</strong> When reporting an issue, include your <strong>escrow ID</strong>{' '}
                  (from the escrow page or URL) and any <strong>screenshots</strong>. This helps us resolve
                  things faster.
                </div>
              </section>

              <section className="mb-10">
                <h2 className={publicForm.sectionTitle}>
                  <HelpCircle className="w-5 h-5 text-brand-gold" />
                  Quick help topics
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {topics.map(({ icon: Icon, title, body }) => (
                    <div key={title} className={publicForm.topicCard}>
                      <Icon className="w-5 h-5 text-brand-maroon mb-2" />
                      <h3 className={publicForm.topicCardTitle}>{title}</h3>
                      <p className={publicForm.topicCardBody}>{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <h2 className={publicForm.sectionTitle}>
                  <HelpCircle className="w-5 h-5 text-brand-gold" />
                  Frequently asked questions
                </h2>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, id) => {
                    const isOpen = openFaqId === id;
                    return (
                      <div key={id} className={publicForm.faqItem}>
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : id)}
                          className={publicForm.faqButton}
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronDown className="w-5 h-5 shrink-0 text-brand-gold" />
                          ) : (
                            <ChevronRight className={publicForm.faqChevronMuted} />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-0">
                            <p className={publicForm.faqAnswer}>{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={publicForm.sectionDivider}>
                <p className={`${publicForm.footerText} mb-4`}>
                  See our{' '}
                  <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  for full legal and data protection information.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/terms" className="text-brand-maroon font-semibold hover:underline text-sm">
                    Terms
                  </Link>
                  <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline text-sm">
                    Privacy
                  </Link>
                  <Link href="/" className="text-brand-maroon font-semibold hover:underline text-sm">
                    Home
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
