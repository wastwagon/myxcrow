import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Shield, Lock, Zap, Users, ArrowRight, CheckCircle2, MapPin, X, ChevronRight } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';

const HOW_IT_WORKS = [
  { step: 1, title: 'Agree on terms', desc: 'Buyer and seller agree on the amount, goods or services, and delivery terms before starting.' },
  { step: 2, title: 'Buyer funds escrow', desc: 'Buyer pays into a secure MYXCROW escrow. Funds are held until both parties fulfil their obligations.' },
  { step: 3, title: 'Seller delivers', desc: 'Seller ships goods or completes the service according to the agreed terms.' },
  { step: 4, title: 'Buyer confirms', desc: 'Buyer inspects delivery and confirms satisfaction, or raises a dispute if needed.' },
  { step: 5, title: 'Release payment', desc: 'MYXCROW releases funds to the seller once the buyer approves. Transaction complete.' },
];

const USE_CASES = [
  { title: 'Diaspora & remittances', desc: 'Build or invest from abroad. Milestone-based releases keep your projects on track.', icon: MapPin },
  { title: 'Local transactions', desc: 'Buy property, vehicles, or high-value goods. Funds held until both parties are satisfied.', icon: Shield },
  { title: 'Real estate & contracts', desc: 'Close deals with confidence. Funds released only when all obligations are fulfilled.', icon: Lock },
  { title: 'Goods & services', desc: 'Protect buyers and sellers. No lost payments, no undelivered orders.', icon: Zap },
];

const FAQ_ITEMS = [
  { q: 'How are my funds protected?', a: 'MYXCROW holds funds in a secure escrow account. Money is released only when both buyer and seller confirm the transaction is complete. If there is a dispute, our team mediates before any release.' },
  { q: 'What fees do you charge?', a: 'We charge a small percentage fee on each successful transaction. There are no monthly subscriptions or hidden charges. The exact fee is shown before you confirm an escrow. See our Terms for full details.' },
  { q: 'Is MYXCROW available in Ghana?', a: 'Yes. MYXCROW is built for Ghana and operates in Ghana Cedis (₵). It is suitable for local and diaspora transactions, including real estate, goods, and services.' },
  { q: 'How do I start an escrow?', a: 'Register, complete KYC verification, then create a new escrow. Add the other party (buyer or seller), set the amount and terms, and fund the escrow. The other party receives instructions to complete their part.' },
];

