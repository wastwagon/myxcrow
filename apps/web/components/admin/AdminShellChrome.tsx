import { type ReactNode, useState } from 'react';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { AdminInboxSheet } from '@/components/admin/AdminInboxSheet';
import { HomeBrandHeader } from '@/components/home/HomeBrandHeader';
import { useAdminShellHeader } from '@/lib/hooks/useAdminShellHeader';

export function AdminShellChrome({
  screenTitle,
  trailing,
}: {
  screenTitle?: string;
  trailing?: ReactNode;
}) {
  const [inboxOpen, setInboxOpen] = useState(false);
  const { greeting, accountLabel, avatarLabel, bellBadge, disputeCount, withdrawalCount } =
    useAdminShellHeader();

  return (
    <>
      <AdminInboxSheet
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        disputeCount={disputeCount}
        withdrawalCount={withdrawalCount}
      />
      <HomeBrandHeader
        screenTitle={screenTitle ?? 'Admin'}
        badge={bellBadge}
        onBell={() => setInboxOpen(true)}
        greeting={greeting}
        accountLabel={accountLabel}
        avatarLabel={avatarLabel}
        overlapBand={false}
        bellExpanded={inboxOpen}
        trailing={
          trailing ? (
            <div className="[&_button]:text-brand-gold [&_a]:text-brand-gold">{trailing}</div>
          ) : undefined
        }
      />
      <div className="px-4 sm:px-6 xl:px-8">
        <ImpersonationBanner />
      </div>
    </>
  );
}
