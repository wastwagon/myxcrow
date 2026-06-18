import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ESCROW_CATEGORY, ESCROW_CATEGORY_LABELS } from '@/lib/escrow-services';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Package,
  Truck,
  CheckCircle,
  DollarSign,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Star,
  Copy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ActivityTimeline from '@/components/ActivityTimeline';
import LedgerView from '@/components/LedgerView';
import MilestoneManagement from '@/components/MilestoneManagement';
import EscrowMessaging from '@/components/EscrowMessaging';
import RatingModal from '@/components/RatingModal';
import UserProfileLink from '@/components/UserProfileLink';
import PageHeader from '@/components/PageHeader';
import { useConfirm, usePrompt } from '@/components/providers/UIProvider';
import { Button } from '@/components/ui/Button';
import { NavBar } from '@/components/ui/NavBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { PageDetailSkeleton } from '@/components/LoadingSkeleton';
import EscrowFeeSummary from '@/components/EscrowFeeSummary';
import { buildEscrowReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';

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
  escrowCategory?: string;
  serviceType?: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
  buyerWalletId?: string;
  sellerWalletId?: string;
  fundingMethod?: string;
  feeCents: number;
  feePercentage?: number;
  feePaidBy?: string;
  buyerFeeCents?: number;
  sellerFeeCents?: number;
  fundingAmountCents?: number;
  netAmountCents: number;
  deliveryPin?: string;
  deliveryRegion?: string;
  deliveryCity?: string;
  deliveryAddressLine?: string;
  deliveryPhone?: string;
  deliveryConfirmationMode?: 'code' | 'pin';
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
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'ledger' | 'milestones' | 'messages'>('timeline');
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; rateeId?: string; rateeName?: string; role?: 'buyer' | 'seller' }>({ isOpen: false });
  const isMobile = useIsMobileNav();

  const refreshEscrow = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrow', id] });
  };

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
  const isPhysicalGoods =
    !escrow?.escrowCategory || escrow.escrowCategory === 'PHYSICAL_GOODS';
  const isProfessionalService = escrow?.escrowCategory === 'PROFESSIONAL_SERVICE';
  const canFund = isBuyer && escrow?.status === 'AWAITING_FUNDING';
  const canShip = isSeller && escrow?.status === 'FUNDED' && isPhysicalGoods;
  const canDeliver = isBuyer && isPhysicalGoods && ['SHIPPED', 'IN_TRANSIT', 'FUNDED'].includes(escrow?.status || '');
  const canRelease = isBuyer && (escrow?.status === 'DELIVERED' || escrow?.status === 'AWAITING_RELEASE');
  const canMarkServiceCompleted = isSeller && escrow?.status === 'FUNDED' && isProfessionalService;
  const canRate = (isBuyer || isSeller) && escrow && ['RELEASED', 'REFUNDED'].includes(escrow.status);

  const statusConfig: Record<string, { label: string; icon: typeof Clock }> = {
    AWAITING_FUNDING: { label: 'Awaiting Funding', icon: Clock },
    FUNDED: { label: 'Funded', icon: DollarSign },
    SHIPPED: { label: 'Shipped', icon: Truck },
    DELIVERED: { label: 'Delivered', icon: Package },
    AWAITING_RELEASE: { label: 'Awaiting Release', icon: Clock },
    RELEASED: { label: 'Released', icon: CheckCircle },
    DISPUTED: { label: 'Disputed', icon: AlertCircle },
    CANCELLED: { label: 'Cancelled', icon: AlertCircle },
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

  const handleFund = async () => {
    const ok = await confirm({
      title: 'Fund escrow',
      message: 'Fund this escrow from your wallet?',
      confirmLabel: 'Fund',
    });
    if (ok) fundMutation.mutate();
  };

  const handleShip = async () => {
    const tracking = await prompt({
      title: 'Mark as shipped',
      message: 'Add a tracking number if you have one (optional).',
      placeholder: 'Tracking number',
      submitLabel: 'Mark shipped',
    });
    if (tracking === null) return;
    shipMutation.mutate({ trackingNumber: tracking || undefined });
  };

  const handleDeliver = async () => {
    const msg =
      escrow?.status === 'FUNDED'
        ? 'Confirm that you have received the item and release funds to the seller? This action cannot be undone.'
        : 'Confirm that you have received the item?';
    const ok = await confirm({
      title: 'Confirm delivery',
      message: msg,
      confirmLabel: 'Confirm',
      destructive: escrow?.status === 'FUNDED',
    });
    if (ok) deliverMutation.mutate();
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
  const transactionReference = escrow?.shipments?.find((s) => s.shortReference);
  const firstShipmentWithCode = escrow?.shipments?.find((s) => s.deliveryCode && s.shortReference);

  const feeSummary = escrow
    ? {
        amountCents: escrow.amountCents,
        feeCents: escrow.feeCents,
        feePercentage: escrow.feePercentage ?? 0,
        buyerFeeCents: escrow.buyerFeeCents ?? 0,
        sellerFeeCents: escrow.sellerFeeCents ?? escrow.feeCents,
        fundingAmountCents: escrow.fundingAmountCents || escrow.amountCents,
        netAmountCents: escrow.netAmountCents,
        paidBy: escrow.feePaidBy || 'seller',
      }
    : null;

  const handleRelease = async () => {
    const msg =
      escrow?.status === 'AWAITING_RELEASE'
        ? 'Confirm service completion and release funds to seller? This action cannot be undone.'
        : 'Release funds to seller? This action cannot be undone.';
    const ok = await confirm({
      title: 'Release funds',
      message: msg,
      confirmLabel: 'Release',
      destructive: true,
    });
    if (ok) releaseMutation.mutate();
  };

  const handleServiceCompleted = async () => {
    const ok = await confirm({
      title: 'Service completed',
      message:
        'Mark this escrow as "Service Completed" (no shipping)? Buyer will then be able to release funds.',
      confirmLabel: 'Mark completed',
    });
    if (ok) serviceCompletedMutation.mutate();
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <PageDetailSkeleton />
      </Layout>
    );
  }

  if (!escrow) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-label-tertiary mb-4" />
          <p className="text-label-secondary">Escrow not found</p>
        </div>
      </Layout>
    );
  }

  const StatusIcon = statusConfig[escrow.status]?.icon || AlertCircle;

  const tabOptions = [
    { value: 'timeline' as const, label: 'Timeline' },
    { value: 'ledger' as const, label: 'Ledger' },
    ...(escrow.milestones && escrow.milestones.length > 0
      ? [{ value: 'milestones' as const, label: 'Milestones' }]
      : []),
    { value: 'messages' as const, label: 'Messages' },
  ];

  const viewerRole: 'buyer' | 'seller' | 'admin' | undefined = isBuyer
    ? 'buyer'
    : isSeller
    ? 'seller'
    : isAdmin()
    ? 'admin'
    : undefined;

  const isStaffView = isAdmin() && !isBuyer && !isSeller;

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshEscrow} disabled={!isMobile} className="space-y-6">
        <div className="xl:hidden -mx-4 -mt-6 mb-2">
          <NavBar title="Escrow" showBack />
        </div>
        {isStaffView && (
          <div className="rounded-xl border border-brand-gold/35 bg-brand-gold/10 px-4 py-3 text-sm text-white/90">
            <strong className="text-brand-gold">Admin view</strong> — read-only access for records and printing.
            Participant actions are disabled.
          </div>
        )}
        <PageHeader
          title="Escrow Details"
          subtitle={`ID: ${escrow.id}`}
          icon={<FileText className="w-6 h-6" />}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <PrintReceiptButton
                receipt={buildEscrowReceipt(escrow, {
                  viewerRole,
                  isAdminCopy: viewerRole === 'admin',
                })}
                size="sm"
                variant="secondary"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                <StatusIcon className="w-5 h-5 text-brand-gold" />
                <span className="text-sm font-medium text-white">
                  {statusConfig[escrow.status]?.label || escrow.status}
                </span>
              </div>
            </div>
          }
        />

        {/* Main Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/70">Description</p>
                <p className="font-medium text-white">{escrow.description || 'N/A'}</p>
              </div>
              {escrow.escrowCategory && (
                <div>
                  <p className="text-sm text-white/70">Category</p>
                  <p className="font-medium text-white">
                    {ESCROW_CATEGORY_LABELS[escrow.escrowCategory as keyof typeof ESCROW_CATEGORY_LABELS] ?? escrow.escrowCategory}
                  </p>
                </div>
              )}
              {escrow.serviceType && (
                <div>
                  <p className="text-sm text-white/70">Service type</p>
                  <p className="font-medium text-white">{escrow.serviceType}</p>
                </div>
              )}
              {escrow.buyer && (
                <div>
                  <p className="text-sm text-white/70">Buyer</p>
                  <p className="font-medium text-white">
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
                  <p className="text-sm text-white/70">Seller</p>
                  <p className="font-medium text-white">
                    <UserProfileLink
                      userId={escrow.sellerId}
                      name={escrow.seller.firstName && escrow.seller.lastName ? `${escrow.seller.firstName} ${escrow.seller.lastName}` : undefined}
                      email={escrow.seller.email}
                    />
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-white/70">Deal Amount</p>
                <p className="font-medium text-white text-2xl">
                  {formatCurrency(escrow.amountCents, 'GHS')}
                </p>
              </div>
              {feeSummary && escrow.feeCents > 0 && (
                <div className="md:col-span-2">
                  <EscrowFeeSummary fees={feeSummary} className="!bg-amber-50/10 !border-amber-400/20" />
                </div>
              )}
              {(!feeSummary || escrow.feeCents === 0) && (
                <div>
                  <p className="text-sm text-white/70">Net Amount</p>
                  <p className="font-medium text-white">
                    {formatCurrency(escrow.netAmountCents, 'GHS')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-white/70">Created</p>
                <p className="font-medium text-white">{formatDate(escrow.createdAt)}</p>
              </div>
              {(escrow.deliveryRegion || escrow.deliveryCity || escrow.deliveryAddressLine) && isPhysicalGoods && (
                <div>
                  <p className="text-sm text-white/70">Ship to</p>
                  <p className="font-medium text-white">
                    {[escrow.deliveryAddressLine, escrow.deliveryCity, escrow.deliveryRegion].filter(Boolean).join(', ')}
                    {escrow.deliveryPhone && ` · ${escrow.deliveryPhone}`}
                  </p>
                </div>
              )}
              {(isBuyer || isSeller) && (transactionReference || escrow.deliveryPin || firstShipmentWithCode) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg md:col-span-2">
                  {escrow.deliveryConfirmationMode === 'pin' && escrow.deliveryPin ? (
                    <>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        {isSeller
                          ? isPhysicalGoods
                            ? 'Write this PIN on the parcel'
                            : 'Transaction PIN (share with buyer at handoff)'
                          : isPhysicalGoods
                          ? 'Your delivery confirmation PIN'
                          : 'Your transaction PIN'}
                      </p>
                      <p className="text-xs text-amber-800 mb-2">
                        {isSeller
                          ? isPhysicalGoods
                            ? 'The buyer set this PIN for delivery confirmation. Write the reference and PIN on the parcel.'
                            : 'The buyer set this PIN to identify and confirm the deal when the service is complete.'
                          : isPhysicalGoods
                          ? 'Use this reference and PIN on the confirm-delivery page when your order arrives. The seller also has this for parcel labelling.'
                          : 'Use this reference and PIN on the confirm-delivery page when the service is complete. The seller also has this as the deal identifier.'}
                      </p>
                      {transactionReference && (
                        <p className="font-mono text-lg font-bold text-amber-900">Ref: {transactionReference.shortReference}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <code className="font-mono text-lg font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded">
                          PIN: {escrow.deliveryPin}
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(escrow.deliveryPin!);
                            toast.success('PIN copied');
                          }}
                          className="px-2 py-1 text-sm text-amber-800 hover:bg-amber-100 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : firstShipmentWithCode ? (
                    <>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        {isSeller ? 'Write this on the parcel' : 'Your delivery verification code'}
                      </p>
                      <p className="text-xs text-amber-800 mb-2">
                        {isSeller
                          ? 'Write the reference and code on the parcel so delivery can be confirmed.'
                          : 'Share with the delivery person or confirm yourself when the order arrives.'}
                      </p>
                      <p className="font-mono text-lg font-bold text-amber-900">
                        Ref: {firstShipmentWithCode.shortReference} · Code: {firstShipmentWithCode.deliveryCode}
                      </p>
                    </>
                  ) : null}
                  {transactionReference && (
                    <a
                      href={`${confirmDeliveryBaseUrl}?ref=${encodeURIComponent(transactionReference.shortReference!)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-amber-700 hover:underline mt-2 inline-block"
                    >
                      Open confirm-delivery page →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              {canFund && (
                <Button
                  fullWidth
                  onClick={handleFund}
                  loading={fundMutation.isPending}
                  disabled={fundMutation.isPending}
                >
                  <DollarSign className="w-4 h-4" />
                  {fundMutation.isPending
                    ? 'Funding...'
                    : feeSummary && feeSummary.fundingAmountCents > escrow.amountCents
                    ? `Fund ${formatCurrency(feeSummary.fundingAmountCents, 'GHS')} from Wallet`
                    : 'Fund from Wallet'}
                </Button>
              )}
              {canShip && (
                <Button
                  fullWidth
                  variant="tinted"
                  onClick={handleShip}
                  loading={shipMutation.isPending}
                  disabled={shipMutation.isPending}
                >
                  <Truck className="w-4 h-4" />
                  {shipMutation.isPending ? 'Updating...' : 'Mark as Shipped'}
                </Button>
              )}
              {canMarkServiceCompleted && (
                <Button
                  fullWidth
                  variant="tinted"
                  onClick={handleServiceCompleted}
                  loading={serviceCompletedMutation.isPending}
                  disabled={serviceCompletedMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  {serviceCompletedMutation.isPending ? 'Updating...' : 'Mark Service Completed'}
                </Button>
              )}
              {canDeliver && (
                <>
                  <Button
                    fullWidth
                    onClick={handleDeliver}
                    loading={deliverMutation.isPending}
                    disabled={deliverMutation.isPending}
                  >
                    <Package className="w-4 h-4" />
                    {deliverMutation.isPending
                      ? 'Updating...'
                      : escrow?.status === 'FUNDED'
                      ? 'Confirm Received & Release Funds'
                      : 'Confirm Delivery (no code)'}
                  </Button>
                  {firstShipmentWithCode && escrow.deliveryConfirmationMode !== 'pin' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter delivery code"
                        value={deliveryCodeInput}
                        onChange={(e) => setDeliveryCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 min-h-[44px] px-3 py-2 border border-white/20 rounded-ios-lg bg-white/5 text-white text-sm font-mono uppercase placeholder:text-white/40"
                        maxLength={6}
                      />
                      <Button
                        size="sm"
                        onClick={handleConfirmDeliveryByCode}
                        loading={confirmDeliveryByCodeMutation.isPending}
                        disabled={confirmDeliveryByCodeMutation.isPending || !deliveryCodeInput.trim()}
                      >
                        {confirmDeliveryByCodeMutation.isPending ? 'Checking...' : 'Confirm'}
                      </Button>
                    </div>
                  )}
                  {transactionReference && escrow.deliveryConfirmationMode === 'pin' && escrow.deliveryPin && (
                    <p className="text-sm text-label-secondary mt-2">
                      Your PIN is shown above. Enter reference + PIN on the confirm-delivery page when the {isPhysicalGoods ? 'order arrives' : 'service is complete'}.
                    </p>
                  )}
                </>
              )}
              {canRelease && (
                <Button
                  fullWidth
                  onClick={handleRelease}
                  loading={releaseMutation.isPending}
                  disabled={releaseMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  {releaseMutation.isPending
                    ? 'Releasing...'
                    : escrow?.status === 'AWAITING_RELEASE'
                    ? 'Confirm Service & Release Funds'
                    : 'Release Funds'}
                </Button>
              )}
              {!canFund && !canShip && !canMarkServiceCompleted && !canDeliver && !canRelease && (
                <p className="text-sm text-white/70 text-center py-4">
                  No actions available for this status
                </p>
              )}
              <div className="pt-4 border-t">
                <Link
                  href={`/escrows/${id}/evidence`}
                  className="block w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-center"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Manage Evidence
                </Link>
              </div>
              {(['FUNDED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'AWAITING_RELEASE', 'RELEASED'] as string[]).includes(escrow.status) && (
                <Link
                  href={`/disputes/new?escrowId=${id}`}
                  className="block w-full px-4 py-2 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 text-center border border-red-400/30"
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
                  className="block w-full min-h-[44px] px-4 py-2 bg-brand-gold/20 text-brand-gold rounded-ios-lg hover:bg-brand-gold/30 text-center border border-brand-gold/30 touch-manipulation"
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Rate {isBuyer ? 'Seller' : 'Buyer'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Timeline, Ledger, Milestones */}
        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 shadow-xl shadow-black/10">
          <div className="p-4 border-b border-white/10 overflow-x-auto">
            <SegmentedControl
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
              scrollable
            />
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
      </PullToRefresh>
    </Layout>
  );
}