export default function Home() {
  const router = useRouter();
  const [faqModal, setFaqModal] = useState<typeof FAQ_ITEMS[0] | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const isLocal = process.env.NEXT_PUBLIC_ENV === 'local';

  const features = [
    { icon: Shield, title: 'Secure Escrow', description: 'Your funds are held safely until transaction completion', color: 'blue' },
    { icon: Lock, title: 'Protected Payments', description: 'Advanced encryption and fraud protection', color: 'green' },
    { icon: Zap, title: 'Fast Processing', description: 'Quick verification and instant notifications', color: 'yellow' },
    { icon: Users, title: 'Trusted Platform', description: 'KYC-verified users and reputation system', color: 'purple' },
  ];

  return (
    <>
      <Head>
        <title>MYXCROW - Secure Escrow for Ghana | Safe Transactions in Ghana Cedis</title>
        <meta name="description" content="Trusted escrow services in Ghana. Protect payments for diaspora, real estate, goods &amp; services. Secure, transparent, Ghana Cedis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="MYXCROW - Secure Escrow for Ghana" />
        <meta property="og:description" content="Trusted escrow services in Ghana. Protect payments for diaspora, real estate, goods &amp; services. Ghana Cedis." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo/MYXCROWLOGO.png" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        {isLocal && (
          <div className="bg-brand-gold text-brand-maroon-black px-4 py-2 text-center text-sm font-medium">
            🚧 Running in LOCAL development mode
          </div>
        )}

        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero – logo retained for brand recognition; copy streamlined, no duplication */}
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-4">
                <MapPin className="w-3.5 h-3.5" />
                Trusted escrow for Ghana
              </div>
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl mb-4 md:mb-6 shadow-lg overflow-hidden bg-brand-maroon-deep ring-2 ring-brand-gold/30">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={80} height={80} className="object-contain w-full h-full" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 md:mb-4 tracking-tight">
                MYXCROW
              </h1>
              <p className="text-base md:text-2xl text-brand-gold font-medium mb-2 md:mb-3">
                Secure Escrow Services
              </p>
              <p className="text-sm md:text-lg text-white/80 max-w-2xl mx-auto">
                For the home you&apos;re building from afar, or the deal you&apos;re closing in Accra. Funds held safely until both sides are satisfied.
              </p>
            </div>

            {/* Trust badges + social proof */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Ghana-based', sub: 'Built for Ghana Cedis' },
                { label: 'KYC verified', sub: 'Identity-checked users' },
                { label: 'Secure', sub: 'Encrypted & protected' },
                { label: 'No chargebacks', sub: 'Funds released on approval' },
              ].map((badge) => (
                <div key={badge.label} className="bg-white/95 rounded-xl px-4 py-3 md:py-4 border border-brand-gold/20 text-center">
                  <p className="text-sm font-semibold text-brand-maroon-black">{badge.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{badge.sub}</p>
                </div>
              ))}
            </div>

            {/* How it works – modern premium, no background, minimal */}
            <section className="mb-16 md:mb-20" aria-labelledby="how-it-works-heading">
              <h2 id="how-it-works-heading" className="text-2xl md:text-4xl font-bold text-white mb-10 md:mb-14 text-center tracking-tight">
                How it works
              </h2>
              <div className="grid grid-cols-2 gap-6 md:gap-8 md:grid-cols-5">
                {HOW_IT_WORKS.map((item) => (
                  <div
                    key={item.step}
                    className="group relative flex flex-col items-center text-center"
                  >
                    {/* Step number – minimal, premium */}
                    <div className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-brand-gold/80 text-brand-gold font-semibold text-sm md:text-base mb-4 group-hover:border-brand-gold group-hover:bg-brand-gold/10 transition-colors">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-white text-base md:text-lg mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/75 leading-relaxed max-w-xs">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Use cases */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Built for your transactions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {USE_CASES.map((uc) => {
                  const Icon = uc.icon;
                  return (
                    <div key={uc.title} className="bg-white/95 rounded-xl p-6 border border-brand-gold/20 hover:border-brand-gold/40 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-brand-maroon/20 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-brand-maroon" />
                      </div>
                      <h3 className="font-semibold text-brand-maroon-black mb-2">{uc.title}</h3>
                      <p className="text-sm text-gray-600">{uc.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colorClasses = {
                  blue: 'from-brand-maroon to-brand-maroon-dark',
                  green: 'from-brand-maroon-dark to-brand-maroon-darker',
                  yellow: 'from-brand-gold to-primary-600',
                  purple: 'from-brand-maroon-rust to-brand-maroon-dark',
                };
                return (
                  <div
                    key={index}
                    className="bg-white/95 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-brand-gold/20"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-maroon-black mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Pricing transparency */}
            <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 mb-12 border border-brand-gold/20">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-maroon-black mb-4 text-center">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600 text-center max-w-2xl mx-auto mb-6">
                A small percentage fee on each successful transaction. No subscriptions, no hidden charges. Fees are shown before you confirm. See our <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms</Link> for details.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  No monthly fees
                </span>
                <span className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Pay only when you transact
                </span>
                <span className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Fees shown upfront
                </span>
              </div>
            </div>

            {/* FAQ – premium cards with pop-up modal */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Frequently asked questions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {FAQ_ITEMS.map((faq) => (
                  <button
                    key={faq.q}
                    type="button"
                    onClick={() => setFaqModal(faq)}
                    className="min-h-[48px] bg-white/95 rounded-xl p-5 md:p-6 text-left border border-brand-gold/20 hover:border-brand-gold/50 shadow-lg hover:shadow-xl transition-all group touch-manipulation w-full"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-semibold text-brand-maroon-black text-sm md:text-base group-hover:text-brand-maroon transition-colors">
                        {faq.q}
                      </span>
                      <ChevronRight className="flex-shrink-0 w-5 h-5 text-brand-gold/70 group-hover:text-brand-maroon group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-2 text-gray-500 text-xs line-clamp-2">{faq.a}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/support" className="text-brand-gold font-semibold hover:underline text-sm">
                  More questions? Contact Support
                </Link>
              </div>
            </div>

            {/* FAQ modal */}
            {faqModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setFaqModal(null)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="faq-modal-title"
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-brand-gold/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 id="faq-modal-title" className="text-lg font-semibold text-brand-maroon-black pr-8">
                      {faqModal.q}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFaqModal(null)}
                      className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-maroon transition-colors touch-manipulation"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">{faqModal.a}</p>
                  <div className="mt-6 flex justify-end">
                    <Link
                      href="/support"
                      className="text-brand-maroon font-semibold hover:underline text-sm"
                    >
                      Contact Support →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-brand-maroon-darker rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to protect your transaction?</h2>
                <p className="text-white/90 text-base md:text-lg">Start an escrow in Ghana Cedis. Secure, simple, transparent.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="min-h-[48px] px-8 py-4 bg-brand-gold text-brand-maroon-black rounded-lg hover:bg-primary-200 font-semibold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-manipulation"
                >
                  Start an Escrow
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="min-h-[48px] px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 font-semibold text-center transition-all border-2 border-brand-gold/50 flex items-center justify-center touch-manipulation"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Developer Tools (Local Only) */}
            {isLocal && (
              <div className="bg-white/95 rounded-xl shadow-lg p-6 border border-brand-gold/20">
                <h2 className="text-2xl font-semibold text-brand-maroon-black mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-brand-gold" />
                  Developer Tools
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <a
                    href={process.env.NEXT_PUBLIC_MAILPIT_URL || 'http://localhost:8025'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-brand-maroon text-white rounded-lg hover:bg-brand-maroon-dark transition-colors text-center flex items-center justify-center gap-2"
                  >
                    📧 Open Mailpit (Email Testing)
                  </a>
                  <a
                    href={process.env.NEXT_PUBLIC_MINIO_CONSOLE || 'http://localhost:9001'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-brand-maroon-dark text-white rounded-lg hover:bg-brand-maroon-darker transition-colors text-center flex items-center justify-center gap-2"
                  >
                    📦 Open MinIO Console
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
