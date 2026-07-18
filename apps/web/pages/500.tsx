import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

export default function ServerError() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-brand-maroon-black">
      <Image
        src="/images/v2/local-transactions.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-brand-maroon-black" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="v2-fade-up max-w-md w-full text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold/80">
              MyXcrow
            </p>
            <h1 className="mt-3 text-6xl font-bold tracking-tight text-white">500</h1>
            <p className="mt-3 text-xl font-semibold text-white">Server error</p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Something went wrong on our end. Please try again in a moment.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-brand-gold px-6 text-sm font-bold text-brand-maroon-black transition-colors hover:bg-brand-gold/90 touch-manipulation"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
