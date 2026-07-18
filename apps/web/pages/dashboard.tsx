import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  Wallet,
  Activity,
  ArrowUpRight,
  Building2,
  Handshake,
  ShieldCheck,
  Scale,
  Shield,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import Link from 'next/link';
import { MetricCard } from '@/components/ui/MetricCard';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ImageCard, ImageCardRow } from '@/components/ui/ImageCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PromoCarousel, type PromoSlide } from '@/components/ui/PromoCarousel';

const QUICK_ACTIONS = [
  { href: '/escrows/new', label: 'Create escrow', icon: Plus },
  { href: '/wallet/topup', label: 'Top up', icon: ArrowUpRight },
  { href: '/wallet', label: 'My wallet', icon: Wallet },
  { href: '/escrows', label: 'All escrows', icon: FileText },
  { href: '/disputes', label: 'Disputes', icon: Scale },
];

const ESCROW_SERVICES = [
  {
    href: '/escrows/new',
    title: 'Goods & services',
    description: 'Trade with confidence',
    image: '/images/v2/goods-services.jpg',
    icon: Handshake,
  },
  {
    href: '/escrows/new',
    title: 'Real estate',
    description: 'Protect high-value deals',
    image: '/images/v2/real-estate.jpg',
    icon: Building2,
  },
  {
    href: '/escrows/new',
    title: 'Milestone projects',
    description: 'Release funds by progress',
    image: '/images/v2/milestone-projects.jpg',
    icon: ShieldCheck,
  },
];

const TRUST_SAFETY = [
  {
    href: '/profile',
    title: 'Account security',
    description: 'Keep your profile current',
    image: '/images/v2/diaspora.jpg',
    icon: Shield,
  },
  {
    href: '/disputes',
    title: 'Dispute resolution',
    description: 'Fair mediation when needed',
    image: '/images/v2/local-transactions.jpg',
    icon: Scale,
  },
  {
    href: '/support',
    title: 'Buyer protection',
    description: 'Funds held until you approve',
    image: '/images/v2/protected-payments-hero.jpg',
    icon: ShieldCheck,
  },
];

function getPromoSlides(kycVerified: boolean): PromoSlide[] {
  const slides: PromoSlide[] = [];
  if (!kycVerified) {
    slides.push({
      id: 'security',
      eyebrow: 'Account tip',
      title: 'Complete your profile for smoother deals',
      description: 'Add your phone and keep identity details current before you fund high-value escrows.',
      href: '/profile',
      cta: 'Open profile',
      image: '/images/v2/diaspora.jpg',
    });
  }
  slides.push(
    {
      id: 'how-it-works',
      eyebrow: 'How MyXcrow works',
      title: 'Agree, fund, deliver, release',
      description: 'Funds stay protected until both sides fulfill the deal.',
      href: '/escrows/new',
      cta: 'Start an escrow',
      image: '/images/v2/goods-services.jpg',
    },
    {
      id: 'milestones',
      eyebrow: 'Projects',
      title: 'Release money by milestone',
      description: 'Ideal for construction, diaspora builds, and phased professional work.',
      href: '/escrows/new',
      cta: 'Create milestones',
      image: '/images/v2/milestone-projects.jpg',
    }
  );
  return slides;
}

function maskPhone(phone?: string) {
  if (!phone) return '';
  const compact = phone.replace(/\s+/g, '');
  if (compact.length < 7) return phone;
  return `${compact.slice(0, 4)} ••• ${compact.slice(-3)}`;
}

