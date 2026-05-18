import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Star, CheckCircle, User, Calendar, TrendingUp, Shield } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { form } from '@/lib/form-classes';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ProfilePageSkeleton } from '@/components/LoadingSkeleton';

interface PublicProfile {
  userId: string;
  name: string | null;
  email: string;
  kycStatus: string;
  verifiedBadge: boolean;
  memberSince: string;
  reputation: {
    overallRating: number;
    totalRatings: number;
    completionRate: number;
    kycLevel: string;
    verifiedBadge: boolean;
    breakdown: {
      asBuyer: { rating: number; count: number };
      asSeller: { rating: number; count: number };
      recent: { rating: number; count: number };
      highValue: { rating: number; count: number };
    };
  };
}

export default function PublicProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const { userId } = router.query;

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
    await queryClient.invalidateQueries({ queryKey: ['user-ratings', userId] });
  };

  const { data: profile, isLoading } = useQuery<PublicProfile>({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/reputation/profile/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: ratings } = useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/reputation/ratings/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Layout>
        <ProfilePageSkeleton />
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-label-tertiary mb-4" />
          <p className="text-label-secondary">Profile not found</p>
        </div>
      </Layout>
    );
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-white/25" />
        ))}
        <span className="ml-2 text-sm font-medium text-label-secondary">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshProfile} disabled={!isMobile} className="space-y-6">
        {/* Profile Header */}
        <div className={form.panel}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar label={profile.name || profile.email} size="lg" className="w-20 h-20 text-2xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-label-primary">
                    {profile.name || 'User'}
                  </h1>
                  {profile.verifiedBadge && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-label-secondary mt-1">{profile.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-label-tertiary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member since {formatDate(profile.memberSince)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    KYC: {profile.kycStatus}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-label-primary">
                {profile.reputation.overallRating.toFixed(1)}
              </div>
              {renderStars(profile.reputation.overallRating)}
              <p className="text-sm text-label-tertiary mt-1">
                {profile.reputation.totalRatings} ratings
              </p>
            </div>
          </div>
        </div>

        {/* Reputation Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className={form.panel}>
            <h2 className="text-xl font-semibold text-label-primary mb-4">Reputation Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-label-secondary">As Buyer</span>
                  <span className="text-sm text-label-tertiary">
                    {profile.reputation.breakdown.asBuyer.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asBuyer.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-label-secondary">As Seller</span>
                  <span className="text-sm text-label-tertiary">
                    {profile.reputation.breakdown.asSeller.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asSeller.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-label-secondary">Recent (30 days)</span>
                  <span className="text-sm text-label-tertiary">
                    {profile.reputation.breakdown.recent.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.recent.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-label-secondary">High Value Escrows</span>
                  <span className="text-sm text-label-tertiary">
                    {profile.reputation.breakdown.highValue.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.highValue.rating || 0)}
              </div>
            </div>
          </div>

          <div className={form.panel}>
            <h2 className="text-xl font-semibold text-label-primary mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-ios-lg bg-brand-gold/10 border border-brand-gold/25">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-brand-gold" />
                  <span className="font-medium text-label-primary">Completion Rate</span>
                </div>
                <span className="text-2xl font-bold text-brand-gold">
                  {profile.reputation.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-ios-lg bg-emerald-500/15 border border-emerald-500/25">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium text-label-primary">Total Ratings</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {profile.reputation.totalRatings}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-ios-lg bg-white/10 border border-white/15">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white/80" />
                  <span className="font-medium text-label-primary">KYC Status</span>
                </div>
                <span className="text-lg font-semibold text-white/80">
                  {profile.reputation.kycLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {ratings && ratings.length > 0 && (
          <div className={form.panel}>
            <h2 className="text-xl font-semibold text-label-primary mb-4">Recent Ratings</h2>
            <div className="space-y-4">
              {ratings.map((rating: any) => (
                <div key={rating.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.score)}
                        <span className="text-sm text-label-tertiary">
                          by {rating.rater.firstName || rating.rater.email}
                        </span>
                        <span className="text-sm text-label-tertiary">•</span>
                        <span className="text-sm text-label-tertiary">
                          {formatDate(rating.createdAt)}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-label-secondary mt-2">{rating.comment}</p>
                      )}
                      <div className="mt-2 text-sm text-label-tertiary">
                        Escrow: {rating.escrow.description || rating.escrow.id.slice(0, 8)}...
                        {' • '}
                        {formatCurrency(rating.escrow.amountCents, 'GHS')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}

