import { type ReactNode } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { AdminShellChrome } from '@/components/admin/AdminShellChrome';
import { isAdminAppPath } from '@/lib/app-chrome';

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

  return (
    <div className="flex min-h-screen bg-[#f2f2f7] text-gray-900">
      <Navigation />
      <div className="relative flex flex-1 min-w-0 flex-col">
        <AdminShellChrome screenTitle={title} trailing={trailing} />
        <main className="flex-1 min-w-0 px-4 py-6 pt-5 sm:px-6 xl:px-8 xl:py-8 xl:pt-6 text-gray-900 mx-auto w-full max-w-6xl">
          {title && title !== 'Admin' ? (
            <h2 className="mb-4 text-[22px] font-semibold tracking-tight text-gray-900">{title}</h2>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
