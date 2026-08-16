/** Shared form field classes — colors come from CSS variables so customer-app can go light. */
export const form = {
  panel:
    'rounded-[12px] border border-[var(--form-panel-border)] bg-[var(--form-panel-bg)] p-5 sm:p-6',
  label: 'block text-[13px] font-medium text-[var(--form-label)] mb-1.5',
  input:
    'w-full min-h-[44px] px-4 py-3 rounded-[12px] border border-[var(--form-input-border)] bg-[var(--form-input-bg)] text-[var(--form-input-text)] placeholder:text-[var(--form-placeholder)] focus:ring-2 focus:ring-brand-maroon/25 focus:border-brand-maroon/30 outline-none',
  inputError: 'mt-1 text-sm text-[var(--form-error)]',
  calloutInfo: 'rounded-[12px] border border-brand-maroon/20 bg-brand-maroon/5 p-4',
  calloutWarning: 'rounded-[12px] border border-amber-500/35 bg-amber-500/15 p-4',
  calloutDestructive: 'rounded-[12px] border border-red-500/30 bg-red-500/10 p-4',
  checkbox:
    'h-5 w-5 rounded border-[var(--form-input-border)] bg-[var(--form-input-bg)] text-brand-maroon focus:ring-brand-maroon focus:ring-offset-0 touch-manipulation',
  checkboxLabel: 'text-sm font-medium text-[var(--form-label)]',
};

/** Light card forms on the public gradient (login, register, support). */
export const publicForm = {
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  labelCompact: 'block text-sm font-semibold text-gray-700 mb-1',
  input:
    'w-full px-4 py-3 rounded-[12px] border border-transparent bg-[#f2f2f7] text-gray-900 placeholder:text-[rgba(60,60,67,0.5)] focus:ring-2 focus:ring-brand-maroon/25 outline-none',
  inputTouch:
    'w-full min-h-[48px] px-4 py-3 rounded-[12px] border border-transparent bg-[#f2f2f7] text-gray-900 placeholder:text-[rgba(60,60,67,0.5)] focus:ring-2 focus:ring-brand-maroon/25 outline-none touch-manipulation',
  inputMono:
    'w-full min-h-[48px] px-4 py-3 rounded-[12px] border border-transparent bg-[#f2f2f7] font-mono uppercase text-gray-900 focus:ring-2 focus:ring-brand-maroon/25 outline-none touch-manipulation',
  inputCode:
    'w-full min-h-[48px] px-4 py-3 rounded-[12px] border border-transparent bg-[#f2f2f7] text-gray-900 focus:ring-2 focus:ring-brand-maroon/25 outline-none text-center text-lg tracking-widest touch-manipulation',
  passwordInput:
    'w-full min-h-[48px] px-4 pr-12 py-3 rounded-[12px] border border-transparent bg-[#f2f2f7] text-gray-900 placeholder:text-[rgba(60,60,67,0.5)] focus:ring-2 focus:ring-brand-maroon/25 outline-none touch-manipulation',
  passwordToggle:
    'absolute inset-y-0 right-0 min-h-[44px] min-w-[44px] px-3 text-gray-600 hover:text-brand-maroon flex items-center justify-center touch-manipulation',
  hint: 'mt-1 text-xs text-gray-500',
  error: 'mt-1 text-sm text-red-600',
  cardTitle: 'text-2xl font-bold text-gray-900 mb-2',
  cardTitleLg: 'text-2xl md:text-3xl font-bold text-gray-900 mb-2',
  cardSubtitle: 'text-gray-600 text-sm',
  cardSubtitleMd: 'text-gray-600 text-sm md:text-base',
  calloutError:
    'mb-4 p-3 bg-red-50 border border-red-200 rounded-[12px] flex items-center gap-2 text-red-700',
  calloutErrorBanner:
    'mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-[12px] flex items-start gap-3',
  calloutSuccess: 'p-4 bg-green-50 border border-green-200 rounded-[12px] text-green-800 text-sm',
  calloutWarning: 'p-3 bg-amber-50 border border-amber-200 rounded-[12px] text-amber-900 text-sm',
  resultSuccess: 'p-4 rounded-[12px] text-sm bg-green-50 text-green-800',
  resultError: 'p-4 rounded-[12px] text-sm bg-red-50 text-red-800',
  footer: 'mt-6 pt-6 border-t border-gray-200 text-center space-y-2',
  cardFooter: 'bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200 space-y-2',
  footerMuted: 'text-xs text-gray-500',
  footerText: 'text-sm text-gray-600',
  submit:
    'w-full py-3 px-6 bg-brand-maroon mx-cta rounded-[12px] hover:bg-brand-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold',
  submitTouch:
    'w-full min-h-[48px] py-3 px-6 bg-brand-maroon mx-cta rounded-[12px] hover:bg-brand-maroon-dark focus:outline-none focus:ring-2 focus:ring-brand-maroon/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold touch-manipulation',
  submitMaroon:
    'w-full py-3 px-6 bg-brand-maroon mx-cta rounded-[12px] hover:bg-brand-maroon-dark font-semibold',
  submitDelivery:
    'w-full min-h-[48px] py-3 px-6 bg-brand-maroon mx-cta rounded-[12px] hover:bg-brand-maroon-dark focus:outline-none focus:ring-2 focus:ring-brand-maroon/25 disabled:opacity-50 disabled:cursor-not-allowed font-semibold touch-manipulation',
  outlineBtn:
    'mt-3 w-full min-h-[48px] py-3 px-4 border-2 border-brand-maroon text-brand-maroon rounded-[12px] hover:bg-brand-maroon/5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation',
  /** Legal / static content on white cards */
  legalMeta: 'text-sm text-gray-500 mb-8',
  legalProse: 'space-y-6 text-gray-700',
  legalSectionTitle: 'text-xl font-semibold text-brand-maroon-black mb-2',
  legalFooter: 'mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4',
  /** Support / help pages on white cards */
  pageTitle: 'text-3xl md:text-4xl font-bold text-brand-maroon-black mb-2',
  pageIntro: 'text-gray-600 mb-8',
  sectionTitle: 'text-xl font-semibold text-brand-maroon-black mb-4 flex items-center gap-2',
  bodyList: 'space-y-3 text-gray-700',
  topicCard: 'p-4 rounded-[12px] border border-gray-200 bg-gray-50',
  topicCardTitle: 'font-semibold text-brand-maroon-black mb-1',
  topicCardBody: 'text-sm text-gray-600',
  tipCallout:
    'mt-4 p-4 bg-brand-maroon/5 border border-brand-maroon/20 rounded-[12px] text-sm text-gray-900',
  faqItem: 'border border-gray-200 rounded-[12px] overflow-hidden bg-white',
  faqButton:
    'w-full flex items-center justify-between gap-4 min-h-[44px] p-4 text-left font-medium text-brand-maroon-black hover:bg-gray-50 transition-colors',
  faqAnswer: 'text-gray-600 text-sm leading-relaxed',
  faqChevronMuted: 'w-5 h-5 shrink-0 text-brand-maroon',
  sectionDivider: 'pt-6 border-t border-gray-200',
  /** Landing page light sections on gradient */
  marketingMuted: 'text-xs text-gray-600',
  marketingBody: 'text-sm text-gray-600',
  marketingBodyLg: 'text-gray-600 text-sm md:text-base leading-relaxed',
};
