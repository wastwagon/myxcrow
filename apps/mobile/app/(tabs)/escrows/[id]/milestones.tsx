import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../../src/hooks/useQuery';
import apiClient from '../../../../src/lib/api-client';
import { formatCurrency, formatDate } from '../../../../src/lib/constants';
import Toast from 'react-native-toast-message';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  amountCents: number;
  status: 'pending' | 'completed' | 'released';
  completedAt?: string;
  releasedAt?: string;
}

export default function EscrowMilestonesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: escrow } = useQuery({
    queryKey: ['escrow', id],
    url: `/escrows/${id}`,
  });

  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones', id],
    url: `/escrows/${id}/milestones`,
  });

  const { data: user } = useQuery({
    queryKey: ['auth-profile'],
    url: '/auth/profile',
  });

  const isBuyer = escrow?.buyerId === user?.id;

  const completeMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiClient.put(`/escrows/${id}/milestones/${milestoneId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Milestone marked as completed',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to complete milestone',
      });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiClient.put(`/escrows/${id}/milestones/${milestoneId}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', id] });
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Milestone funds released to seller',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to release milestone',
      });
    },
  });

  const handleComplete = (milestoneId: string, milestoneName: string) => {
    Alert.alert('Complete Milestone', `Mark "${milestoneName}" as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => completeMutation.mutate(milestoneId),
      },
    ]);
  };

  const handleRelease = (milestoneId: string, milestoneName: string) => {
    Alert.alert('Release Funds', `Release funds for "${milestoneName}" to seller?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release',
        style: 'destructive',
        onPress: () => releaseMutation.mutate(milestoneId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading milestones...</Text>
      </View>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Milestones</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No milestones found</Text>
          <Text style={styles.emptySubtext}>This escrow does not use milestone payments</Text>
        </View>
      </View>
    );
  }

  const totalAmount = milestones.reduce((sum, m) => sum + m.amountCents, 0);
  const completedCount = milestones.filter((m) => m.status === 'completed' || m.status === 'released').length;
  const releasedCount = milestones.filter((m) => m.status === 'released').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Milestones</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Milestones:</Text>
            <Text style={styles.summaryValue}>{milestones.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Progress:</Text>
            <Text style={styles.summaryValue}>
              {completedCount}/{milestones.length} completed, {releasedCount} released
            </Text>
          </View>
        </View>

        {milestones.map((milestone, index) => {
          const canComplete = isBuyer && milestone.status === 'pending';
          const canRelease = isBuyer && milestone.status === 'completed';

          return (
            <View
              key={milestone.id}
              style={[
                styles.milestoneCard,
                milestone.status === 'released' && styles.milestoneCardReleased,
                milestone.status === 'completed' && styles.milestoneCardCompleted,
              ]}
            >
              <View style={styles.milestoneHeader}>
                <View
                  style={[
                    styles.milestoneNumber,
                    milestone.status === 'released' && styles.milestoneNumberReleased,
                    milestone.status === 'completed' && styles.milestoneNumberCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.milestoneNumberText,
                      (milestone.status === 'released' || milestone.status === 'completed') &&
                        styles.milestoneNumberTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneName}>{milestone.name}</Text>
                  {milestone.description && <Text style={styles.milestoneDescription}>{milestone.description}</Text>}
                </View>
              </View>

              <View style={styles.milestoneFooter}>
                <Text style={styles.milestoneAmount}>{formatCurrency(milestone.amountCents)}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    milestone.status === 'released' && styles.statusBadgeReleased,
                    milestone.status === 'completed' && styles.statusBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      milestone.status === 'released' && styles.statusBadgeTextReleased,
                      milestone.status === 'completed' && styles.statusBadgeTextCompleted,
                    ]}
                  >
                    {milestone.status === 'released'
                      ? 'Released'
                      : milestone.status === 'completed'
                      ? 'Completed'
                      : 'Pending'}
                  </Text>
                </View>
              </View>

              {(milestone.completedAt || milestone.releasedAt) && (
                <View style={styles.milestoneDates}>
                  {milestone.completedAt && (
                    <Text style={styles.dateText}>Completed: {formatDate(milestone.completedAt)}</Text>
                  )}
                  {milestone.releasedAt && (
                    <Text style={styles.dateText}>Released: {formatDate(milestone.releasedAt)}</Text>
                  )}
                </View>
              )}

              {isBuyer && (canComplete || canRelease) && (
                <View style={styles.milestoneActions}>
                  {canComplete && (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleComplete(milestone.id, milestone.name)}
                      disabled={completeMutation.isPending}
                    >
                      <Text style={styles.completeButtonText}>
                        {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {canRelease && (
                    <TouchableOpacity
                      style={styles.releaseButton}
                      onPress={() => handleRelease(milestone.id, milestone.name)}
                      disabled={releaseMutation.isPending}
                    >
                      <Text style={styles.releaseButtonText}>
                        {releaseMutation.isPending ? 'Releasing...' : 'Release Funds'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  milestoneCardCompleted: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  milestoneCardReleased: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneNumberCompleted: {
    backgroundColor: '#3b82f6',
  },
  milestoneNumberReleased: {
    backgroundColor: '#22c55e',
  },
  milestoneNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  milestoneNumberTextActive: {
    color: '#fff',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  statusBadgeCompleted: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeReleased: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusBadgeTextCompleted: {
    color: '#2563eb',
  },
  statusBadgeTextReleased: {
    color: '#16a34a',
  },
  milestoneDates: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  milestoneActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  releaseButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  releaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
