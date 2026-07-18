import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function PromoCarousel({ slides, className, intervalMs = 6000 }: PromoCarouselProps) {
  const [active, setActive] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || intervalMs <= 0) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs]);

  if (!count) return null;

  const slide = slides[active];

  return (
    <section className={cn('space-y-3', className)}>
      <div className="relative min-h-[200px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-brand-maroon-black shadow-ios-card md:min-h-[220px]">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
          </div>
        ))}

        <div className="relative z-10 flex min-h-[200px] max-w-xl flex-col justify-end p-5 md:min-h-[220px] md:p-7">
          <span className="mb-2 w-fit rounded-full border border-brand-gold/30 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold backdrop-blur-sm">
            {slide.eyebrow}
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{slide.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">{slide.description}</p>
          <Link
            href={slide.href}
            className="mt-4 inline-flex min-h-[40px] w-fit items-center justify-center gap-2 rounded-full bg-brand-gold px-4 text-sm font-bold text-brand-maroon-black transition-colors hover:bg-brand-gold/90"
          >
            {slide.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Promotions">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show ${s.eyebrow}`}
              onClick={() => setActive(i)}
              className={cn(
                'h-2 rounded-full transition-all touch-manipulation',
                i === active ? 'w-6 bg-brand-gold' : 'w-2 bg-white/25 hover:bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
