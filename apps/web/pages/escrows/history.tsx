import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Archive, BellRing, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SearchField } from '@/components/ui/SearchField';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { FilterCards, type FilterCardOption } from '@/components/ui/FilterCards';
import { EscrowHistoryList } from '@/components/escrows/EscrowHistoryList';
import {
  countEscrowsByTab,
  filterEscrowsByTab,
  parseEscrowHistoryTab,
  type EscrowHistoryTab,
  type EscrowRecord,
} from '@/components/escrows/escrow-history-shared';

const FILTER_OPTIONS: Omit<FilterCardOption<EscrowHistoryTab>, 'count'>[] = [
  { value: 'all', label: 'All', subtitle: 'Every escrow', icon: FileText, color: 'indigo' },
  { value: 'needs', label: 'Needs you', subtitle: 'Action required', icon: BellRing, color: 'orange' },
  { value: 'closed', label: 'Closed', subtitle: 'Done deals', icon: Archive, color: 'gray' },
];

export default function EscrowHistoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const adminView = isAdmin();
  const user = getUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<EscrowHistoryTab>('all');

  useEffect(() => {
    if (!router.isReady) return;
    setTab(parseEscrowHistoryTab(router.query.tab));
  }, [router.isReady, router.query.tab]);

  const { data: escrowsData, isLoading } = useQuery<{ data: EscrowRecord[]; total: number }>({
    queryKey: ['escrows', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await apiClient.get(`/escrows?${params.toString()}`);
      return response.data;
    },
    enabled: authed,
  });

  const escrows = escrowsData?.data || [];
  const visibleEscrows = useMemo(
    () => filterEscrowsByTab(escrows, tab),
    [escrows, tab]
  );

  if (!authed) {
    return <PageSpinner />;
  }

  const refreshEscrows = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrows'] });
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await apiClient.get(`/escrows/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escrows_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const filterOptions: FilterCardOption<EscrowHistoryTab>[] = FILTER_OPTIONS.map((option) => ({
    ...option,
    count: countEscrowsByTab(escrows, option.value),
  }));

  const selectTab = (next: EscrowHistoryTab) => {
    setTab(next);
    router.replace({ pathname: '/escrows/history', query: { tab: next } }, undefined, {
      shallow: true,
    });
  };

  return (
    <CustomerLayout
      title="Escrow history"
      back
      trailing={
        adminView ? (
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-gold touch-manipulation"
          >
            Export
          </button>
        ) : undefined
      }
    >
      <PullToRefresh onRefresh={refreshEscrows} disabled={!isMobile} className="space-y-5 pb-4">
        <FilterCards options={filterOptions} value={tab} onChange={selectTab} columns={3} />
        <SearchField
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search escrows"
        />
        <EscrowHistoryList
          escrows={visibleEscrows}
          tab={tab}
          searchTerm={searchTerm}
          loading={isLoading}
          userId={user?.id}
          isMobile={isMobile}
        />
      </PullToRefresh>
    </CustomerLayout>
  );
}
