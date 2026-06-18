import type { ReceiptData, ReceiptParty, ReceiptAmountLine } from '@/lib/receipt-types';
import { ESCROW_CATEGORY_LABELS } from '@/lib/escrow-services';
import {
  formatPayoutSummary,
  formatWithdrawalMethodLabel,
  formatWithdrawalStatusLabel,
} from '@/lib/withdrawal-payout';
import type { WithdrawalRecord } from '@/components/admin/WithdrawalPayoutDetails';

const FUNDING_SOURCE_LABELS: Record<string, string> = {
  PAYSTACK_TOPUP: 'Wallet top-up (Paystack)',
  BANK_TRANSFER: 'Bank transfer',
  PROMO: 'Promotional credit',
  ADJUSTMENT: 'Balance adjustment',
  REFUND: 'Refund',
};

const FUNDING_STATUS_LABELS: Record<string, string> = {
  SUCCEEDED: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
  CANCELED: 'Cancelled',
};

const ESCROW_STATUS_LABELS: Record<string, string> = {
  AWAITING_FUNDING: 'Awaiting funding',
  FUNDED: 'Funded',
  AWAITING_SHIPMENT: 'Awaiting shipment',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  AWAITING_RELEASE: 'Awaiting release',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
};

function partyFromUser(user?: {
  id?: string;
  email?: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
} | null): ReceiptParty | undefined {
  if (!user) return undefined;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
  return {
    name,
    email: user.email,
    phone: user.phone,
    userId: user.id,
  };
}

