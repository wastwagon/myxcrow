import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getUser, isAuthenticated } from '@/lib/auth';

interface Escrow {
  status: string;
}

export function useCustomerShellHeader() {
  const user = getUser();

  const { data: escrowsData } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[] } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => (await apiClient.get('/escrows')).data,
    enabled: isAuthenticated(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  const awaiting = escrows.filter((e) =>
    ['AWAITING_FUNDING', 'AWAITING_SHIPMENT', 'AWAITING_RELEASE'].includes(e.status)
  );

  return {
    greeting: user?.firstName ? `Hi, ${user.firstName}` : 'Welcome',
    accountLabel: user?.phone || user?.email || 'Your wallet',
    avatarLabel: user?.firstName || user?.email || user?.phone || 'You',
    bellBadge: awaiting.length,
    awaitingCount: awaiting.length,
  };
}
