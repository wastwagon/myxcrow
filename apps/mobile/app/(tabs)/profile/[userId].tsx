import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery as useTanstackQuery } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import { formatDate } from '../../../src/lib/constants';

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

export default function PublicUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: profile, isLoading } = useTanstackQuery<PublicProfile>({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/reputation/profile/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: ratings } = useTanstackQuery<any[]>({
    queryKey: ['user-ratings', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/reputation/ratings/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'User Profile' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Stack.Screen options={{ title: 'User Profile' }} />
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>Profile not found</Text>
        </View>
      </>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#f59e0b"
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: profile.name || 'User Profile' }} />
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#3b82f6" />
            {profile.verifiedBadge && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{profile.name || 'Anonymous User'}</Text>
          <Text style={styles.memberSince}>Member since {formatDate(profile.memberSince)}</Text>
        </View>

        {/* Overall Rating */}
        <View style={styles.overallRating}>
          <View style={styles.ratingCircle}>
            <Text style={styles.ratingValue}>{profile.reputation.overallRating.toFixed(1)}</Text>
            {renderStars(Math.round(profile.reputation.overallRating))}
          </View>
          <Text style={styles.ratingCount}>
            Based on {profile.reputation.totalRatings} rating
            {profile.reputation.totalRatings !== 1 ? 's' : ''}
          </Text>
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-done" size={16} color="#10b981" />
            <Text style={styles.completionText}>
              {profile.reputation.completionRate.toFixed(0)}% completion rate
            </Text>
          </View>
        </View>

        {/* Rating Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rating Breakdown</Text>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="cart-outline" size={20} color="#3b82f6" />
              <Text style={styles.breakdownLabel}>As Buyer</Text>
            </View>
            <View style={styles.breakdownRating}>
              {renderStars(Math.round(profile.reputation.breakdown.asBuyer.rating))}
              <Text style={styles.breakdownValue}>
                {profile.reputation.breakdown.asBuyer.rating.toFixed(1)} (
                {profile.reputation.breakdown.asBuyer.count})
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="storefront-outline" size={20} color="#10b981" />
              <Text style={styles.breakdownLabel}>As Seller</Text>
            </View>
            <View style={styles.breakdownRating}>
              {renderStars(Math.round(profile.reputation.breakdown.asSeller.rating))}
              <Text style={styles.breakdownValue}>
                {profile.reputation.breakdown.asSeller.rating.toFixed(1)} (
                {profile.reputation.breakdown.asSeller.count})
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <Text style={styles.breakdownLabel}>Recent (Last 30 days)</Text>
            </View>
            <View style={styles.breakdownRating}>
              {renderStars(Math.round(profile.reputation.breakdown.recent.rating))}
              <Text style={styles.breakdownValue}>
                {profile.reputation.breakdown.recent.rating.toFixed(1)} (
                {profile.reputation.breakdown.recent.count})
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="diamond-outline" size={20} color="#8b5cf6" />
              <Text style={styles.breakdownLabel}>High Value Transactions</Text>
            </View>
            <View style={styles.breakdownRating}>
              {renderStars(Math.round(profile.reputation.breakdown.highValue.rating))}
              <Text style={styles.breakdownValue}>
                {profile.reputation.breakdown.highValue.rating.toFixed(1)} (
                {profile.reputation.breakdown.highValue.count})
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Ratings */}
        {ratings && ratings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Ratings</Text>
            {ratings.slice(0, 5).map((rating: any, index: number) => (
              <View key={index} style={styles.ratingItem}>
                <View style={styles.ratingItemHeader}>
                  {renderStars(rating.rating)}
                  <Text style={styles.ratingDate}>{formatDate(rating.createdAt)}</Text>
                </View>
                {rating.comment && (
                  <Text style={styles.ratingComment}>"{rating.comment}"</Text>
                )}
                <Text style={styles.ratingRole}>
                  Rated as {rating.raterRole === 'BUYER' ? 'seller' : 'buyer'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <Text style={styles.sectionTitle}>Trust Indicators</Text>
          <View style={styles.trustIndicators}>
            <View
              style={[
                styles.trustBadge,
                profile.kycStatus === 'VERIFIED' ? styles.trustBadgeActive : {},
              ]}
            >
              <Ionicons
                name={profile.kycStatus === 'VERIFIED' ? 'shield-checkmark' : 'shield-outline'}
                size={20}
                color={profile.kycStatus === 'VERIFIED' ? '#10b981' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.trustBadgeText,
                  profile.kycStatus === 'VERIFIED' ? styles.trustBadgeTextActive : {},
                ]}
              >
                {profile.kycStatus === 'VERIFIED' ? 'KYC Verified' : 'Not Verified'}
              </Text>
            </View>

            {profile.reputation.completionRate >= 90 && (
              <View style={[styles.trustBadge, styles.trustBadgeActive]}>
                <Ionicons name="trophy" size={20} color="#f59e0b" />
                <Text style={[styles.trustBadgeText, styles.trustBadgeTextActive]}>
                  Reliable Trader
                </Text>
              </View>
            )}

            {profile.reputation.totalRatings >= 10 && (
              <View style={[styles.trustBadge, styles.trustBadgeActive]}>
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text style={[styles.trustBadgeText, styles.trustBadgeTextActive]}>
                  Experienced
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  overallRating: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  ratingCircle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  breakdownRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  ratingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ratingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  ratingComment: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  ratingRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  trustSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  trustIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  trustBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  trustBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginLeft: 4,
  },
  trustBadgeTextActive: {
    color: '#059669',
  },
});
