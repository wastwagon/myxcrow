import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Package, Truck, CheckCircle, DollarSign, Clock, AlertCircle,
  Send, Upload, FileText, MessageSquare, List, Activity, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ActivityTimeline from '@/components/ActivityTimeline';
import LedgerView from '@/components/LedgerView';
import MilestoneManagement from '@/components/MilestoneManagement';
import EscrowMessaging from '@/components/EscrowMessaging';
import RatingModal from '@/components/RatingModal';
import UserProfileLink from '@/components/UserProfileLink';
import PageHeader from '@/components/PageHeader';

interface Shipment {
  id: string;
  trackingNumber?: string;
  carrier?: string;
  deliveryCode?: string;
  shortReference?: string;
  status?: string;
}

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  buyerWalletId?: string;
  sellerWalletId?: string;
  feeCents: number;
  netAmountCents: number;
  deliveryRegion?: string;
  deliveryCity?: string;
  deliveryAddressLine?: string;
  deliveryPhone?: string;
  milestones?: any[];
  shipments?: Shipment[];
  buyer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default function EscrowDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const user = getUser();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'ledger' | 'milestones' | 'messages'>('timeline');
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; rateeId?: string; rateeName?: string; role?: 'buyer' | 'seller' }>({ isOpen: false });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: escrow, isLoading } = useQuery<Escrow>({
    queryKey: ['escrow', id],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const isBuyer = escrow?.buyerId === user?.id;
  const isSeller = escrow?.sellerId === user?.id;
  const canFund = isBuyer && escrow?.status === 'AWAITING_FUNDING';
  const canShip = isSeller && escrow?.status === 'FUNDED';
  const canDeliver = isBuyer && escrow?.status === 'SHIPPED';
  const canRelease = isBuyer && (escrow?.status === 'DELIVERED' || escrow?.status === 'AWAITING_RELEASE');
  const canMarkServiceCompleted = isSeller && escrow?.status === 'FUNDED';
  const canRate = (isBuyer || isSeller) && escrow && ['RELEASED', 'REFUNDED'].includes(escrow.status);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    AWAITING_FUNDING: { label: 'Awaiting Funding', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    FUNDED: { label: 'Funded', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
    SHIPPED: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
    DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Package },
    AWAITING_RELEASE: { label: 'Awaiting Release', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    RELEASED: { label: 'Released', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    DISPUTED: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  };

  const fundMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/fund`, { useWallet: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Escrow funded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to fund escrow');
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (data: { trackingNumber?: string }) => {
      return apiClient.put(`/escrows/${id}/ship`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      toast.success('Escrow marked as shipped');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as shipped');
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/deliver`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      toast.success('Escrow marked as delivered');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as delivered');
    },
  });

  const confirmDeliveryByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiClient.put(`/escrows/${id}/confirm-delivery`, { deliveryCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      setDeliveryCodeInput('');
      toast.success('Delivery confirmed with code');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid code');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Funds released to seller');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to release funds');
    },
  });

  const serviceCompletedMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/service-completed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      toast.success('Service marked as completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark service as completed');
    },
  });

  const handleFund = () => {
    if (confirm('Fund this escrow from your wallet?')) {
      fundMutation.mutate();
    }
  };

  const handleShip = () => {
    const tracking = prompt('Enter tracking number (optional):');
    shipMutation.mutate({ trackingNumber: tracking || undefined });
  };

  const handleDeliver = () => {
    if (confirm('Confirm that you have received the item?')) {
      deliverMutation.mutate();
    }
  };

  const handleConfirmDeliveryByCode = () => {
    const code = deliveryCodeInput.trim();
    if (!code) {
      toast.error('Enter the delivery code');
      return;
    }
    confirmDeliveryByCodeMutation.mutate(code);
  };

  const confirmDeliveryBaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/confirm-delivery` : '/confirm-delivery';
  const firstShipmentWithCode = escrow?.shipments?.find((s) => s.deliveryCode && s.shortReference);

  const handleRelease = () => {
    const msg =
      escrow?.status === 'AWAITING_RELEASE'
        ? 'Confirm service completion and release funds to seller? This action cannot be undone.'
        : 'Release funds to seller? This action cannot be undone.';
    if (confirm(msg)) {
      releaseMutation.mutate();
    }
  };

  const handleServiceCompleted = () => {
    if (confirm('Mark this escrow as "Service Completed" (no shipping)? Buyer will then be able to release funds.')) {
      serviceCompletedMutation.mutate();
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3" />
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </Layout>
    );
  }

  if (!escrow) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Escrow not found</p>
        </div>
      </Layout>
    );
  }

  const StatusIcon = statusConfig[escrow.status]?.icon || AlertCircle;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back
          </button>
        </div>
        <PageHeader
          title="Escrow Details"
          subtitle={`ID: ${escrow.id}`}
          icon={<FileText className="w-6 h-6 text-white" />}
          gradient="blue"
          action={
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <StatusIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white">
                {statusConfig[escrow.status]?.label || escrow.status}
              </span>
            </div>
          }
        />

        {/* Main Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-900">{escrow.description || 'N/A'}</p>
              </div>
              {escrow.buyer && (
                <div>
                  <p className="text-sm text-gray-600">Buyer</p>
                  <p className="font-medium text-gray-900">
                    <UserProfileLink
                      userId={escrow.buyerId}
                      name={escrow.buyer.firstName && escrow.buyer.lastName ? `${escrow.buyer.firstName} ${escrow.buyer.lastName}` : undefined}
                      email={escrow.buyer.email}
                    />
                  </p>
                </div>
              )}
              {escrow.seller && (
                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium text-gray-900">
                    <UserProfileLink
                      userId={escrow.sellerId}
                      name={escrow.seller.firstName && escrow.seller.lastName ? `${escrow.seller.firstName} ${escrow.seller.lastName}` : undefined}
                      email={escrow.seller.email}
                    />
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium text-gray-900 text-2xl">
                  {formatCurrency(escrow.amountCents, 'GHS')}
                </p>
              </div>
              {escrow.feeCents > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Fee</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(escrow.feeCents, 'GHS')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(escrow.netAmountCents, 'GHS')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-gray-900">{formatDate(escrow.createdAt)}</p>
              </div>
              {(escrow.deliveryRegion || escrow.deliveryCity || escrow.deliveryAddressLine) && (
                <div>
                  <p className="text-sm text-gray-600">Ship to</p>
                  <p className="font-medium text-gray-900">
                    {[escrow.deliveryAddressLine, escrow.deliveryCity, escrow.deliveryRegion].filter(Boolean).join(', ')}
                    {escrow.deliveryPhone && ` · ${escrow.deliveryPhone}`}
                  </p>
                </div>
              )}
              {isBuyer && firstShipmentWithCode && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Your delivery verification code</p>
                  <p className="text-xs text-amber-800 mb-2">Give the reference and code to the delivery person so they can confirm delivery. Only you and the system know this code.</p>
                  <p className="font-mono text-lg font-bold text-amber-900">Ref: {firstShipmentWithCode.shortReference} · Code: {firstShipmentWithCode.deliveryCode}</p>
                  <a href={`${confirmDeliveryBaseUrl}?ref=${encodeURIComponent(firstShipmentWithCode.shortReference!)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-700 hover:underline mt-2 inline-block">
                    Open confirm-delivery page (share with delivery person) →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {canFund && (
                <button
                  onClick={handleFund}
                  disabled={fundMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  {fundMutation.isPending ? 'Funding...' : 'Fund Escrow'}
                </button>
              )}
              {canShip && (
                <button
                  onClick={handleShip}
                  disabled={shipMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  {shipMutation.isPending ? 'Updating...' : 'Mark as Shipped'}
                </button>
              )}
              {canMarkServiceCompleted && (
                <button
                  onClick={handleServiceCompleted}
                  disabled={serviceCompletedMutation.isPending}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {serviceCompletedMutation.isPending ? 'Updating...' : 'Mark Service Completed'}
                </button>
              )}
              {canDeliver && (
                <>
                  <button
                    onClick={handleDeliver}
                    disabled={deliverMutation.isPending}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    {deliverMutation.isPending ? 'Updating...' : 'Confirm Delivery (no code)'}
                  </button>
                  {firstShipmentWithCode && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter delivery code"
                        value={deliveryCodeInput}
                        onChange={(e) => setDeliveryCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                        maxLength={6}
                      />
                      <button
                        onClick={handleConfirmDeliveryByCode}
                        disabled={confirmDeliveryByCodeMutation.isPending || !deliveryCodeInput.trim()}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm"
                      >
                        {confirmDeliveryByCodeMutation.isPending ? 'Checking...' : 'Confirm with code'}
                      </button>
                    </div>
                  )}
                </>
              )}
              {canRelease && (
                <button
                  onClick={handleRelease}
                  disabled={releaseMutation.isPending}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {releaseMutation.isPending
                    ? 'Releasing...'
                    : escrow?.status === 'AWAITING_RELEASE'
                    ? 'Confirm Service & Release Funds'
                    : 'Release Funds'}
                </button>
              )}
              {!canFund && !canShip && !canMarkServiceCompleted && !canDeliver && !canRelease && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No actions available for this status
                </p>
              )}
              <div className="pt-4 border-t">
                <Link
                  href={`/escrows/${id}/evidence`}
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Manage Evidence
                </Link>
              </div>
              {(escrow.status === 'FUNDED' || escrow.status === 'SHIPPED' || escrow.status === 'DELIVERED') && (
                <Link
                  href={`/disputes/new?escrowId=${id}`}
                  className="block w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-center"
                >
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Open Dispute
                </Link>
              )}
              {canRate && (
                <button
                  onClick={() => {
                    if (!escrow || !user) return;
                    const otherParty = isBuyer ? escrow.seller : escrow.buyer;
                    const otherPartyName = otherParty?.firstName && otherParty?.lastName
                      ? `${otherParty.firstName} ${otherParty.lastName}`
                      : otherParty?.email || 'User';
                    setRatingModal({
                      isOpen: true,
                      rateeId: isBuyer ? escrow.sellerId : escrow.buyerId,
                      rateeName: otherPartyName,
                      role: isBuyer ? 'seller' : 'buyer',
                    });
                  }}
                  className="block w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-center"
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Rate {isBuyer ? 'Seller' : 'Buyer'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Timeline, Ledger, Milestones */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Activity Timeline
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'ledger'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                Ledger View
              </button>
              {(escrow.milestones && escrow.milestones.length > 0) && (
                <button
                  onClick={() => setActiveTab('milestones')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'milestones'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Milestones
                </button>
              )}
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Messages
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'timeline' && <ActivityTimeline escrowId={escrow.id} />}
            {activeTab === 'ledger' && <LedgerView escrowId={escrow.id} />}
            {activeTab === 'milestones' && (
              <MilestoneManagement
                escrowId={escrow.id}
                buyerId={escrow.buyerId}
                sellerId={escrow.sellerId}
              />
            )}
            {activeTab === 'messages' && <EscrowMessaging escrowId={escrow.id} />}
          </div>
        </div>

        {/* Rating Modal */}
        {ratingModal.isOpen && escrow && ratingModal.rateeId && ratingModal.role && (
          <RatingModal
            isOpen={ratingModal.isOpen}
            onClose={() => setRatingModal({ isOpen: false })}
            escrowId={escrow.id}
            rateeId={ratingModal.rateeId}
            rateeName={ratingModal.rateeName || 'User'}
            role={ratingModal.role}
          />
        )}
      </div>
    </Layout>
  );
}

