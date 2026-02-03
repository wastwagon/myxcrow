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
    <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518]/95 to-[#160f10]">
      <Navigation />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl" suppressHydrationWarning>{children}</main>
    </div>
  );
}
