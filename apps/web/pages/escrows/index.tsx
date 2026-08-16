import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
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
import { PhoneOnly, DesktopOnly } from '@/components/ui/PhoneOnly';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
} from '@/components/ui/Table';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import Link from 'next/link';

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

  const handleExportCSV = async () => {
    try {
      const params = buildQueryParams();
      const response = await apiClient.get(`/escrows/export/csv?${params}`, {
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
    <CustomerLayout title={adminView ? 'Escrows' : 'Escrows'}>
      <PullToRefresh onRefresh={refreshEscrows} disabled={!isMobile} className="space-y-5 pb-4">
        <ButtonLink href="/escrows/new" variant="maroon" size="lg" className="w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          New escrow
        </ButtonLink>

        <div className="space-y-3">
          <Input
            tone="light"
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leading={<Search className="w-5 h-5" />}
          />
          <div className="flex gap-2">
            <Select
              tone="light"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              className="hidden md:inline-flex"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            {adminView && (
              <Button
                type="button"
                variant="outline"
                className="hidden md:inline-flex"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {isLoading ? (
          <ListRowsSkeleton rows={3} />
        ) : escrows && escrows.length > 0 ? (
          <>
            <PhoneOnly>
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
                        title={escrow.description || 'Escrow'}
                        subtitle={`${formatCurrency(displayCents, 'GHS')} · ${amountLabel}`}
                        trailing={<StatusBadge status={escrow.status} onDark={false} />}
                      />
                    </SwipeableListRow>
                  );
                })}
              </ListGroup>
            </PhoneOnly>
            <DesktopOnly>
              <TableShell tone="light">
                <Table>
                  <TableHead>
                    <tr>
                      <TableTh>Escrow</TableTh>
                      <TableTh numeric>Amount</TableTh>
                      <TableTh>Side</TableTh>
                      <TableTh>Status</TableTh>
                      <TableTh>When</TableTh>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {escrows.map((escrow) => {
                      const isBuyer = user?.id === escrow.buyerId;
                      const displayCents = isBuyer
                        ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                        : escrow.netAmountCents ?? escrow.amountCents;
                      return (
                        <TableRow key={escrow.id}>
                          <TableTd>
                            <Link href={`/escrows/${escrow.id}`} className="block min-w-0 min-h-[44px] py-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {escrow.description || 'Escrow'}
                              </p>
                            </Link>
                          </TableTd>
                          <TableTd numeric>{formatCurrency(displayCents, 'GHS')}</TableTd>
                          <TableTd muted>{isBuyer ? 'Funded' : 'Receive'}</TableTd>
                          <TableTd>
                            <StatusBadge status={escrow.status} onDark={false} />
                          </TableTd>
                          <TableTd muted>{formatDateShort(escrow.createdAt)}</TableTd>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableShell>
            </DesktopOnly>
          </>
        ) : (
          <EmptyState
            tone="light"
            icon={<FileText className="h-6 w-6" />}
            title="No escrows"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'Try a different search.'
                : 'Protect a payment with your first escrow.'
            }
            action={
              !searchTerm && statusFilter === 'all'
                ? { href: '/escrows/new', label: 'New escrow', variant: 'maroon' }
                : undefined
            }
          />
        )}
      </PullToRefresh>
    </CustomerLayout>
  );
}

