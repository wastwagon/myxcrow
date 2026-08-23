import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';

export interface EscrowRecord {
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

export type EscrowHistoryTab = 'all' | 'needs' | 'closed';

export const NEEDS_YOU_STATUSES = [
  'AWAITING_FUNDING',
  'FUNDED',
  'AWAITING_SHIPMENT',
  'AWAITING_RELEASE',
  'DELIVERED',
  'DISPUTED',
];

export function parseEscrowHistoryTab(value: string | string[] | undefined): EscrowHistoryTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'needs' || raw === 'closed') return raw;
  return 'all';
}

export function displayEscrowCents(escrow: EscrowRecord, isBuyer: boolean) {
  return isBuyer
    ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
    : escrow.netAmountCents ?? escrow.amountCents;
}

export function formatEscrowWhen(date: string) {
  const d = new Date(date);
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${day} | ${time}`;
}

export function filterEscrowsByTab(escrows: EscrowRecord[], tab: EscrowHistoryTab) {
  const sorted = [...escrows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (tab === 'needs') {
    return sorted.filter((e) => NEEDS_YOU_STATUSES.includes(e.status));
  }
  if (tab === 'closed') {
    return sorted.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status));
  }
  return sorted;
}

export function countEscrowsByTab(escrows: EscrowRecord[], tab: EscrowHistoryTab) {
  return filterEscrowsByTab(escrows, tab).length;
}
