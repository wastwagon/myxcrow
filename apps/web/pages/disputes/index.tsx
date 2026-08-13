import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDateShort } from '@/lib/utils';
import { AlertCircle, Scale } from 'lucide-react';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
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
    queryFn: async () => (await apiClient.get('/disputes')).data,
  });

  if (!isAuthenticated()) {
    return null;
  }

  const refreshDisputes = async () => {
    await queryClient.invalidateQueries({ queryKey: ['disputes'] });
  };

  return (
    <CustomerLayout title="Disputes">
      <PullToRefresh onRefresh={refreshDisputes} disabled={!isMobile} className="space-y-5 pb-4">
        {isLoading ? (
          <ListRowsSkeleton rows={3} />
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
                  leading={
                    <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-red-50 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                  }
                  title={dispute.reason.replace(/_/g, ' ')}
                  subtitle={`Escrow ${dispute.escrowId.slice(0, 8)}… · ${formatDateShort(dispute.createdAt)}`}
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
            description="Cases you open on an escrow will show up here."
          />
        )}
      </PullToRefresh>
    </CustomerLayout>
  );
}
