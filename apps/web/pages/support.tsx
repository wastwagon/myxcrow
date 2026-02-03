import Head from 'next/head';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support - MYXCROW</title>
        <meta name="description" content="Contact MYXCROW support. Use the chat widget or email from your registered account. Include your escrow ID and screenshots when reporting an issue." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white/95 rounded-2xl shadow-xl border border-brand-gold/20 overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-3xl font-bold text-brand-maroon-black mb-2">Support</h1>
              <p className="text-gray-600 mb-6">
                Use the chat widget (bottom-right) to contact support. If chat isn&apos;t available, email support from your
                registered account.
              </p>
              <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-sm text-brand-maroon-black mb-6">
                <strong>Tip:</strong> Include your escrow ID and screenshots when reporting an issue.
              </div>
              <p className="text-gray-600 text-sm">
                See our{' '}
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>
                {' '}for full legal and data protection information.
              </p>

              <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>
                <Link href="/" className="text-brand-maroon font-semibold hover:underline">Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
