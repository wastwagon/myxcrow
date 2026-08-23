import Head from 'next/head';
import CustomerLayout from '@/components/CustomerLayout';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import { HelpContent } from '@/components/help/HelpContent';

export default function HelpPage() {
  const authed = useRequireAuth();

  if (!authed) {
    return <PageSpinner />;
  }

  return (
    <>
      <Head>
        <title>Help - MYXCROW</title>
        <meta
          name="description"
          content="Get help with MYXCROW escrows, wallet, disputes, and your account."
        />
      </Head>
      <CustomerLayout title="Help" variant="home">
        <CustomerShellChrome screenTitle="Help" />
        <div className={SHELL_CONTENT_CLASS}>
          <HelpContent variant="dashboard" />
        </div>
      </CustomerLayout>
    </>
  );
}
