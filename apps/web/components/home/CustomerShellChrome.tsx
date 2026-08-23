import { type ReactNode, useState } from 'react';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { HomeApprovalsSheet } from '@/components/home/HomeApprovalsSheet';
import { HomeBrandHeader, type HomeHeaderLeading } from '@/components/home/HomeBrandHeader';
import { useCustomerShellHeader } from '@/lib/hooks/useCustomerShellHeader';

export const SHELL_CONTENT_CLASS =
  'px-4 pb-6 pt-5 max-w-2xl mx-auto xl:max-w-5xl xl:px-8 space-y-5';

/** Wallet card overlap on mobile maroon header */
export const SHELL_WALLET_CONTENT_CLASS = `${SHELL_CONTENT_CLASS} relative z-10 -mt-[72px] space-y-5 xl:mt-0`;

export function CustomerShellChrome({
  leading = 'account',
  closeHref = '/dashboard',
  onLeadingClick,
  trailing,
  pageTitle,
  screenTitle,
}: {
  leading?: HomeHeaderLeading;
  closeHref?: string;
  onLeadingClick?: () => void;
  trailing?: ReactNode;
  pageTitle?: string;
  screenTitle?: string;
}) {
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const { greeting, accountLabel, avatarLabel, bellBadge, awaitingCount } =
    useCustomerShellHeader();

  return (
    <>
      <HomeApprovalsSheet
        open={approvalsOpen}
        onClose={() => setApprovalsOpen(false)}
        awaitingCount={awaitingCount}
      />
      <HomeBrandHeader
        leading={leading}
        closeHref={closeHref}
        onLeadingClick={onLeadingClick}
        trailing={trailing}
        pageTitle={pageTitle}
        screenTitle={screenTitle}
        badge={bellBadge}
        onBell={() => setApprovalsOpen(true)}
        greeting={greeting}
        accountLabel={accountLabel}
        avatarLabel={avatarLabel}
        bellExpanded={approvalsOpen}
      />
      <div className="px-4 max-w-2xl mx-auto xl:max-w-5xl xl:px-8">
        <ImpersonationBanner />
      </div>
    </>
  );
}
