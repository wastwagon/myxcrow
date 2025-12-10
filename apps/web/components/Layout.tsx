import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Navigation to avoid SSR hydration issues
const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false,
});

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Navigation />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">{children}</main>
    </div>
  );
}
