/** Shared form field classes for pages on the dark app shell. */
export const form = {
  panel:
    'rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6',
  label: 'block text-ios-footnote font-medium text-label-secondary mb-1.5',
  input:
    'w-full px-4 py-3 border border-white/20 rounded-ios-lg bg-white/5 text-label-primary placeholder:text-label-tertiary focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none',
  inputError: 'mt-1 text-sm text-red-400',
  calloutInfo: 'rounded-ios-lg border border-brand-gold/30 bg-brand-gold/10 p-4',
  calloutWarning: 'rounded-ios-lg border border-amber-500/35 bg-amber-500/15 p-4',
  calloutDestructive: 'rounded-ios-lg border border-red-500/30 bg-red-500/10 p-4',
};

/** Light card forms on the public gradient (login, register, support). */
export const publicForm = {
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  labelCompact: 'block text-sm font-semibold text-gray-700 mb-1',
  input:
    'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none',
  inputTouch:
    'w-full min-h-[48px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none touch-manipulation',
  inputMono:
    'w-full min-h-[48px] px-4 py-3 border-2 border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none touch-manipulation',
  inputCode:
    'w-full min-h-[48px] px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none text-center text-lg tracking-widest touch-manipulation',
  passwordInput:
    'w-full min-h-[48px] px-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none touch-manipulation',
  passwordToggle:
    'absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-brand-maroon flex items-center justify-center',
  hint: 'mt-1 text-xs text-gray-500',
  error: 'mt-1 text-sm text-red-600',
  cardTitle: 'text-2xl font-bold text-gray-900 mb-2',
  cardTitleLg: 'text-2xl md:text-3xl font-bold text-gray-900 mb-2',
  cardSubtitle: 'text-gray-600 text-sm',
  cardSubtitleMd: 'text-gray-600 text-sm md:text-base',
  calloutError:
    'mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700',
  calloutErrorBanner:
    'mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3',
  calloutSuccess: 'p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm',
  calloutWarning: 'p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm',
  resultSuccess: 'p-4 rounded-lg text-sm bg-green-50 text-green-800',
  resultError: 'p-4 rounded-lg text-sm bg-red-50 text-red-800',
  footer: 'mt-6 pt-6 border-t border-gray-200 text-center space-y-2',
  cardFooter: 'bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200 space-y-2',
  footerMuted: 'text-xs text-gray-500',
  footerText: 'text-sm text-gray-600',
  submit:
    'w-full py-3 px-6 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white rounded-xl hover:from-brand-maroon-dark hover:to-brand-maroon-darker disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl',
  submitTouch:
    'w-full min-h-[48px] py-3 px-6 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white rounded-xl hover:from-brand-maroon-dark hover:to-brand-maroon-darker focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl touch-manipulation',
  submitMaroon:
    'w-full py-3 px-6 bg-brand-maroon text-white rounded-xl hover:bg-brand-maroon-dark font-semibold',
  submitDelivery:
    'w-full min-h-[48px] py-3 px-6 bg-brand-maroon text-white rounded-xl hover:bg-brand-maroon-dark focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold touch-manipulation',
  outlineBtn:
    'mt-3 w-full min-h-[48px] py-3 px-4 border-2 border-brand-maroon text-brand-maroon rounded-xl hover:bg-brand-maroon/5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation',
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
  topicCard: 'p-4 rounded-xl border border-gray-200 bg-gray-50',
  topicCardTitle: 'font-semibold text-brand-maroon-black mb-1',
  topicCardBody: 'text-sm text-gray-600',
  tipCallout:
    'mt-4 p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-sm text-brand-maroon-black',
  faqItem: 'border border-gray-200 rounded-xl overflow-hidden bg-white',
  faqButton:
    'w-full flex items-center justify-between gap-4 p-4 text-left font-medium text-brand-maroon-black hover:bg-gray-50 transition-colors',
  faqAnswer: 'text-gray-600 text-sm leading-relaxed',
  faqChevronMuted: 'w-5 h-5 shrink-0 text-gray-400',
  sectionDivider: 'pt-6 border-t border-gray-200',
};