interface WalletData {
  availableCents: number;
  pendingCents: number;
  currency: string;
}

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  fundingAmountCents?: number;
  netAmountCents?: number;
  buyerFeeCents?: number;
  currency: string;
  description: string;
  createdAt: string;
  buyerId: string;
  sellerId: string;
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [userName, setUserName] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      if (isAdmin()) {
        router.push('/admin');
        return;
      }

      const user = getUser();
      if (user) {
        const name = user.firstName || user.email?.split('@')[0] || 'User';
        setUserName(name);
      }
    }
  }, [router, mounted]);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet');
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
    enabled: mounted && isAuthenticated(),
  });

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => {
      const response = await apiClient.get('/escrows');
      return response.data;
    },
    enabled: mounted && isAuthenticated(),
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-brand-gold" />
      </div>
    );
  }

  const activeEscrows = escrows?.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status)) || [];
  const recentEscrows = escrows?.slice(0, 5) || [];
  const user = getUser();
  const promoSlides = getPromoSlides(user?.kycStatus === 'VERIFIED');

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['escrows'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh
        onRefresh={refreshDashboard}
        disabled={!isMobile}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className="v2-fade-up flex items-center justify-between gap-4">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 group">
            <UserAvatar label={userName || user?.email || 'User'} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
                Akwaaba
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">
                {userName || 'Welcome back'}
              </h1>
              <p className="text-white/55 text-xs mt-0.5 truncate">
                {maskPhone(user?.phone) || user?.email || 'Your secure account'}
              </p>
            </div>
          </Link>
          <Link
            href="/profile"
            className="shrink-0 inline-flex items-center gap-2 min-h-[40px] rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/15 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">
              {user?.kycStatus === 'VERIFIED' ? 'Identity verified' : 'Account security'}
            </span>
          </Link>
        </header>

        <section className="v2-fade-up-delay-1 relative min-h-[245px] md:min-h-[310px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
          <Image
            src="/images/v2/protected-payments-hero.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/5" />
          <div className="relative z-10 flex min-h-[245px] md:min-h-[310px] max-w-xl flex-col justify-end p-5 md:p-8">
            <span className="mb-3 w-fit rounded-full border border-brand-gold/30 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold backdrop-blur-sm">
              Protected payments
            </span>
            <h2 className="max-w-md text-2xl md:text-4xl font-bold tracking-tight text-white">
              Your money moves only when the deal does.
            </h2>
            <p className="mt-2 max-w-md text-sm md:text-base leading-relaxed text-white/70">
              Create an escrow, agree on the terms, and trade with confidence.
            </p>
            <ButtonLink href="/escrows/new" className="mt-5 w-fit">
              Create escrow <ArrowRight className="w-4 h-4" />
            </ButtonLink>
          </div>
        </section>

        <PromoCarousel slides={promoSlides} className="v2-fade-up-delay-2" />

        <section>
          <SectionHeader
            eyebrow="Wallet overview"
            title="Your balances"
            href="/wallet"
            linkLabel="View wallet"
          />
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative overflow-hidden rounded-ios-xl border border-brand-gold/25 bg-[#201a17] p-4 md:p-5">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[18px] border-brand-gold/[0.06]" />
              <p className="relative text-xs font-medium text-white/55">Available balance</p>
              {walletLoading ? (
                <div className="relative mt-2 h-8 w-28 animate-pulse rounded-ios bg-white/10" />
              ) : (
                <p className="relative mt-2 text-xl md:text-3xl font-bold tracking-tight text-white">
                  {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
                </p>
              )}
              <ButtonLink href="/wallet/topup" size="sm" className="relative mt-5 rounded-full text-xs">
                Top up
              </ButtonLink>
            </div>
            <div className="relative overflow-hidden rounded-ios-xl border border-white/10 bg-[#201a17] p-4 md:p-5">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full border-[18px] border-white/[0.04]" />
              <p className="relative text-xs font-medium text-white/55">Pending in escrow</p>
              {walletLoading ? (
                <div className="relative mt-2 h-8 w-28 animate-pulse rounded-ios bg-white/10" />
              ) : (
                <p className="relative mt-2 text-xl md:text-3xl font-bold tracking-tight text-white">
                  {wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
                </p>
              )}
              <Link
                href="/escrows"
                className="relative mt-5 inline-flex min-h-[34px] items-center rounded-full border border-white/15 bg-white/10 px-3 text-xs font-bold text-white"
              >
                Track funds
              </Link>
            </div>
          </div>
          <p className="mt-2 px-1 text-[11px] text-white/40">Balances refresh automatically</p>
        </section>

        <section>
          <SectionHeader title="What would you like to do?" />
          <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="v2-lift group flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-ios-xl border border-white/10 bg-black/25 px-2 py-4 text-center hover:border-brand-gold/30 hover:bg-white/[0.08]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-brand-gold transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold leading-tight text-white/85">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Built for real life"
            title="Escrow services"
            href="/escrows/new"
            linkLabel="Get started"
          />
          <ImageCardRow>
            {ESCROW_SERVICES.map((service) => (
              <ImageCard key={service.title} {...service} />
            ))}
          </ImageCardRow>
        </section>

        <section>
          <SectionHeader
            eyebrow="Peace of mind"
            title="Trust & safety"
            href="/support"
            linkLabel="Learn more"
          />
          <ImageCardRow>
            {TRUST_SAFETY.map((item) => (
              <ImageCard key={item.title} {...item} />
            ))}
          </ImageCardRow>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Active"
            value={activeEscrows.length}
            hint="In progress"
            icon={<Activity className="w-5 h-5" />}
            accent="maroon"
            loading={escrowsLoading}
            className="p-3 md:p-4"
          />
          <MetricCard
            label="Awaiting"
            value={
              escrows?.filter((e) => ['AWAITING_FUNDING', 'AWAITING_SHIPMENT'].includes(e.status))
                .length || 0
            }
            hint="Your action"
            icon={<Clock className="w-5 h-5" />}
            accent="amber"
            loading={escrowsLoading}
            className="p-3 md:p-4"
          />
          <MetricCard
            label="Completed"
            value={escrows?.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status)).length ?? 0}
            hint="All time"
            icon={<CheckCircle className="w-5 h-5" />}
            accent="emerald"
            loading={escrowsLoading}
            className="p-3 md:p-4"
          />
        </section>

        <section>
          <SectionHeader title="Recent escrows" href="/escrows" linkLabel="View all" />

          {escrowsLoading ? (
            <ListRowsSkeleton rows={3} rowClassName="h-16" />
          ) : recentEscrows.length > 0 ? (
            <ListGroup>
              {recentEscrows.map((escrow) => {
                const isBuyer = user?.id === escrow.buyerId;
                const displayCents = isBuyer
                  ? escrow.fundingAmountCents || escrow.amountCents + (escrow.buyerFeeCents ?? 0)
                  : escrow.netAmountCents ?? escrow.amountCents;
                const amountLabel = isBuyer ? 'Funded' : 'Receive';

                return (
                <ListRow
                  key={escrow.id}
                  href={`/escrows/${escrow.id}`}
                  title={escrow.description || 'Escrow Agreement'}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-label-primary font-medium">
                        {formatCurrency(displayCents, 'GHS')}
                      </span>
                      <span className="text-label-tertiary text-xs">({amountLabel})</span>
                      <span>·</span>
                      <span>{formatDate(escrow.createdAt)}</span>
                    </span>
                  }
                  trailing={<StatusBadge status={escrow.status} />}
                />
              );
              })}
            </ListGroup>
          ) : (
            <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] p-10 text-center">
              <FileText className="w-14 h-14 mx-auto mb-4 text-white/30" />
              <p className="text-ios-headline text-label-primary font-semibold mb-1">No escrows yet</p>
              <p className="text-ios-subhead text-label-secondary mb-6">
                Create your first escrow to protect a transaction
              </p>
              <Link href="/escrows/new">
                <Button>
                  <Plus className="w-5 h-5" />
                  Create escrow
                </Button>
              </Link>
            </div>
          )}
        </section>
      </PullToRefresh>
    </Layout>
  );
}
