import { type ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAdmin, isAuthenticated } from '@/lib/auth';

export function AdminGate({
  title,
  trailing,
  children,
}: {
  title?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated() || !isAdmin()) {
      router.replace('/login');
    }
  }, [router]);

  if (!mounted || !isAuthenticated() || !isAdmin()) {
    return (
      <Layout title={title} trailing={trailing}>
        <div className="flex items-center justify-center min-h-[240px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-maroon" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={title} trailing={trailing}>
      {children}
    </Layout>
  );
}
