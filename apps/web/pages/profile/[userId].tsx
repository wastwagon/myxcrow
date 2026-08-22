import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Star, CheckCircle, User, Calendar, TrendingUp, Shield } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
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
      <CustomerLayout title="Profile" back>
        <ProfilePageSkeleton />
      </CustomerLayout>
    );
  }

  if (!profile) {
    return (
      <CustomerLayout title="Profile" back>
        <EmptyState
          tone="light"
          icon={<User className="h-6 w-6" />}
          title="Profile not found"
          description="This user may no longer have a public profile."
          action={{ href: '/dashboard', label: 'Go to home', variant: 'maroon' }}
        />
      </CustomerLayout>
    );
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-brand-gold text-brand-gold" />
        ))}
        {hasHalfStar && (
          <Star className="w-5 h-5 fill-brand-gold text-brand-gold opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-[#8e8e93]" />
        ))}
        <span className="ml-2 text-sm font-medium text-[rgba(60,60,67,0.6)]">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <CustomerLayout title="Profile" back>
      <PullToRefresh onRefresh={refreshProfile} disabled={!isMobile} className="space-y-6">
        {/* Profile Header */}
        <div className={`${form.panel} v2-fade-up`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar label={profile.name || profile.email} size="lg" className="w-20 h-20 text-2xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-semibold text-gray-900">
                    {profile.name || 'User'}
                  </h2>
                  {profile.verifiedBadge && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-[rgba(60,60,67,0.6)] mt-1">{profile.email}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
              <div className="text-[22px] font-semibold tracking-tight text-gray-900">
                {profile.reputation.overallRating.toFixed(1)}
              </div>
              {renderStars(profile.reputation.overallRating)}
              <p className="text-sm text-gray-500 mt-1">
                {profile.reputation.totalRatings} ratings
              </p>
            </div>
          </div>
        </div>

        {/* Reputation Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className={form.panel}>
            <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Reputation Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[rgba(60,60,67,0.6)]">As Buyer</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.asBuyer.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asBuyer.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[rgba(60,60,67,0.6)]">As Seller</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.asSeller.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asSeller.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[rgba(60,60,67,0.6)]">Recent (30 days)</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.recent.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.recent.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[rgba(60,60,67,0.6)]">High Value Escrows</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.highValue.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.highValue.rating || 0)}
              </div>
            </div>
          </div>

          <div className={form.panel}>
            <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-[20px] bg-[#f2f2f7]">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-brand-maroon" />
                  <span className="font-medium text-gray-900">Completion Rate</span>
                </div>
                <span className="text-[22px] font-semibold tracking-tight text-gray-900">
                  {profile.reputation.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-[20px] bg-emerald-50">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Total Ratings</span>
                </div>
                <span className="text-[22px] font-semibold tracking-tight text-emerald-700">
                  {profile.reputation.totalRatings}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-[20px] bg-[#f2f2f7]">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[rgba(60,60,67,0.6)]" />
                  <span className="font-medium text-gray-900">KYC Status</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {profile.reputation.kycLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {ratings && ratings.length > 0 && (
          <div className={form.panel}>
            <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Recent Ratings</h2>
            <div className="space-y-4">
              {ratings.map((rating: any) => (
                <div key={rating.id} className="border-b border-[rgba(60,60,67,0.12)] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.score)}
                        <span className="text-sm text-gray-500">
                          by {rating.rater.firstName || rating.rater.email}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(rating.createdAt)}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-[rgba(60,60,67,0.6)] mt-2">{rating.comment}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
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
    </CustomerLayout>
  );
}

