import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Shield, Lock, Zap, Users, ArrowRight, CheckCircle2, MapPin, X, ChevronRight } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';
import { publicForm } from '@/lib/form-classes';
import { ImageCard, ImageCardRow } from '@/components/ui/ImageCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const HOW_IT_WORKS = [
  { step: 1, title: 'Agree on terms', desc: 'Buyer and seller agree on the amount, goods or services, and delivery terms before starting.' },
  { step: 2, title: 'Buyer funds escrow', desc: 'Buyer pays into a secure MYXCROW escrow. Funds are held until both parties fulfil their obligations.' },
  { step: 3, title: 'Seller delivers', desc: 'Seller ships goods or completes the service according to the agreed terms.' },
  { step: 4, title: 'Buyer confirms', desc: 'Buyer inspects delivery and confirms satisfaction, or raises a dispute if needed.' },
  { step: 5, title: 'Release payment', desc: 'MYXCROW releases funds to the seller once the buyer approves. Transaction complete.' },
];

const USE_CASES = [
  { title: 'Diaspora & remittances', desc: 'Build or invest from abroad. Milestone-based releases keep your projects on track.', icon: MapPin, image: '/images/v2/diaspora.jpg' },
  { title: 'Local transactions', desc: 'Buy property, vehicles, or high-value goods. Funds held until both parties are satisfied.', icon: Shield, image: '/images/v2/local-transactions.jpg' },
  { title: 'Real estate & contracts', desc: 'Close deals with confidence. Funds released only when all obligations are fulfilled.', icon: Lock, image: '/images/v2/real-estate.jpg' },
  { title: 'Goods & services', desc: 'Protect buyers and sellers. No lost payments, no undelivered orders.', icon: Zap, image: '/images/v2/goods-services.jpg' },
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
            {/* Hero – photographic, premium */}
            <section className="relative mb-10 md:mb-14 min-h-[420px] md:min-h-[520px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
              <Image
                src="/images/v2/protected-payments-hero.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
              <div className="relative z-10 flex min-h-[420px] md:min-h-[520px] max-w-2xl flex-col justify-end p-6 md:p-10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-2 ring-brand-gold/30">
                    <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={48} height={48} className="h-full w-full object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-gold" />
                    Trusted escrow for Ghana
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">MYXCROW</h1>
                <p className="mt-2 text-base md:text-2xl font-medium text-brand-gold">
                  Secure Escrow Services
                </p>
                <p className="mt-2 max-w-xl text-sm md:text-lg leading-relaxed text-white/80">
                  For the home you&apos;re building from afar, or the deal you&apos;re closing in Accra. Funds held safely until both sides are satisfied.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-ios-lg bg-brand-gold px-6 py-3 font-semibold text-brand-maroon-black transition-colors hover:bg-brand-gold/90 touch-manipulation"
                  >
                    Start an Escrow
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-ios-lg border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 touch-manipulation"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </section>

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
                  <p className={`${publicForm.marketingMuted} mt-0.5`}>{badge.sub}</p>
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

            {/* Use cases – photo cards */}
            <div className="mb-12">
              <SectionHeader
                className="mb-6 justify-center text-center [&_h2]:text-2xl md:[&_h2]:text-3xl [&_div]:w-full"
                title="Built for your transactions"
              />
              <ImageCardRow columns={4} className="md:gap-6">
                {USE_CASES.map((uc) => (
                  <ImageCard
                    key={uc.title}
                    href="/register"
                    title={uc.title}
                    description={uc.desc}
                    image={uc.image}
                    icon={uc.icon}
                    mobileWidthClassName="w-[70vw] max-w-[240px]"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="md:aspect-[3/4]"
                  />
                ))}
              </ImageCardRow>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/95 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-brand-gold/20"
                  >
                    <div className="w-12 h-12 rounded-ios-lg bg-brand-gold/20 ring-1 ring-brand-gold/35 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-brand-maroon" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-maroon-black mb-2">{feature.title}</h3>
                    <p className={publicForm.marketingBody}>{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Pricing transparency */}
            <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 mb-12 border border-brand-gold/20">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-maroon-black mb-4 text-center">
                Simple, transparent pricing
              </h2>
              <p className={`${publicForm.marketingBody} text-center max-w-2xl mx-auto mb-6`}>
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
                    <p className={`mt-2 ${publicForm.marketingMuted} line-clamp-2`}>{faq.a}</p>
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
                  <p className={publicForm.marketingBodyLg}>{faqModal.a}</p>
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

            {/* CTA Section – photographic banner */}
            <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-brand-maroon-black shadow-xl">
              <Image
                src="/images/v2/milestone-projects.jpg"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover object-[center_28%]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
              <div className="relative z-10 p-8 md:p-10 text-white">
                <div className="mb-6 max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to protect your transaction?</h2>
                  <p className="text-white/85 text-base md:text-lg">Start an escrow in Ghana Cedis. Secure, simple, transparent.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="min-h-[48px] px-8 py-4 bg-brand-gold text-brand-maroon-black rounded-lg hover:bg-primary-200 font-semibold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-manipulation"
                  >
                    Start an Escrow
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="min-h-[48px] px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 font-semibold text-center transition-all border-2 border-brand-gold/50 flex items-center justify-center backdrop-blur-sm touch-manipulation"
                  >
                    Sign In
                  </Link>
                </div>
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
