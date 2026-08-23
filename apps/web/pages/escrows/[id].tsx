import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ESCROW_CATEGORY, ESCROW_CATEGORY_LABELS } from '@/lib/escrow-services';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Package,
  Truck,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Upload,
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
import { useConfirm, usePrompt } from '@/components/providers/UIProvider';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Input } from '@/components/ui/Input';
import { Banner } from '@/components/ui/Banner';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { PageDetailSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import EscrowFeeSummary from '@/components/EscrowFeeSummary';
import { StatusBadge } from '@/components/StatusBadge';
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
  const authed = useRequireAuth();

  const refreshEscrow = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrow', id] });
  };

  const { data: escrow, isLoading } = useQuery<Escrow>({
    queryKey: ['escrow', id],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${id}`);
      return response.data;
    },
    enabled: authed && !!id,
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

  const handleConfirmDeliveryByCode = async () => {
    const code = deliveryCodeInput.trim();
    if (!code) {
      toast.error('Enter the delivery code');
      return;
    }
    const ok = await confirm({
      title: 'Confirm delivery',
      message: 'Confirm delivery with this code? This may release funds.',
      confirmLabel: 'Confirm',
      destructive: true,
    });
    if (ok) confirmDeliveryByCodeMutation.mutate(code);
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

  if (!authed) {
    return <PageSpinner />;
  }

  if (isLoading) {
    return (
      <CustomerLayout title="Escrow" back>
        <PageDetailSkeleton />
      </CustomerLayout>
    );
  }

  if (!escrow) {
    return (
      <CustomerLayout title="Escrow" back>
        <EmptyState
          tone="light"
          icon={<AlertCircle className="h-6 w-6" />}
          title="Escrow not found"
          description="It may have been removed, or the link is incorrect."
          action={{ href: '/escrows/history', label: 'View escrow history', variant: 'maroon' }}
        />
      </CustomerLayout>
    );
  }

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
    <CustomerLayout title="Escrow" back>
      <PullToRefresh onRefresh={refreshEscrow} disabled={!isMobile} className="space-y-6">
        {isStaffView && (
          <Banner light tone="brand" title="Admin view">
            Read-only access for records and printing. Participant actions are disabled.
          </Banner>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] truncate">ID {escrow.id}</p>
          <StatusBadge status={escrow.status} onDark={false} />
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintReceiptButton
            receipt={buildEscrowReceipt(escrow, {
              viewerRole,
              isAdminCopy: viewerRole === 'admin',
            })}
            size="sm"
            variant="outline"
          />
        </div>

        {/* Main Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-[20px] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[rgba(60,60,67,0.6)]">Description</p>
                <p className="font-medium text-gray-900">{escrow.description || 'N/A'}</p>
              </div>
              {escrow.escrowCategory && (
                <div>
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Category</p>
                  <p className="font-medium text-gray-900">
                    {ESCROW_CATEGORY_LABELS[escrow.escrowCategory as keyof typeof ESCROW_CATEGORY_LABELS] ?? escrow.escrowCategory}
                  </p>
                </div>
              )}
              {escrow.serviceType && (
                <div>
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Service type</p>
                  <p className="font-medium text-gray-900">{escrow.serviceType}</p>
                </div>
              )}
              {escrow.buyer && (
                <div>
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Buyer</p>
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
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Seller</p>
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
                <p className="text-sm text-[rgba(60,60,67,0.6)]">Deal Amount</p>
                <p className="font-semibold text-gray-900 text-[22px] tracking-tight">
                  {formatCurrency(escrow.amountCents, 'GHS')}
                </p>
              </div>
              {feeSummary && escrow.feeCents > 0 && (
                <div className="md:col-span-2">
                  <EscrowFeeSummary fees={feeSummary} />
                </div>
              )}
              {(!feeSummary || escrow.feeCents === 0) && (
                <div>
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Net Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(escrow.netAmountCents, 'GHS')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-[rgba(60,60,67,0.6)]">Created</p>
                <p className="font-medium text-gray-900">{formatDate(escrow.createdAt)}</p>
              </div>
              {(escrow.deliveryRegion || escrow.deliveryCity || escrow.deliveryAddressLine) && isPhysicalGoods && (
                <div>
                  <p className="text-sm text-[rgba(60,60,67,0.6)]">Ship to</p>
                  <p className="font-medium text-gray-900">
                    {[escrow.deliveryAddressLine, escrow.deliveryCity, escrow.deliveryRegion].filter(Boolean).join(', ')}
                    {escrow.deliveryPhone && ` · ${escrow.deliveryPhone}`}
                  </p>
                </div>
              )}
              {(isBuyer || isSeller) && (transactionReference || escrow.deliveryPin || firstShipmentWithCode) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-[20px] md:col-span-2">
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
                        <code className="font-mono text-lg font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-[20px]">
                          PIN: {escrow.deliveryPin}
                        </code>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(escrow.deliveryPin!);
                            toast.success('PIN copied');
                          }}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-amber-900 hover:bg-amber-100 rounded-[20px] touch-manipulation"
                          aria-label="Copy PIN"
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
                      className="inline-flex min-h-[44px] items-center text-sm font-semibold text-amber-900 hover:underline mt-2 touch-manipulation"
                    >
                      Open confirm-delivery page →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-[20px] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {canFund && (
                <Button
                  fullWidth
                  variant="maroon"
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
                  variant="outline"
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
                  variant="outline"
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
                    variant="maroon"
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
                      <Input
                        type="text"
                        tone="light"
                        placeholder="Enter delivery code"
                        value={deliveryCodeInput}
                        onChange={(e) => setDeliveryCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 font-mono uppercase"
                        maxLength={6}
                      />
                      <Button
                        size="sm"
                        variant="maroon"
                        onClick={handleConfirmDeliveryByCode}
                        loading={confirmDeliveryByCodeMutation.isPending}
                        disabled={confirmDeliveryByCodeMutation.isPending || !deliveryCodeInput.trim()}
                      >
                        {confirmDeliveryByCodeMutation.isPending ? 'Checking...' : 'Confirm'}
                      </Button>
                    </div>
                  )}
                  {transactionReference && escrow.deliveryConfirmationMode === 'pin' && escrow.deliveryPin && (
                    <p className="text-sm text-[rgba(60,60,67,0.6)] mt-2">
                      Your PIN is shown above. Enter reference + PIN on the confirm-delivery page when the {isPhysicalGoods ? 'order arrives' : 'service is complete'}.
                    </p>
                  )}
                </>
              )}
              {canRelease && (
                <Button
                  fullWidth
                  variant="maroon"
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
              <div className="pt-4 border-t border-[rgba(60,60,67,0.12)] space-y-2">
                <ButtonLink href={`/escrows/${id}/evidence`} variant="outline" fullWidth>
                  <Upload className="w-4 h-4" />
                  Manage Evidence
                </ButtonLink>
              </div>
              {(['FUNDED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'AWAITING_RELEASE', 'RELEASED'] as string[]).includes(escrow.status) && (
                <ButtonLink href={`/disputes/new?escrowId=${id}`} variant="destructive" fullWidth>
                  <AlertCircle className="w-4 h-4" />
                  Open Dispute
                </ButtonLink>
              )}
              {canRate && (
                <Button
                  type="button"
                  variant="outline"
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
                >
                  <Star className="w-4 h-4" />
                  Rate {isBuyer ? 'Seller' : 'Buyer'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Timeline, Ledger, Milestones */}
        <div className="rounded-[20px] bg-white overflow-hidden">
          <div className="p-4 border-b border-[rgba(60,60,67,0.12)] overflow-x-auto">
            <SegmentedControl
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
              scrollable
              tone="light"
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
    </CustomerLayout>
  );
}

