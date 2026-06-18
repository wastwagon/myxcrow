export const GHANA_BANKS = [
  'Absa Bank Ghana',
  'Access Bank Ghana',
  'Agricultural Development Bank (ADB)',
  'Bank of Africa Ghana',
  'CalBank',
  'Consolidated Bank Ghana',
  'Ecobank Ghana',
  'FBNBank Ghana',
  'Fidelity Bank Ghana',
  'First Atlantic Bank',
  'GCB Bank',
  'Guaranty Trust Bank (GTBank)',
  'National Investment Bank (NIB)',
  'OmniBSIC Bank',
  'Prudential Bank',
  'Republic Bank Ghana',
  'Societe Generale Ghana',
  'Stanbic Bank Ghana',
  'Standard Chartered Bank Ghana',
  'United Bank for Africa (UBA)',
  'Universal Merchant Bank (UMB)',
  'Zenith Bank Ghana',
] as const;

export type GhanaBank = (typeof GHANA_BANKS)[number];

export type MobileMoneyNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';

export const MOBILE_MONEY_NETWORKS: { value: MobileMoneyNetwork; label: string }[] = [
  { value: 'MTN', label: 'MTN Mobile Money' },
  { value: 'VODAFONE', label: 'Telecel Cash (Vodafone)' },
  { value: 'AIRTELTIGO', label: 'AirtelTigo Money' },
];

export const WITHDRAWAL_METHOD_LABELS: Record<string, string> = {
  BANK_ACCOUNT: 'Bank transfer',
  MOBILE_MONEY: 'Mobile money',
  MANUAL: 'Manual',
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Pending review',
  PROCESSING: 'Processing',
  SUCCEEDED: 'Approved',
  FAILED: 'Denied',
  CANCELED: 'Canceled',
};
