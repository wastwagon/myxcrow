export interface ReceiptParty {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
}

export interface ReceiptAmountLine {
  label: string;
  amountCents: number;
  emphasize?: boolean;
}

export interface ReceiptSection {
  title?: string;
  rows: { label: string; value: string }[];
}

export interface ReceiptData {
  receiptNumber: string;
  transactionType: string;
  transactionTitle: string;
  status: string;
  statusLabel: string;
  currency: string;
  issuedAt: string;
  accountHolder?: ReceiptParty;
  counterparty?: ReceiptParty;
  amountLines: ReceiptAmountLine[];
  sections: ReceiptSection[];
  notes?: string[];
  isAdminCopy?: boolean;
}
