import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAdminAppPath, isAuthChromePath } from '@/lib/app-chrome';

const IntercomChat = dynamic(
  () => import('@/components/IntercomChat').then((m) => ({ default: m.IntercomChat })),
  { ssr: false },
);

export function DeferredIntercom() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const skip = isAuthChromePath(router.pathname) || isAdminAppPath(router.pathname);

  useEffect(() => {
    if (skip) {
      setReady(false);
      return;
    }
    const idle = window.requestIdleCallback?.bind(window);
    if (idle) {
      const id = idle(() => setReady(true), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => setReady(true), 2500);
    return () => window.clearTimeout(t);
  }, [skip]);

  if (!ready || skip) return null;
  return <IntercomChat />;
}
