import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/lib/auth';

/** Gate protected pages until client mount — auth is read from localStorage. */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!isAuthenticated()) {
      void router.push('/login');
    }
  }, [router]);

  return ready && isAuthenticated();
}
