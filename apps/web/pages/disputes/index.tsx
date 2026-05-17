import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDateShort } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
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
      <PullToRefresh onRefresh={refreshDisputes} disabled={!isMobile} className="space-y-6">
        <PageHeader
          title="Disputes"
          subtitle="View and manage disputes"
          icon={<AlertCircle className="w-6 h-6" />}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/10 animate-pulse rounded-ios-xl" />
            ))}
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
                  leading={<AlertCircle className="w-5 h-5 text-red-400" />}
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
            <AlertCircle className="w-14 h-14 mx-auto mb-4 text-white/30" />
            <p className="text-ios-headline text-label-primary font-semibold mb-1">No disputes</p>
            <p className="text-ios-subhead text-label-secondary">
              Disputes you open on escrows will appear here.
            </p>
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}
