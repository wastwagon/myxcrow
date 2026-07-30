import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Plus, Search, Filter, Download, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { DISPUTE_ELIGIBLE_ESCROW_STATUSES } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { SwipeableListRow } from '@/components/ui/SwipeableListRow';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { buildEscrowReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  fundingAmountCents?: number;
  netAmountCents?: number;
  buyerFeeCents?: number;
  feeCents?: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  buyer?: { email?: string; firstName?: string; lastName?: string };
  seller?: { email?: string; firstName?: string; lastName?: string };
  escrowCategory?: string;
  serviceType?: string;
}

export default function EscrowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const user = getUser();
  const adminView = isAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [counterpartyEmail, setCounterpartyEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (searchTerm) params.append('search', searchTerm);
    if (minAmount) params.append('minAmount', minAmount);
    if (maxAmount) params.append('maxAmount', maxAmount);
    if (currency) params.append('currency', currency);
    if (counterpartyEmail) params.append('counterpartyEmail', counterpartyEmail);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return params.toString();
  };

  const { data: escrowsData, isLoading } = useQuery<{ data: Escrow[]; total: number }>({
    queryKey: ['escrows', searchTerm, statusFilter, minAmount, maxAmount, currency, counterpartyEmail, startDate, endDate],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await apiClient.get(`/escrows?${params}`);
      return response.data;
    },
  });

  const escrows = escrowsData?.data || [];
  const total = escrowsData?.total || 0;

  const handleExportCSV = async () => {
    try {
      const params = buildQueryParams();
      const token = localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
      
      const response = await fetch(`${apiBase}/escrows/export/csv?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escrows_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (error: any) {
      toast.error('Failed to export CSV');
    }
  };

  if (!isAuthenticated()) {
    return null;
  }


  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'AWAITING_FUNDING', label: 'Awaiting Funding' },
    { value: 'FUNDED', label: 'Funded' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'RELEASED', label: 'Released' },
    { value: 'DISPUTED', label: 'Disputed' },
  ];

  const refreshEscrows = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrows'] });
  };

  const getEscrowSwipeActions = (escrow: Escrow) => {
    const actions: { label: string; href: string; variant?: 'default' | 'destructive' }[] = [
      { label: 'Open', href: `/escrows/${escrow.id}` },
    ];
    if (DISPUTE_ELIGIBLE_ESCROW_STATUSES.includes(escrow.status)) {
      actions.push({
        label: 'Dispute',
        href: `/disputes/new?escrowId=${escrow.id}`,
        variant: 'destructive',
      });
    }
    return actions;
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshEscrows} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                Agreements
              </p>
              <h1 className={dash.title}>{adminView ? 'All escrows' : 'Escrows'}</h1>
              <p className={dash.subtitle}>
                {adminView
                  ? 'Review agreements, open details, and print receipts'
                  : 'Manage your escrow agreements'}
              </p>
            </div>
            <ButtonLink href="/escrows/new" variant="maroon" size="lg">
              <Plus className="w-5 h-5" />
              New escrow
            </ButtonLink>
          </div>

          <LightPanel>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                <Input
                  tone="light"
                  type="text"
                  placeholder="Search by ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leading={<Search className="w-5 h-5" />}
                />
                <Select
                  tone="light"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="w-4 h-4" />
                    {showAdvancedFilters ? 'Hide' : 'Show'} filters
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <Field tone="light" label="Min amount (₵)">
                    <Input
                      tone="light"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </Field>
                  <Field tone="light" label="Max amount (₵)">
                    <Input
                      tone="light"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </Field>
                  <Field tone="light" label="Currency">
                    <Select tone="light" value="GHS" disabled>
                      <option value="GHS">₵ Ghana Cedis</option>
                    </Select>
                  </Field>
                  <Field tone="light" label="Counterparty email">
                    <Input
                      tone="light"
                      type="email"
                      placeholder="email@example.com"
                      value={counterpartyEmail}
                      onChange={(e) => setCounterpartyEmail(e.target.value)}
                    />
                  </Field>
                  <Field tone="light" label="Start date">
                    <Input
                      tone="light"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>
                  <Field tone="light" label="End date">
                    <Input
                      tone="light"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          </LightPanel>

          {!isLoading && (
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
              Showing {escrows.length} of {total} escrows
            </p>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <ListRowsSkeleton rows={3} />
            </div>
          ) : escrows && escrows.length > 0 ? (
            <ListGroup tone="light">
              {escrows.map((escrow) => {
                const isBuyer = user?.id === escrow.buyerId;
                const displayCents = isBuyer
                  ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                  : escrow.netAmountCents ?? escrow.amountCents;
                const amountLabel = isBuyer ? 'Funded' : 'Receive';

                return (
                  <SwipeableListRow
                    key={escrow.id}
                    disabled={!isMobile}
                    actions={getEscrowSwipeActions(escrow)}
                  >
                    <ListRow
                      href={`/escrows/${escrow.id}`}
                      showChevron={false}
                      title={escrow.description || 'Escrow Agreement'}
                      subtitle={
                        <>
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(displayCents, 'GHS')}
                          </span>
                          <span className="text-gray-500 text-xs ml-1">({amountLabel})</span>
                          {' · '}
                          {escrow.id.slice(0, 8)}… · {formatDateShort(escrow.createdAt)}
                        </>
                      }
                      trailing={
                        <div className="flex items-center gap-2">
                          {adminView && (
                            <PrintReceiptButton
                              receipt={buildEscrowReceipt(escrow, { isAdminCopy: true })}
                              iconOnly
                              variant="outline"
                              size="sm"
                              label="Print receipt"
                            />
                          )}
                          <StatusBadge status={escrow.status} onDark={false} />
                        </div>
                      }
                    />
                  </SwipeableListRow>
                );
              })}
            </ListGroup>
          ) : (
            <EmptyState
              tone="light"
              icon={<FileText className="h-6 w-6" />}
              title="No escrows found"
              description={
                searchTerm ||
                statusFilter !== 'all' ||
                minAmount ||
                maxAmount ||
                currency ||
                counterpartyEmail ||
                startDate ||
                endDate
                  ? 'Try adjusting your filters'
                  : 'Create your first escrow to get started'
              }
              action={
                !searchTerm && statusFilter === 'all'
                  ? { href: '/escrows/new', label: 'New escrow', variant: 'maroon' }
                  : undefined
              }
            />
          )}
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}

