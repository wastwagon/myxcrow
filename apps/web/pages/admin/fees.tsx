import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PageSpinner } from '@/components/LoadingSkeleton';

/** Legacy route — fee configuration lives under Platform Settings. */
export default function AdminFeesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings?tab=fees');
  }, [router]);

  return <PageSpinner />;
}
