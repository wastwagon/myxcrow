import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/lib/auth';

/**
 * KYC page - disabled for now. Smile ID verification to be implemented later.
 * Redirects to dashboard.
 */
export default function KycPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  return null;
}
