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
    <div className="min-h-screen bg-gray-50 flex flex-col" suppressHydrationWarning>
      <Navigation />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-4 px-4">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <Link href="/support" className="hover:text-brand-maroon transition-colors">Support</Link>
          <span className="text-gray-400">|</span>
          <Link href="/terms" className="hover:text-brand-maroon transition-colors">Terms & Conditions</Link>
          <span className="text-gray-400">|</span>
          <Link href="/privacy" className="hover:text-brand-maroon transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
