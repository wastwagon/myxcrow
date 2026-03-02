import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntercomChat } from '@/components/IntercomChat';
import '../styles/globals.css';

const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), {
  ssr: false,
});

const PremiumFooter = dynamic(() => import('@/components/PremiumFooter'));

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen pb-20 lg:pb-0 flex flex-col">
          <div className="flex-1">
            <Component {...pageProps} />
          </div>
          <PremiumFooter />
        </div>
        <MobileBottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <IntercomChat />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
