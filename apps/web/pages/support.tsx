import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PublicPage from '@/components/PublicPage';
import { HelpContent } from '@/components/help/HelpContent';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { isAuthenticated } from '@/lib/auth';

export default function SupportPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/help');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <PageSpinner />;
  }

  return (
    <PublicPage
      title="Support"
      titleVariant="badge"
      subtitle="We’re here to help with escrows, payments, account issues, and disputes."
      documentTitle="Support - MYXCROW"
      description="Get help with MYXCROW escrow. Contact support via chat or email. FAQs on fees, escrow, wallet, disputes, and account."
    >
      <HelpContent variant="public" />
    </PublicPage>
  );
}
