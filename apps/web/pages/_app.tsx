import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DeferredIntercom } from '@/components/DeferredIntercom';
import AppShell from '@/components/AppShell';
import PageTransition from '@/components/PageTransition';
import { UIProvider } from '@/components/providers/UIProvider';
import { applyAppChrome, isGroupedLightPath } from '@/lib/app-chrome';
import { migrateLegacyTokens } from '@/lib/auth';
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
    migrateLegacyTokens();
  }, []);

  useEffect(() => {
    applyAppChrome(router.pathname, router.route);
  }, [router.pathname, router.route]);

  const lightToasts = isGroupedLightPath(router.pathname, router.route);

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
              style: lightToasts
                ? {
                    background: 'rgba(255,255,255,0.96)',
                    color: '#111827',
                    border: '1px solid rgba(60,60,67,0.12)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 500,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                    maxWidth: 'min(100vw - 32px, 400px)',
                  }
                : {
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
                  primary: lightToasts ? '#8f2126' : '#d0ab63',
                  secondary: lightToasts ? '#fff' : '#160f10',
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
          <DeferredIntercom />
        </UIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
