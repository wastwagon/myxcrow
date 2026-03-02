import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Calendar, DollarSign, Mail, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
}

export default function EscrowsPage() {
  const router = useRouter();
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

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Escrows"
          subtitle="Manage your escrow agreements"
          icon={<FileText className="w-6 h-6" />}
          action={
            <Link
              href="/escrows/new"
              className="min-h-[48px] px-4 py-3 bg-gradient-to-r from-brand-gold to-amber-600 text-brand-maroon-black rounded-xl hover:from-brand-gold/90 hover:to-amber-500 font-semibold shadow-lg transition-all flex items-center justify-center gap-2 touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              New Escrow
            </Link>
          }
        />

        {/* Filters */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 p-4">
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 appearance-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex-1 min-h-[48px] px-4 py-3 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm touch-manipulation transition-colors"
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm touch-manipulation font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Min Amount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Max Amount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Currency
                  </label>
                  <select
                    value="GHS"
                    disabled
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white/70"
                  >
                    <option value="GHS">₵ Ghana Cedis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Counterparty Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={counterpartyEmail}
                    onChange={(e) => setCounterpartyEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {!isLoading && (
          <div className="text-sm text-white/70">
            Showing {escrows.length} of {total} escrows
          </div>
        )}

        {/* Escrows List */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/10 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : escrows && escrows.length > 0 ? (
            <div className="divide-y divide-white/10">
              {escrows.map((escrow) => (
                <Link
                  key={escrow.id}
                  href={`/escrows/${escrow.id}`}
                  className="block p-6 min-h-[48px] hover:bg-white/5 transition-colors touch-manipulation"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-white">
                          {escrow.description || 'Escrow Agreement'}
                        </h3>
                        <StatusBadge status={escrow.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70 flex-wrap">
                        <span className="font-medium text-white">
                          {formatCurrency(escrow.amountCents, 'GHS')}
                        </span>
                        <span>•</span>
                        <span>ID: {escrow.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{formatDateShort(escrow.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-brand-gold">→</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-white/70">
              <p className="text-lg mb-2 text-white">No escrows found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' || minAmount || maxAmount || currency || counterpartyEmail || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'Create your first escrow to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

