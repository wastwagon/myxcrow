import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { getUser, isImpersonating, setUser } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export function ImpersonationBanner() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (!isImpersonating()) return null;
  const user = getUser();

  const stop = async () => {
    setPending(true);
    try {
      const res = await apiClient.post('/auth/admin/stop-impersonate');
      if (res.data?.user) setUser(res.data.user);
      toast.success('Returned to admin');
      router.push('/admin/users');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not restore admin session. Sign in again.';
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Banner light tone="warning" title="Viewing as customer" className="mb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px]">
          Signed in as {user?.email || 'this user'}. Admin tools are paused until you stop.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={stop}
          disabled={pending}
        >
          {pending ? 'Returning…' : 'Return to admin'}
        </Button>
      </div>
    </Banner>
  );
}
