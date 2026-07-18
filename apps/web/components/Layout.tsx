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
    <div className="min-h-screen app-gradient-bg flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-7xl flex-1 text-label-primary">{children}</main>
    </div>
  );
}
