import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Shield, Lock, Zap, Users, ArrowRight, Star } from 'lucide-react';
import { isAuthenticated } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const isLocal = process.env.NEXT_PUBLIC_ENV === 'local';

  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Your funds are held safely until transaction completion',
      color: 'blue',
    },
    {
      icon: Lock,
      title: 'Protected Payments',
      description: 'Advanced encryption and fraud protection',
      color: 'green',
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Quick verification and instant notifications',
      color: 'yellow',
    },
    {
      icon: Users,
      title: 'Trusted Platform',
      description: 'Verified users and reputation system',
      color: 'purple',
    },
  ];

  return (
    <>
      <Head>
        <title>MYXCROW - Secure Escrow Services for Safe Transactions</title>
        <meta name="description" content="Secure escrow services for safe transactions in Ghana. Protect your payments with MYXCROW's trusted platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        {/* Environment Banner */}
        {isLocal && (
          <div className="bg-brand-gold text-brand-maroon-black px-4 py-2 text-center text-sm font-medium">
            🚧 Running in LOCAL development mode
          </div>
        )}

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg overflow-hidden bg-brand-maroon-deep">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={80} height={80} className="object-contain" />
              </div>
              <h1 className="text-6xl font-bold text-white mb-4">
                MYXCROW
              </h1>
              <p className="text-2xl text-brand-gold mb-2 font-medium">
                Secure Escrow Services for Safe Transactions
              </p>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Protect your payments with our trusted escrow platform. Funds are held securely until both parties are satisfied.
              </p>
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

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-brand-maroon-darker rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">Ready to Get Started?</h2>
                <p className="text-white/90 text-lg">Join thousands of users who trust MYXCROW for secure transactions</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-brand-gold text-brand-maroon-black rounded-lg hover:bg-primary-200 font-semibold text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Create Account
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

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Link
                href="/login"
                className="bg-white/95 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-brand-gold group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-maroon to-brand-maroon-dark rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-brand-maroon-black mb-1">Sign In</h3>
                    <p className="text-gray-600">Access your account to manage escrows</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-maroon transition-colors" />
                </div>
              </Link>

              <Link
                href="/register"
                className="bg-white/95 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-brand-gold group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-gold rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-brand-maroon-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-brand-maroon-black mb-1">Sign Up</h3>
                    <p className="text-gray-600">Create a new account to get started</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-maroon transition-colors" />
                </div>
              </Link>
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
