import { UserAvatar } from '@/components/ui/UserAvatar';

export function AccountProfileCard({
  name,
  phone,
  email,
  avatarLabel,
  loading,
}: {
  name: string;
  phone?: string;
  email?: string;
  avatarLabel: string;
  loading?: boolean;
}) {
  return (
    <section className="mx-wallet-card overflow-hidden rounded-[20px] bg-white px-5 py-5">
      {loading ? (
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-black/5" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-36 animate-pulse rounded-[8px] bg-black/5" />
            <div className="h-4 w-28 animate-pulse rounded-[8px] bg-black/5" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <UserAvatar label={avatarLabel} size="lg" variant="maroon" className="h-16 w-16 text-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-semibold tracking-tight text-brand-maroon-deep">
                {name}
              </p>
              {phone && (
                <p className="mt-0.5 truncate text-[13px] text-[rgba(60,60,67,0.55)]">{phone}</p>
              )}
              {email && (
                <p className="mt-0.5 truncate text-[13px] text-[rgba(60,60,67,0.55)]">{email}</p>
              )}
            </div>
          </div>
          {phone && (
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                Phone verified
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
