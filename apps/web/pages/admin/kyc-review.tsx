import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { PageSpinner } from '@/components/LoadingSkeleton';

/**
 * KYC Review - disabled for now. Smile ID verification to be implemented later.
 * Redirects to admin dashboard.
 */
export default function KYCReviewPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    } else {
      router.replace('/admin');
    }
  }, [router]);

  return <PageSpinner />;
}
