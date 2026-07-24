import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
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
      <PullToRefresh
        onRefresh={refreshEscrows}
        disabled={!isMobile}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              Agreements
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">
              {adminView ? 'All escrows' : 'Escrows'}
            </h1>
            <p className="mt-1 text-sm text-white/55">
              {adminView
                ? 'Review agreements, open details, and print receipts'
                : 'Manage your escrow agreements'}
            </p>
          </div>
          <ButtonLink href="/escrows/new" size="lg">
            <Plus className="w-5 h-5" />
            New escrow
          </ButtonLink>
        </header>

        {/* Filters */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm p-4 md:p-5">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              <Input
                type="text"
                placeholder="Search by ID or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[48px] bg-black/20"
                leading={<Search className="w-5 h-5" />}
              />
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45 w-5 h-5 z-10" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-h-[48px] pl-10 bg-black/20"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
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
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <Field label="Min amount (₵)">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="bg-black/20"
                  />
                </Field>
                <Field label="Max amount (₵)">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="bg-black/20"
                  />
                </Field>
                <Field label="Currency">
                  <Select value="GHS" disabled className="bg-black/30 text-white/70">
                    <option value="GHS">₵ Ghana Cedis</option>
                  </Select>
                </Field>
                <Field label="Counterparty email">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={counterpartyEmail}
                    onChange={(e) => setCounterpartyEmail(e.target.value)}
                    className="bg-black/20"
                  />
                </Field>
                <Field label="Start date">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-black/20"
                  />
                </Field>
                <Field label="End date">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-black/20"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {!isLoading && (
          <p className="px-1 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
            Showing {escrows.length} of {total} escrows
          </p>
        )}

        {/* Escrows List */}
        {isLoading ? (
          <div className="space-y-3">
            <ListRowsSkeleton rows={3} />
          </div>
        ) : escrows && escrows.length > 0 ? (
          <ListGroup>
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
                        <span className="text-label-primary font-medium">
                          {formatCurrency(displayCents, 'GHS')}
                        </span>
                        <span className="text-label-tertiary text-xs ml-1">({amountLabel})</span>
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
                            variant="plain"
                            size="sm"
                            label="Print receipt"
                          />
                        )}
                        <StatusBadge status={escrow.status} />
                      </div>
                    }
                  />
                </SwipeableListRow>
              );
            })}
          </ListGroup>
        ) : (
          <EmptyState
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
                ? { href: '/escrows/new', label: 'New escrow' }
                : undefined
            }
          />
        )}
      </PullToRefresh>
    </Layout>
  );
}

