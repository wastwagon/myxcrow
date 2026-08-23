import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getUser, isAdmin, isAuthenticated, type User } from '@/lib/auth';

type AdminStats = {
  totals?: {
    openDisputeCount?: number;
    pendingWithdrawalCount?: number;
  };
};

export function useAdminShellHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const { data } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await apiClient.get('/admin/stats')).data,
    enabled: isAuthenticated() && isAdmin(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const disputes = data?.totals?.openDisputeCount ?? 0;
  const withdrawals = data?.totals?.pendingWithdrawalCount ?? 0;

  return {
    greeting: user?.firstName ? `Hi, ${user.firstName}` : 'Admin',
    accountLabel: user?.email || user?.phone || 'Administrator',
    avatarLabel: user?.firstName || user?.email || user?.phone || 'Admin',
    bellBadge: disputes + withdrawals,
    disputeCount: disputes,
    withdrawalCount: withdrawals,
  };
}
