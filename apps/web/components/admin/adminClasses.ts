import { cn } from '@/lib/utils';

/** Shared Tailwind classes for admin screens on the dark app shell. */
export const admin = {
  panel: 'rounded-[20px] border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card',
  panelPadded: 'rounded-[20px] border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 md:p-5',
  heading: 'text-lg font-semibold text-label-primary',
  subheading: 'text-sm text-label-secondary',
  label: 'block text-ios-footnote font-medium text-label-secondary mb-1.5',
  input:
    'w-full px-3 py-2.5 border border-white/20 rounded-[16px] bg-white/5 text-white placeholder:text-white/45 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none',
  select:
    'w-full px-3 py-2.5 border border-white/20 rounded-[16px] bg-[#2a1c1e] text-white focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none appearance-none',
  tableWrap: 'rounded-[20px] border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card overflow-hidden',
  tableToolbar: 'p-4 border-b border-white/10 bg-white/[0.04]',
  tableHead: 'bg-white/[0.06] border-b border-white/10',
  th: 'px-4 py-3 text-left text-xs font-semibold text-white/75 uppercase tracking-wider',
  tbody: 'divide-y divide-white/10',
  td: 'px-4 py-3 text-sm text-white align-middle',
  tdMuted: 'text-white/65',
  trHover: 'hover:bg-white/[0.06] transition-colors',
  muted: 'text-label-tertiary text-ios-footnote',
  selectedUserCard:
    'flex items-center justify-between p-4 rounded-[16px] border border-brand-gold/30 bg-brand-gold/10',
  selectedUserCardDanger:
    'flex items-center justify-between p-4 rounded-[16px] border border-red-500/30 bg-red-500/10',
  searchDropdown:
    'absolute z-10 w-full mt-2 rounded-[16px] border border-white/15 bg-[#261819] shadow-lg max-h-64 overflow-y-auto',
  searchDropdownItem:
    'w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 border-b border-white/10 last:border-0',
  calloutWarning:
    'rounded-[20px] border border-amber-500/35 bg-amber-500/15 p-4 flex items-start gap-3',
  actionCard:
    'rounded-[20px] border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-4 hover:bg-white/[0.1] hover:border-brand-gold/25 transition-all group block',
  sectionTitle: 'text-lg font-semibold text-white mb-3',
  footerBar: 'px-4 py-3 bg-white/[0.04] border-t border-white/10 text-sm text-white/70',
  linkAccent: 'text-brand-maroon hover:text-brand-maroon-dark text-sm font-medium',
  rowAction:
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] transition-colors touch-manipulation',
  calloutInfo:
    'rounded-[16px] border border-white/15 bg-white/[0.08] p-4 text-left text-sm text-label-secondary',
  modalPanel:
    'relative z-10 w-full max-w-md rounded-[20px] border border-white/15 bg-[#2a1c1e] shadow-ios-card p-6',
};

export function adminPanel(className?: string) {
  return cn(admin.panelPadded, className);
}
