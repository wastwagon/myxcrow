import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDateShort } from '@/lib/utils';
import { AlertCircle, ArrowRight, Scale } from 'lucide-react';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { SwipeableListRow } from '@/components/ui/SwipeableListRow';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

export default function DisputesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ['disputes'],
    queryFn: async () => {
      const response = await apiClient.get('/disputes');
      return response.data;
    },
  });

  if (!isAuthenticated()) {
    return null;
  }

  const refreshDisputes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['disputes'] });
  };

  return (
    <Layout>
      <PullToRefresh
        onRefresh={refreshDisputes}
        disabled={!isMobile}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              Resolution
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">Disputes</h1>
            <p className="mt-1 text-sm text-white/55">
              Track open cases and follow escrow resolution progress
            </p>
          </div>
          <Link
            href="/escrows"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-brand-gold"
          >
            View escrows <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        {!isLoading && disputes && disputes.length > 0 && (
          <p className="px-1 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
            {disputes.length} {disputes.length === 1 ? 'case' : 'cases'}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <ListRowsSkeleton rows={3} />
          </div>
        ) : disputes && disputes.length > 0 ? (
          <ListGroup>
            {disputes.map((dispute) => (
              <SwipeableListRow
                key={dispute.id}
                disabled={!isMobile}
                actions={[
                  { label: 'Open', href: `/disputes/${dispute.id}` },
                  { label: 'Escrow', href: `/escrows/${dispute.escrowId}` },
                ]}
              >
                <ListRow
                  href={`/disputes/${dispute.id}`}
                  showChevron={false}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  }
                  title={dispute.reason.replace(/_/g, ' ')}
                  subtitle={
                    <>
                      Escrow {dispute.escrowId.slice(0, 8)}… · {formatDateShort(dispute.createdAt)}
                    </>
                  }
                  trailing={<StatusBadge status={dispute.status} />}
                />
              </SwipeableListRow>
            ))}
          </ListGroup>
        ) : (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/45">
              <Scale className="h-6 w-6" />
            </div>
            <p className="text-ios-headline text-label-primary font-semibold mb-1">No disputes</p>
            <p className="text-ios-subhead text-label-secondary mb-6 max-w-sm mx-auto">
              Disputes you open on escrows will appear here. Most transactions resolve without one.
            </p>
            <Link
              href="/escrows"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-ios-lg border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white"
            >
              Go to escrows
            </Link>
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}
