import { type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAdminAppPath } from '@/lib/app-chrome';
import { cn } from '@/lib/utils';

const Navigation = dynamic(() => import('./Navigation'), {
  ssr: false,
});

interface LayoutProps {
  children: ReactNode;
  title?: string;
  trailing?: ReactNode;
}

export default function Layout({ children, title, trailing }: LayoutProps) {
  const router = useRouter();
  const light = isAdminAppPath(router.pathname);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!light || !title) {
      setCompact(false);
      return;
    }
    const onScroll = () => setCompact(window.scrollY > 28);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [light, title]);

  if (!light) {
    return (
      <div className="min-h-screen flex flex-col app-gradient-bg">
        <div className="app-sat-spacer xl:hidden" aria-hidden />
        <Navigation />
        <main className="flex-1 min-w-0 container mx-auto px-4 py-6 max-w-7xl text-label-primary">
          {children}
        </main>
      </div>
    );
  }

  const overlay = Boolean(title);

  return (
    <div className="flex min-h-screen bg-[#f2f2f7] text-gray-900">
      <Navigation />
      <div className="relative flex flex-1 min-w-0 flex-col">
        {overlay ? (
          <header
            className="sticky top-0 z-40"
            style={{
              paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))',
              background: compact ? 'rgba(242,242,247,0.72)' : 'transparent',
              backdropFilter: compact ? 'blur(28px) saturate(1.8)' : 'none',
              WebkitBackdropFilter: compact ? 'blur(28px) saturate(1.8)' : 'none',
              boxShadow: compact ? 'inset 0 -0.5px 0 rgba(60,60,67,0.18)' : 'none',
            }}
          >
            <div className="flex items-center min-h-[44px] px-1">
              <div className="min-w-[44px] shrink-0" aria-hidden />
              <div className="flex-1 min-w-0 text-center px-1">
                <p
                  className={cn(
                    'text-[17px] font-semibold truncate text-gray-900 transition-opacity duration-200',
                    compact ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {title}
                </p>
              </div>
              <div className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
                {trailing}
              </div>
            </div>
          </header>
        ) : (
          <div className="app-sat-spacer xl:hidden" aria-hidden />
        )}
        <main
          className={cn(
            'flex-1 min-w-0 px-4 py-6 sm:px-6 xl:py-8 text-gray-900',
            overlay && 'pt-2 xl:pt-3'
          )}
        >
          {title && (
            <h1 className="text-[34px] font-bold tracking-tight leading-[1.15] text-gray-900 pb-5">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
