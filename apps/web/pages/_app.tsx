import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IntercomChat } from '@/components/IntercomChat';
import AppShell from '@/components/AppShell';
import PageTransition from '@/components/PageTransition';
import { UIProvider } from '@/components/providers/UIProvider';
import { applyAppChrome } from '@/lib/app-chrome';
import '../styles/globals.css';

export default function App({ Component, pageProps, router }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    applyAppChrome(router.pathname);
  }, [router.pathname]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UIProvider>
          <AppShell>
            <PageTransition>
              <Component {...pageProps} />
            </PageTransition>
          </AppShell>
          <Toaster
            position="top-center"
            containerStyle={{
              top: 'max(12px, var(--safe-top))',
            }}
            toastOptions={{
              duration: 3500,
              style: {
                background: 'rgba(42, 28, 30, 0.95)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 500,
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                maxWidth: 'min(100vw - 32px, 400px)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#d0ab63',
                  secondary: '#160f10',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ff453a',
                  secondary: '#fff',
                },
              },
            }}
          />
          <IntercomChat />
        </UIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