function formatPerson(p?: ReceiptParty): string {
  if (!p) return '—';
  const parts = [p.name, p.email, p.phone].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

export function buildWalletFundingReceipt(
  funding: {
    id: string;
    amountCents: number;
    feeCents?: number;
    currency?: string;
    sourceType?: string;
    externalRef?: string | null;
    status: string;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
  },
  accountHolder?: ReceiptParty,
  options?: { isAdminCopy?: boolean },
): ReceiptData {
  const currency = funding.currency || 'GHS';
  const grossCents = Math.abs(funding.amountCents);
  const feeCents = funding.feeCents ?? 0;
  const meta = funding.metadata || {};
  const description =
    typeof meta.description === 'string'
      ? meta.description
      : typeof meta.type === 'string'
      ? meta.type.replace(/_/g, ' ')
      : undefined;

  const amountLines: ReceiptAmountLine[] = [
    { label: 'Amount credited', amountCents: grossCents, emphasize: true },
  ];
  if (feeCents > 0) {
    amountLines.push({ label: 'Processing fee', amountCents: feeCents });
  }

  const sections: ReceiptData['sections'] = [
    {
      title: 'Transaction details',
      rows: [
        {
          label: 'Source',
          value: FUNDING_SOURCE_LABELS[funding.sourceType || ''] || funding.sourceType || 'Wallet funding',
        },
        ...(funding.externalRef
          ? [{ label: 'External reference', value: funding.externalRef }]
          : []),
        ...(description ? [{ label: 'Description', value: description }] : []),
      ],
    },
  ];

  return {
    receiptNumber: funding.id,
    transactionType: 'WALLET_FUNDING',
    transactionTitle: 'Wallet Funding Receipt',
    status: funding.status,
    statusLabel: FUNDING_STATUS_LABELS[funding.status] || funding.status,
    currency,
    issuedAt: funding.createdAt,
    accountHolder,
    amountLines,
    sections,
    notes: [
      'This receipt confirms a wallet funding transaction on MYXCROW.',
      'Funds are held in your MYXCROW wallet and may be used for escrow deals or withdrawals.',
    ],
    isAdminCopy: options?.isAdminCopy,
  };
}

export function buildWithdrawalReceipt(
  withdrawal: WithdrawalRecord | {
    id: string;
    amountCents: number;
    feeCents?: number;
    currency?: string;
    status: string;
    methodType: string;
    methodLabel?: string;
    payoutSummary?: string;
    methodDetails?: Record<string, unknown>;
    createdAt: string;
    processedAt?: string | null;
    failureReason?: string | null;
    wallet?: WithdrawalRecord['wallet'];
  },
  accountHolder?: ReceiptParty,
  options?: { isAdminCopy?: boolean; showSensitive?: boolean },
): ReceiptData {
  const currency = withdrawal.currency || withdrawal.wallet?.currency || 'GHS';
  const user = withdrawal.wallet?.user;
  const holder = accountHolder || partyFromUser(user);
  const payout = formatPayoutSummary(
    withdrawal.methodType,
    withdrawal.methodDetails as Parameters<typeof formatPayoutSummary>[1],
    withdrawal.payoutSummary,
  );

  const payoutRows: { label: string; value: string }[] = [
    {
      label: 'Payout method',
      value: withdrawal.methodLabel || formatWithdrawalMethodLabel(withdrawal.methodType),
    },
    { label: 'Payout destination', value: payout },
  ];

  if (options?.showSensitive && withdrawal.methodDetails) {
    const d = withdrawal.methodDetails as Record<string, string | undefined>;
    if (d.accountName) payoutRows.push({ label: 'Account name', value: d.accountName });
    if (d.accountNumber) payoutRows.push({ label: 'Account number', value: d.accountNumber });
    if (d.bankName) payoutRows.push({ label: 'Bank', value: d.bankName });
    if (d.branch) payoutRows.push({ label: 'Branch', value: d.branch });
    if (d.network) payoutRows.push({ label: 'Network', value: d.network });
    if (d.mobileNumber) payoutRows.push({ label: 'Mobile number', value: d.mobileNumber });
  }

  const sections: ReceiptData['sections'] = [
    { title: 'Payout details', rows: payoutRows },
  ];

  if (withdrawal.processedAt) {
    sections.push({
      title: 'Processing',
      rows: [
        { label: 'Processed at', value: new Date(withdrawal.processedAt).toLocaleString('en-GH') },
        ...(withdrawal.failureReason
          ? [{ label: 'Failure reason', value: withdrawal.failureReason }]
          : []),
      ],
    });
  }

  const amountLines: ReceiptAmountLine[] = [
    { label: 'Withdrawal amount', amountCents: withdrawal.amountCents, emphasize: true },
  ];
  if ((withdrawal.feeCents ?? 0) > 0) {
    amountLines.push({ label: 'Withdrawal fee', amountCents: withdrawal.feeCents! });
  }

  return {
    receiptNumber: withdrawal.id,
    transactionType: 'WITHDRAWAL',
    transactionTitle: 'Withdrawal Receipt',
    status: withdrawal.status,
    statusLabel: formatWithdrawalStatusLabel(withdrawal.status),
    currency,
    issuedAt: withdrawal.createdAt,
    accountHolder: holder,
    amountLines,
    sections,
    notes: [
      'This receipt documents a withdrawal request from your MYXCROW wallet.',
      options?.isAdminCopy
        ? 'Admin copy — contains payout details for processing and audit.'
        : 'Payout is processed to the destination shown above once approved.',
    ],
    isAdminCopy: options?.isAdminCopy,
  };
}

export function buildEscrowReceipt(
  escrow: {
    id: string;
    status: string;
    amountCents: number;
    currency?: string;
    description?: string | null;
    escrowCategory?: string | null;
    serviceType?: string | null;
    createdAt: string;
    fundedAt?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    releasedAt?: string | null;
    feeCents?: number;
    feePercentage?: number;
    feePaidBy?: string;
    buyerFeeCents?: number;
    sellerFeeCents?: number;
    fundingAmountCents?: number;
    netAmountCents?: number;
    fundingMethod?: string;
    buyer?: { email?: string; firstName?: string; lastName?: string; phone?: string };
    seller?: { email?: string; firstName?: string; lastName?: string; phone?: string };
    shipments?: { shortReference?: string | null }[];
    deliveryPin?: string;
    deliveryConfirmationMode?: string;
  },
  options?: { isAdminCopy?: boolean; viewerRole?: 'buyer' | 'seller' | 'admin' },
): ReceiptData {
  const currency = escrow.currency || 'GHS';
  const buyer = partyFromUser(escrow.buyer);
  const seller = partyFromUser(escrow.seller);
  const ref = escrow.shipments?.find((s) => s.shortReference)?.shortReference;

  const amountLines: ReceiptData['amountLines'] = [
    { label: 'Deal amount', amountCents: escrow.amountCents, emphasize: true },
  ];
  if ((escrow.buyerFeeCents ?? 0) > 0) {
    amountLines.push({ label: 'Buyer fee', amountCents: escrow.buyerFeeCents! });
  }
  if ((escrow.fundingAmountCents ?? 0) > escrow.amountCents) {
    amountLines.push({
      label: 'Total funded from buyer wallet',
      amountCents: escrow.fundingAmountCents!,
    });
  }
  if ((escrow.sellerFeeCents ?? 0) > 0) {
    amountLines.push({ label: 'Seller fee', amountCents: escrow.sellerFeeCents! });
  }
  if (escrow.netAmountCents != null) {
    amountLines.push({ label: 'Net to seller', amountCents: escrow.netAmountCents });
  }

  const timelineRows: { label: string; value: string }[] = [
    { label: 'Created', value: new Date(escrow.createdAt).toLocaleString('en-GH') },
  ];
  if (escrow.fundedAt) timelineRows.push({ label: 'Funded', value: new Date(escrow.fundedAt).toLocaleString('en-GH') });
  if (escrow.shippedAt) timelineRows.push({ label: 'Shipped', value: new Date(escrow.shippedAt).toLocaleString('en-GH') });
  if (escrow.deliveredAt) timelineRows.push({ label: 'Delivered / completed', value: new Date(escrow.deliveredAt).toLocaleString('en-GH') });
  if (escrow.releasedAt) timelineRows.push({ label: 'Released', value: new Date(escrow.releasedAt).toLocaleString('en-GH') });

  const sections: ReceiptData['sections'] = [
    {
      title: 'Deal information',
      rows: [
        { label: 'Description', value: escrow.description || '—' },
        ...(escrow.escrowCategory
          ? [{
              label: 'Category',
              value:
                ESCROW_CATEGORY_LABELS[escrow.escrowCategory as keyof typeof ESCROW_CATEGORY_LABELS] ||
                escrow.escrowCategory,
            }]
          : []),
        ...(escrow.serviceType ? [{ label: 'Service type', value: escrow.serviceType }] : []),
        { label: 'Funding method', value: escrow.fundingMethod === 'wallet' ? 'MYXCROW wallet' : 'Direct payment' },
        ...(ref ? [{ label: 'Transaction reference', value: ref }] : []),
        ...(escrow.deliveryConfirmationMode === 'pin' && escrow.deliveryPin
          ? [{ label: 'Confirmation PIN', value: escrow.deliveryPin }]
          : []),
      ],
    },
    {
      title: 'Parties',
      rows: [
        { label: 'Buyer', value: formatPerson(buyer) },
        { label: 'Seller', value: formatPerson(seller) },
      ],
    },
    { title: 'Timeline', rows: timelineRows },
  ];

  if ((escrow.feeCents ?? 0) > 0) {
    sections.splice(1, 0, {
      title: 'Fees',
      rows: [
        { label: 'Platform fee', value: `${((escrow.feeCents ?? 0) / 100).toFixed(2)} ${currency}` },
        ...(escrow.feePercentage != null
          ? [{ label: 'Fee rate', value: `${escrow.feePercentage}%` }]
          : []),
        ...(escrow.feePaidBy ? [{ label: 'Paid by', value: escrow.feePaidBy }] : []),
      ],
    });
  }

  return {
    receiptNumber: escrow.id,
    transactionType: 'ESCROW',
    transactionTitle: 'Escrow Transaction Receipt',
    status: escrow.status,
    statusLabel: ESCROW_STATUS_LABELS[escrow.status] || escrow.status,
    currency,
    issuedAt: escrow.createdAt,
    accountHolder: options?.viewerRole === 'seller' ? seller : buyer,
    counterparty: options?.viewerRole === 'seller' ? buyer : seller,
    amountLines,
    sections,
    notes: [
      'This is an official MYXCROW escrow transaction receipt.',
      'Funds are held securely until delivery or service completion per escrow terms.',
    ],
    isAdminCopy: options?.isAdminCopy,
  };
}

export function buildLedgerReceipt(
  journal: {
    id: string;
    type: string;
    description?: string | null;
    createdAt: string;
    entries: { account: string; amountCents: number; currency?: string }[];
  },
  escrowId: string,
  options?: { isAdminCopy?: boolean },
): ReceiptData {
  const ACCOUNT_LABELS: Record<string, string> = {
    buyer_wallet: 'Buyer wallet',
    seller_wallet: 'Seller wallet',
    escrow_hold: 'Escrow hold',
    fees_revenue: 'Platform fees',
    user_wallet: 'User wallet',
    funding_source: 'Funding source',
    payout_destination: 'Payout destination',
    admin_adjustments: 'Admin adjustments',
  };

  const currency = journal.entries[0]?.currency || 'GHS';
  const typeLabel = journal.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    receiptNumber: journal.id,
    transactionType: 'LEDGER',
    transactionTitle: 'Escrow Ledger Receipt',
    status: 'POSTED',
    statusLabel: 'Posted',
    currency,
    issuedAt: journal.createdAt,
    amountLines: journal.entries.map((e) => ({
      label: ACCOUNT_LABELS[e.account] || e.account,
      amountCents: Math.abs(e.amountCents),
      emphasize: false,
    })),
    sections: [
      {
        title: 'Journal entry',
        rows: [
          { label: 'Escrow ID', value: escrowId },
          { label: 'Journal type', value: typeLabel },
          ...(journal.description ? [{ label: 'Description', value: journal.description }] : []),
          ...journal.entries.map((e) => ({
            label: ACCOUNT_LABELS[e.account] || e.account,
            value: `${e.amountCents >= 0 ? '+' : '−'}${(Math.abs(e.amountCents) / 100).toFixed(2)} ${e.currency || currency}`,
          })),
        ],
      },
    ],
    notes: ['Double-entry ledger record for escrow financial activity on MYXCROW.'],
    isAdminCopy: options?.isAdminCopy,
  };
}

export function buildAdminTopUpReceipt(tx: {
  id: string;
  amountCents: number;
  status: string;
  sourceType?: string;
  userEmail?: string | null;
  userName?: string | null;
  createdAt: string;
}): ReceiptData {
  return buildWalletFundingReceipt(
    {
      id: tx.id,
      amountCents: tx.amountCents,
      status: tx.status,
      sourceType: tx.sourceType,
      createdAt: tx.createdAt,
    },
    {
      name: tx.userName,
      email: tx.userEmail,
    },
    { isAdminCopy: true },
  );
}
