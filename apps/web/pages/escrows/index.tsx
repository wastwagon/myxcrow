import CustomerLayout from '@/components/CustomerLayout';
import { isAdmin } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Download,
  FileText,
  Flag,
  Package,
  PackageCheck,
  Plus,
  Scale,
} from 'lucide-react';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import { WalletMenuGrid, type WalletMenuTile } from '@/components/wallet/WalletMenuGrid';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

const ESCROW_MENU_TILES: WalletMenuTile[] = [
  { href: '/escrows/new', label: 'New escrow', subtitle: 'Start protected', icon: Plus, color: 'maroon' },
  { href: '/escrows/new?category=PHYSICAL_GOODS', label: 'Goods', subtitle: 'Physical items', icon: Package, color: 'teal' },
  { href: '/escrows/new?category=PROFESSIONAL_SERVICE', label: 'Services', subtitle: 'Hire & pay', icon: Briefcase, color: 'blue' },
  { href: '/escrows/new?milestones=1', label: 'Milestones', subtitle: 'Stage release', icon: Flag, color: 'orange' },
  { href: '/confirm-delivery', label: 'Confirm', subtitle: 'Delivery PIN', icon: PackageCheck, color: 'green' },
  { href: '/escrows/history', label: 'History', subtitle: 'All escrows', icon: FileText, color: 'indigo' },
  { href: '/disputes', label: 'Disputes', subtitle: 'Open cases', icon: Scale, color: 'gray' },
];

export default function EscrowsPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const adminView = isAdmin();

  if (!authed) {
    return <PageSpinner />;
  }

  const refreshEscrows = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrows'] });
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get('/escrows/export/csv', { responseType: 'blob' });
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

  return (
    <CustomerLayout title="Escrows" variant="home">
      <PullToRefresh onRefresh={refreshEscrows} disabled={!isMobile}>
        <CustomerShellChrome
          screenTitle="Escrows"
          trailing={
            adminView ? (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-[15px] font-semibold text-brand-gold touch-manipulation"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            ) : undefined
          }
        />
        <div className={SHELL_CONTENT_CLASS}>
          <WalletMenuGrid tiles={ESCROW_MENU_TILES} />
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
