import { cn } from '@/lib/utils';

/** Shared Tailwind classes for admin screens on the dark app shell. */
export const admin = {
  panel: 'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card',
  panelPadded: 'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6',
  heading: 'text-ios-title-3 font-semibold text-label-primary',
  subheading: 'text-ios-subhead text-label-secondary',
  label: 'block text-ios-footnote font-medium text-label-secondary mb-1.5',
  input:
    'w-full px-4 py-3 border border-white/20 rounded-ios-lg bg-white/5 text-label-primary placeholder:text-label-tertiary focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none',
  select:
    'w-full px-4 py-3 border border-white/20 rounded-ios-lg bg-white/5 text-label-primary focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none appearance-none',
  tableWrap: 'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card overflow-hidden',
  tableHead: 'bg-white/5 border-b border-white/10',
  th: 'px-6 py-4 text-left text-xs font-semibold text-label-secondary uppercase tracking-wider',
  td: 'px-6 py-4 text-sm text-label-primary',
  trHover: 'hover:bg-white/5 transition-colors',
  divider: 'divide-y divide-white/10',
  muted: 'text-label-tertiary text-ios-footnote',
  selectedUserCard:
    'flex items-center justify-between p-4 rounded-ios-lg border border-brand-gold/30 bg-brand-gold/10',
  selectedUserCardDanger:
    'flex items-center justify-between p-4 rounded-ios-lg border border-red-500/30 bg-red-500/10',
  searchDropdown:
    'absolute z-10 w-full mt-2 rounded-ios-lg border border-white/15 bg-[#261819] shadow-lg max-h-64 overflow-y-auto',
  searchDropdownItem:
    'w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 border-b border-white/10 last:border-0',
  calloutWarning:
    'rounded-ios-xl border border-amber-500/35 bg-amber-500/15 p-4 flex items-start gap-3',
  listRowHover:
    'block p-4 border border-white/10 rounded-ios-lg hover:border-brand-gold/35 hover:bg-white/10 transition-all',
  linkAccent: 'text-brand-gold hover:text-brand-gold/80 text-sm font-medium',
  rowAction: 'p-2 rounded-ios-lg transition-colors',
  calloutInfo:
    'rounded-ios-lg border border-white/15 bg-white/[0.08] p-4 text-left text-sm text-label-secondary',
  modalPanel:
    'relative z-10 w-full max-w-md rounded-ios-xl border border-white/15 bg-[#2a1c1e] shadow-ios-card p-6',
};

export function adminPanel(className?: string) {
  return cn(admin.panelPadded, className);
}
