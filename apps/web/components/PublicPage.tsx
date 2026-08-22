import { type ReactNode, useLayoutEffect } from 'react';
import Head from 'next/head';
import PublicHeader from '@/components/PublicHeader';
import { TitleBadge } from '@/components/ui/TitleBadge';
import { cn } from '@/lib/utils';

interface PublicPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidthClass?: string;
  documentTitle?: string;
  description?: string;
  /** Center title + body (404 / 500). */
  centered?: boolean;
  /** Wrap children in a white grouped card. Default true. */
  card?: boolean;
  showHeader?: boolean;
  titleClassName?: string;
  noIndex?: boolean;
  titleVariant?: 'heading' | 'badge';
}

export default function PublicPage({
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-3xl',
  documentTitle,
  description,
  centered = false,
  card = true,
  showHeader = true,
  titleClassName,
  noIndex = false,
  titleVariant = 'heading',
}: PublicPageProps) {
  useLayoutEffect(() => {
    document.documentElement.classList.add('public-light');
    document.documentElement.style.setProperty('--app-chrome-bg', '#f2f2f7');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f2f2f7');
  }, []);

  return (
    <>
      <Head>
        <title>{documentTitle || `${title} - MYXCROW`}</title>
        {description && <meta name="description" content={description} />}
        {noIndex && <meta name="robots" content="noindex,nofollow" />}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      {showHeader && <PublicHeader />}
      <div className={cn('min-h-screen bg-[#f2f2f7]', !showHeader && 'pt-safe')}>
        <div
          className={cn(
            'container mx-auto px-4 py-6 pb-8',
            maxWidthClass,
            centered && 'flex min-h-[70vh] flex-col items-center justify-center text-center'
          )}
        >
          {titleVariant === 'badge' && !titleClassName ? (
            <TitleBadge as="h1" className="mb-3">
              {title}
            </TitleBadge>
          ) : (
            <h1
              className={cn(
                'font-semibold tracking-tight text-gray-900',
                titleClassName || 'text-[17px] leading-[1.2] pb-2'
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              className={cn(
                'text-[rgba(60,60,67,0.6)]',
                titleVariant === 'badge' ? 'text-[13px] pb-4' : 'text-[15px] pb-5'
              )}
            >
              {subtitle}
            </p>
          )}
          {card ? <div className="rounded-[20px] bg-white p-5 sm:p-8 text-left">{children}</div> : children}
        </div>
      </div>
    </>
  );
}
