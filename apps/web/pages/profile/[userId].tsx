import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Star, CheckCircle, User, Calendar, TrendingUp, Shield } from 'lucide-react';

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
  const { userId } = router.query;

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
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Profile not found</p>
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
          <Star key={i} className="w-5 h-5 text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.name || 'User'}
                  </h1>
                  {profile.verifiedBadge && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{profile.email}</p>
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
              <div className="text-3xl font-bold text-gray-900">
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reputation Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">As Buyer</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.asBuyer.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asBuyer.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">As Seller</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.asSeller.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.asSeller.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Recent (30 days)</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.recent.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.recent.rating || 0)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">High Value Escrows</span>
                  <span className="text-sm text-gray-500">
                    {profile.reputation.breakdown.highValue.count} ratings
                  </span>
                </div>
                {renderStars(profile.reputation.breakdown.highValue.rating || 0)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Completion Rate</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {profile.reputation.completionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Total Ratings</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {profile.reputation.totalRatings}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">KYC Status</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">
                  {profile.reputation.kycLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ratings */}
        {ratings && ratings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Ratings</h2>
            <div className="space-y-4">
              {ratings.map((rating: any) => (
                <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(rating.score)}
                        <span className="text-sm text-gray-500">
                          by {rating.rater.firstName || rating.rater.email}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(rating.createdAt)}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-gray-700 mt-2">{rating.comment}</p>
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
      </div>
    </Layout>
  );
}

