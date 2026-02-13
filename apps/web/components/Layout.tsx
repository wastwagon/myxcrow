import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Navigation to avoid SSR hydration issues
const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false,
});

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518]/95 to-[#160f10] flex flex-col" suppressHydrationWarning>
      <Navigation />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl flex-1">{children}</main>
      <footer className="border-t border-white/10 py-4 px-4">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/70">
          <Link href="/support" className="hover:text-brand-gold transition-colors">Support</Link>
          <span className="text-white/40">|</span>
          <Link href="/terms" className="hover:text-brand-gold transition-colors">Terms & Conditions</Link>
          <span className="text-white/40">|</span>
          <Link href="/privacy" className="hover:text-brand-gold transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
