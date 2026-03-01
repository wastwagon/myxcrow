import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Shield, Lock, Zap, Users, ArrowRight, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';

const HOW_IT_WORKS = [
  { step: 1, title: 'Agree on terms', desc: 'Buyer and seller agree on amount, goods or services, and delivery.' },
  { step: 2, title: 'Buyer pays MYXCROW', desc: 'Funds are held securely in escrow until conditions are met.' },
  { step: 3, title: 'Seller delivers', desc: 'Seller ships goods or completes the service as agreed.' },
  { step: 4, title: 'Buyer approves', desc: 'Buyer inspects and confirms receipt or completion.' },
  { step: 5, title: 'We release payment', desc: 'Funds are released to the seller. Done.' },
];

const USE_CASES = [
  { title: 'Diaspora & remittances', desc: 'Build or invest back home. Milestone-based releases so your projects stay on track.', icon: MapPin },
  { title: 'Local transactions', desc: 'Buy property, vehicles, or high-value goods. Secure until both parties are satisfied.', icon: Shield },
  { title: 'Real estate & contracts', desc: 'Close deals with confidence. Funds released only when obligations are fulfilled.', icon: Lock },
  { title: 'Goods & services', desc: 'Protect buyers and sellers. No more lost payments or undelivered orders.', icon: Zap },
];

const FAQ_ITEMS = [
  { q: 'How are my funds protected?', a: 'We hold funds in a secure escrow account. Money is released only when both parties confirm the deal is complete.' },
  { q: 'What fees do you charge?', a: 'A small percentage fee on each successful transaction. No subscriptions, no hidden fees. See our Terms for details.' },
  { q: 'Is MYXCROW available in Ghana?', a: 'Yes. We are built for Ghana and operate in Ghana Cedis (₵). Ideal for local and diaspora transactions.' },
  { q: 'How do I start an escrow?', a: 'Register, complete KYC, then create a new escrow. Add the other party and fund it. Simple.' },
];

export default function Home() {
  const router = useRouter();

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
            {/* Hero + regional positioning */}
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium mb-4">
                <MapPin className="w-3.5 h-3.5" />
                Trusted escrow for Ghana
              </div>
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl mb-4 md:mb-6 shadow-lg overflow-hidden bg-brand-maroon-deep">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={80} height={80} className="object-contain w-full h-full" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 md:mb-4">
                MYXCROW
              </h1>
              <p className="text-base md:text-2xl text-brand-gold font-medium mb-1 md:mb-2">
                Secure Escrow Services
              </p>
              <p className="text-sm md:text-lg text-white/80 max-w-2xl mx-auto hidden sm:block">
                For the home you&apos;re building from afar, or the deal you&apos;re closing in Accra. Your money, held safely until both sides are satisfied.
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

            {/* How it works */}
            <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 mb-12 border border-brand-gold/20">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-maroon-black mb-6 text-center">
                How it works
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                {HOW_IT_WORKS.map((item) => (
                  <div key={item.step} className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-maroon text-white flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </span>
                      <h3 className="font-semibold text-brand-maroon-black">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 pl-11">{item.desc}</p>
                    {item.step < 5 && (
                      <ChevronRight className="hidden lg:block w-5 h-5 text-brand-gold/60 mt-2 pl-11" aria-hidden />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Use cases */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Built for your transactions
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

            {/* FAQ */}
            <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 mb-12 border border-brand-gold/20">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-maroon-black mb-6 text-center">
                Frequently asked questions
              </h2>
              <div className="space-y-6 max-w-2xl mx-auto">
                {FAQ_ITEMS.map((faq) => (
                  <div key={faq.q}>
                    <h3 className="font-semibold text-brand-maroon-black mb-1">{faq.q}</h3>
                    <p className="text-gray-600 text-sm md:text-base">{faq.a}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/support" className="text-brand-maroon font-semibold hover:underline text-sm">
                  More questions? Contact Support
                </Link>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-brand-maroon-darker rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to protect your transaction?</h2>
                <p className="text-white/90 text-base md:text-lg">Start an escrow in Ghana Cedis. Secure, simple, transparent.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-brand-gold text-brand-maroon-black rounded-lg hover:bg-primary-200 font-semibold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Start an Escrow
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 font-semibold text-center transition-all border-2 border-brand-gold/50"
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
                <div className="grid md:grid-cols-2 gap-4">
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
