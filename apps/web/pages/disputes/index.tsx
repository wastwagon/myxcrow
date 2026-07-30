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
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { SwipeableListRow } from '@/components/ui/SwipeableListRow';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { LightShell } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';

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
    queryFn: async () => (await apiClient.get('/disputes')).data,
  });

  if (!isAuthenticated()) {
    return null;
  }

  const refreshDisputes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['disputes'] });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshDisputes} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                Resolution
              </p>
              <h1 className={dash.title}>Disputes</h1>
              <p className={dash.subtitle}>
                Track open cases and follow escrow resolution progress
              </p>
            </div>
            <Link
              href="/escrows"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm font-semibold text-brand-maroon"
            >
              View escrows <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!isLoading && disputes && disputes.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
              {disputes.length} {disputes.length === 1 ? 'case' : 'cases'}
            </p>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <ListRowsSkeleton rows={3} />
            </div>
          ) : disputes && disputes.length > 0 ? (
            <ListGroup tone="light">
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
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                      </span>
                    }
                    title={dispute.reason.replace(/_/g, ' ')}
                    subtitle={
                      <>
                        Escrow {dispute.escrowId.slice(0, 8)}… · {formatDateShort(dispute.createdAt)}
                      </>
                    }
                    trailing={<StatusBadge status={dispute.status} onDark={false} />}
                  />
                </SwipeableListRow>
              ))}
            </ListGroup>
          ) : (
            <EmptyState
              tone="light"
              icon={<Scale className="h-6 w-6" />}
              title="No disputes"
              description="Disputes you open on escrows will appear here. Most transactions resolve without one."
              action={{ href: '/escrows', label: 'Go to escrows', variant: 'outline' }}
            />
          )}
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
