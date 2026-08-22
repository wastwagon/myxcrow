import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonLink } from '@/components/ui/Button';

export interface PromoSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
}

interface PromoCarouselProps {
  slides: PromoSlide[];
  className?: string;
  /** Auto-advance interval in ms. Set 0 to disable. */
  intervalMs?: number;
  /** Large dashboard hero. Default compact for secondary use. */
  size?: 'hero' | 'compact';
}

export function PromoCarousel({
  slides,
  className,
  intervalMs = 7000,
  size = 'compact',
}: PromoCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const isHero = size === 'hero';

  useEffect(() => {
    if (count <= 1 || intervalMs <= 0 || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs, paused, active]);

  if (!count) return null;

  const slide = slides[active];

  const selectSlide = (index: number) => {
    setActive(index);
    setPaused(true);
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-brand-maroon-black shadow-ios-card',
        isHero ? 'min-h-[300px] md:min-h-[360px]' : 'min-h-[200px] md:min-h-[220px]',
        className
      )}
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-hidden={i !== active}
        >
          <Image
            src={s.image}
            alt=""
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/62 to-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      ))}

      <div
        className={cn(
          'relative z-10 flex max-w-xl flex-col justify-end',
          isHero
            ? 'min-h-[300px] p-5 pb-[4.5rem] md:min-h-[360px] md:p-8 md:pb-16'
            : 'min-h-[200px] p-5 pb-11 md:min-h-[220px] md:p-7 md:pb-12'
        )}
      >
        <div key={slide.id} className="v2-fade-up">
          <span className="mb-3 inline-flex w-fit rounded-full border border-brand-gold/30 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold backdrop-blur-sm">
            {slide.eyebrow}
          </span>
          <h2 className="max-w-md text-[17px] font-semibold tracking-tight text-white">
            {slide.title}
          </h2>
          <p
            className={cn(
              'mt-2 max-w-md leading-relaxed text-white/85',
              isHero ? 'text-sm md:text-base' : 'text-sm'
            )}
          >
            {slide.description}
          </p>
          <ButtonLink href={slide.href} className="mt-5 w-fit">
            {slide.cta} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>

      {count > 1 && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-3 z-20 flex items-center gap-2 px-4 md:bottom-4 md:px-6',
            isHero ? 'justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'justify-center'
          )}
          role="tablist"
          aria-label="Hero slides"
        >
          {isHero
            ? slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={s.eyebrow}
                  onClick={() => selectSlide(i)}
                  className={cn(
                    'shrink-0 min-h-[44px] rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors touch-manipulation',
                    i === active
                      ? 'border-brand-gold/50 bg-brand-gold text-brand-maroon-black'
                      : 'border-white/40 bg-black/45 text-white backdrop-blur-sm hover:border-white hover:bg-black/55'
                  )}
                >
                  {s.eyebrow}
                </button>
              ))
            : slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={s.eyebrow}
                  onClick={() => selectSlide(i)}
                  className={cn(
                    'min-h-[44px] min-w-[44px] inline-flex items-center justify-center touch-manipulation',
                  )}
                >
                  <span
                    className={cn(
                      'rounded-full transition-all',
                      i === active ? 'h-2 w-6 bg-brand-gold' : 'h-2 w-2 bg-white/55 hover:bg-white'
                    )}
                  />
                </button>
              ))}
        </div>
      )}
    </section>
  );
}
