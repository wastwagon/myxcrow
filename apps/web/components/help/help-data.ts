import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  FileText,
  KeyRound,
  Plus,
  Scale,
  Shield,
  Wallet,
} from 'lucide-react';

export type HelpTopic = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  keywords: string[];
};

export type HelpFaq = {
  id: string;
  q: string;
  a: string;
  topicId: string;
  keywords: string[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'escrow',
    icon: Shield,
    title: 'Escrow & payments',
    body: 'Create escrows, fund milestones, release funds, and handle refunds safely.',
    keywords: ['escrow', 'payment', 'fund', 'release', 'milestone', 'refund', 'buyer', 'seller'],
  },
  {
    id: 'wallet',
    icon: Wallet,
    title: 'Wallet & withdrawals',
    body: 'Top up via Paystack, track your balance, and request withdrawals.',
    keywords: ['wallet', 'top up', 'withdraw', 'paystack', 'balance', 'mobile money', 'bank'],
  },
  {
    id: 'disputes',
    icon: AlertCircle,
    title: 'Disputes',
    body: 'Open a case, upload evidence, and follow our mediation process.',
    keywords: ['dispute', 'evidence', 'mediation', 'refund', 'complaint'],
  },
  {
    id: 'account',
    icon: FileText,
    title: 'Account & phone',
    body: 'Registration, SMS phone verification, password, and profile settings.',
    keywords: ['account', 'phone', 'password', 'profile', 'otp', 'sms', 'register'],
  },
];

export const HELP_FAQS: HelpFaq[] = [
  {
    id: 'protection',
    topicId: 'escrow',
    q: 'How are my funds protected?',
    a: 'MYXCROW holds funds in a secure escrow account. Money is released only when both buyer and seller confirm the transaction is complete. If there is a dispute, our team mediates before any release.',
    keywords: ['safe', 'secure', 'protected', 'hold'],
  },
  {
    id: 'fees',
    topicId: 'escrow',
    q: 'What fees do you charge?',
    a: 'We charge a small percentage fee on each successful transaction. There are no monthly subscriptions or hidden charges. The exact fee is shown before you confirm an escrow.',
    keywords: ['fee', 'cost', 'charge', 'percentage'],
  },
  {
    id: 'ghana',
    topicId: 'escrow',
    q: 'Is MYXCROW available in Ghana?',
    a: 'Yes. MYXCROW is built for Ghana and operates in Ghana Cedis (₵). It is suitable for local and diaspora transactions, including real estate, goods, and services.',
    keywords: ['ghana', 'cedis', 'local', 'diaspora'],
  },
  {
    id: 'start-escrow',
    topicId: 'escrow',
    q: 'How do I start an escrow?',
    a: 'Register with your Ghana phone number and enter the SMS verification code. Once verified, you can create and fund escrows.',
    keywords: ['create', 'new', 'start', 'begin'],
  },
  {
    id: 'fund-wallet',
    topicId: 'wallet',
    q: 'How do I fund my wallet?',
    a: 'Go to Wallet → Top up. You can add funds via Paystack (card or mobile money). Once payment is confirmed, the amount is credited to your wallet and you can use it to fund escrows.',
    keywords: ['top up', 'deposit', 'paystack', 'card'],
  },
  {
    id: 'withdrawal-time',
    topicId: 'wallet',
    q: 'How long does withdrawal take?',
    a: 'Withdrawal requests are reviewed by our team. Once approved, funds are sent to your registered bank or mobile money account. Typical processing is within 1–3 business days.',
    keywords: ['withdraw', 'payout', 'processing', 'days'],
  },
  {
    id: 'dispute-process',
    topicId: 'disputes',
    q: 'What if I have a dispute with the other party?',
    a: 'Open a dispute from the escrow page. Add a reason and any evidence (e.g. photos, messages). Our team will review and may mediate. Funds remain held until the dispute is resolved.',
    keywords: ['dispute', 'problem', 'issue', 'evidence'],
  },
  {
    id: 'phone-verify',
    topicId: 'account',
    q: 'How is my phone verified?',
    a: 'When you register, we send a one-time SMS code to your Ghana mobile number. Entering that code completes verification. No ID documents are required.',
    keywords: ['phone', 'verify', 'otp', 'sms', 'registration', 'code'],
  },
  {
    id: 'password-reset',
    topicId: 'account',
    q: 'I forgot my password. How do I reset it?',
    a: 'On the login page, tap Forgot password and enter your email or phone. We will send a reset link or code. If you do not receive it, check spam or contact support.',
    keywords: ['password', 'forgot', 'reset', 'login'],
  },
  {
    id: 'delete-account',
    topicId: 'account',
    q: 'Can I delete my account?',
    a: 'Yes. In Account, use Delete account. You will need to enter your password. Account data is anonymized and you will be signed out. This cannot be undone.',
    keywords: ['delete', 'remove', 'close account'],
  },
];

export type HelpQuickLink = {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
};

export const HELP_QUICK_LINKS: HelpQuickLink[] = [
  { href: '/escrows/new', label: 'New escrow', subtitle: 'Start protected', icon: Plus },
  { href: '/wallet', label: 'Wallet', subtitle: 'Balance & top up', icon: Wallet },
  { href: '/disputes', label: 'Disputes', subtitle: 'Your cases', icon: Scale },
  { href: '/change-password', label: 'Password', subtitle: 'Security', icon: KeyRound },
  { href: '/escrows/history', label: 'History', subtitle: 'Past escrows', icon: Shield },
];
