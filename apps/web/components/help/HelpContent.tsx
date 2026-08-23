import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchField } from '@/components/ui/SearchField';
import { IconWell } from '@/components/ui/IconWell';
import { HELP_FAQS, HELP_QUICK_LINKS, HELP_TOPICS } from '@/components/help/help-data';

type HelpContentProps = {
  variant?: 'public' | 'dashboard';
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export function HelpContent({ variant = 'public' }: HelpContentProps) {
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const query = normalize(search);

  const visibleFaqs = useMemo(() => {
    return HELP_FAQS.filter((faq) => {
      if (activeTopicId && faq.topicId !== activeTopicId) return false;
      if (!query) return true;
      const haystack = [faq.q, faq.a, ...faq.keywords].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTopicId, query]);

  const sectionTitle = 'text-[17px] font-semibold text-brand-maroon-black flex items-center gap-2';
  const card = 'rounded-[16px] border border-[rgba(60,60,67,0.08)] bg-white';

  return (
    <div className="space-y-6">
      <section className={cn(card, 'p-4 sm:p-5')}>
        <h2 className={sectionTitle}>
          <MessageCircle className="h-5 w-5 text-brand-maroon" />
          Contact support
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-[rgba(60,60,67,0.65)]">
          We typically respond within a few hours on business days. For transaction issues, include
          your escrow ID so we can help faster.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-[14px] bg-brand-maroon/[0.04] p-3.5">
            <IconWell icon={MessageCircle} color="maroon" className="h-10 w-10 shrink-0 rounded-[12px]" />
            <div>
              <p className="text-[14px] font-semibold text-brand-maroon-deep">Live chat</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[rgba(60,60,67,0.6)]">
                Use the chat widget in the bottom-right corner for the fastest help.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-[14px] bg-brand-maroon/[0.04] p-3.5">
            <IconWell icon={Mail} color="teal" className="h-10 w-10 shrink-0 rounded-[12px]" />
            <div>
              <p className="text-[14px] font-semibold text-brand-maroon-deep">Email</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[rgba(60,60,67,0.6)]">
                Email from your registered account and include screenshots when relevant.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[13px] text-[rgba(60,60,67,0.55)]">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Mon–Fri, 8am–6pm GMT · Escrow disputes reviewed within 24 hours</span>
        </div>
      </section>

      {variant === 'dashboard' && (
        <section>
          <h2 className={cn(sectionTitle, 'mb-3 px-0.5')}>Quick actions</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {HELP_QUICK_LINKS.map(({ href, label, subtitle, icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  card,
                  'flex min-h-[108px] flex-col items-center justify-center px-2 py-3.5 text-center touch-manipulation active:bg-black/[0.02]'
                )}
              >
                <IconWell icon={icon} color="maroon" className="h-10 w-10 rounded-[12px]" />
                <span className="mt-2 text-[12px] font-semibold leading-tight text-brand-maroon-deep">
                  {label}
                </span>
                <span className="mt-0.5 text-[10px] leading-tight text-[rgba(60,60,67,0.5)]">
                  {subtitle}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className={cn(sectionTitle, 'mb-3 px-0.5')}>
          <HelpCircle className="h-5 w-5 text-brand-maroon" />
          Browse by topic
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {HELP_TOPICS.map(({ id, icon, title, body }) => {
            const active = activeTopicId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTopicId(active ? null : id)}
                className={cn(
                  card,
                  'p-4 text-left touch-manipulation transition-colors',
                  active
                    ? 'border-brand-gold/50 ring-1 ring-brand-gold/25'
                    : 'hover:border-[rgba(60,60,67,0.14)]'
                )}
              >
                <IconWell icon={icon} color="maroon" className="mb-2.5 h-9 w-9 rounded-[11px]" />
                <h3 className="text-[15px] font-semibold text-brand-maroon-deep">{title}</h3>
                <p className="mt-1 text-[13px] leading-snug text-[rgba(60,60,67,0.6)]">{body}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={sectionTitle}>
            <HelpCircle className="h-5 w-5 text-brand-maroon" />
            Frequently asked questions
          </h2>
          {activeTopicId && (
            <button
              type="button"
              onClick={() => setActiveTopicId(null)}
              className="text-[13px] font-semibold text-brand-maroon touch-manipulation"
            >
              Show all topics
            </button>
          )}
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search help articles"
          className="mb-3"
        />
        <div className="space-y-2">
          {visibleFaqs.length === 0 ? (
            <div className={cn(card, 'px-4 py-8 text-center text-[15px] text-[rgba(60,60,67,0.55)]')}>
              No articles match your search. Try different keywords or contact support.
            </div>
          ) : (
            visibleFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className={cn(card, 'overflow-hidden')}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="flex w-full min-h-[48px] items-center justify-between gap-4 p-4 text-left font-medium text-brand-maroon-black touch-manipulation hover:bg-black/[0.02]"
                  >
                    <span className="text-[15px] leading-snug">{faq.q}</span>
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-brand-maroon" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-[rgba(60,60,67,0.35)]" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-[rgba(60,60,67,0.06)] px-4 pb-4 pt-3">
                      <p className="text-[14px] leading-relaxed text-[rgba(60,60,67,0.65)]">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="border-t border-[rgba(60,60,67,0.1)] pt-5">
        <p className="text-[14px] leading-relaxed text-[rgba(60,60,67,0.6)]">
          See our{' '}
          <Link href="/terms" className="font-semibold text-brand-maroon touch-manipulation">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-semibold text-brand-maroon touch-manipulation">
            Privacy Policy
          </Link>{' '}
          for legal and data protection information.
        </p>
      </section>
    </div>
  );
}
