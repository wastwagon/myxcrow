import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export default function ServerError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10] flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-400/90 mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">500</h1>
          <p className="text-xl text-white/90 mb-6">Server error</p>
          <p className="text-white/70 mb-8">
            Something went wrong on our end. Please try again later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] bg-brand-gold text-brand-maroon-black rounded-xl hover:bg-brand-gold/90 font-semibold transition-all touch-manipulation"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
