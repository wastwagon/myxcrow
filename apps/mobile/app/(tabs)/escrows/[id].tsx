import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import { formatCurrency, formatDate, formatStatus, WEB_BASE_URL } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';
import RatingModal from '../../../src/components/RatingModal';

export default function EscrowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', id],
    url: `/escrows/${id}`,
  });

  const { data: user } = useQuery({
    queryKey: ['auth-profile'],
    url: '/auth/profile',
  });

  const isBuyer = escrow?.buyerId === user?.id;
  const isSeller = escrow?.sellerId === user?.id;
  const canFund = isBuyer && escrow?.status === 'AWAITING_FUNDING';
  const canShip = isSeller && escrow?.status === 'FUNDED';
  const canDeliver = isBuyer && escrow?.status === 'SHIPPED';
  const canRelease = isBuyer && (escrow?.status === 'DELIVERED' || escrow?.status === 'AWAITING_RELEASE');
  const canMarkServiceCompleted = isSeller && escrow?.status === 'FUNDED';

  const fundMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/fund`, { useWallet: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Escrow funded successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fund escrow',
      });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (data: { trackingNumber?: string }) => {
      return apiClient.put(`/escrows/${id}/ship`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Escrow marked as shipped',
      });
      setTrackingNumber('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to mark as shipped',
      });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/deliver`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Escrow marked as delivered',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to mark as delivered',
      });
    },
  });

  const confirmDeliveryByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiClient.put(`/escrows/${id}/confirm-delivery`, { deliveryCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      setDeliveryCodeInput('');
      Toast.show({ type: 'success', text1: 'Success', text2: 'Delivery confirmed with code' });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Invalid code' });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Funds released to seller',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to release funds',
      });
    },
  });

  const serviceCompletedMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/escrows/${id}/service-completed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', id] });
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Service marked as completed',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to mark service as completed',
      });
    },
  });

  const handleFund = () => {
    Alert.alert('Fund Escrow', 'Fund this escrow from your wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Fund',
        onPress: () => {
          setActionLoading('fund');
          fundMutation.mutate();
        },
      },
    ]);
  };

  const handleShip = () => {
    Alert.alert(
      'Mark as Shipped',
      'Enter tracking number (optional)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ship',
          onPress: () => {
            setActionLoading('ship');
            shipMutation.mutate({ trackingNumber: trackingNumber || undefined });
          },
        },
      ],
    );
  };

  const handleDeliver = () => {
    Alert.alert('Confirm Delivery', 'Confirm that you have received the item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          setActionLoading('deliver');
          deliverMutation.mutate();
        },
      },
    ]);
  };

  const handleConfirmDeliveryByCode = () => {
    const code = deliveryCodeInput.trim();
    if (!code) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter the delivery code' });
      return;
    }
    confirmDeliveryByCodeMutation.mutate(code);
  };

  const firstShipmentWithCode = (escrow as any)?.shipments?.find(
    (s: any) => s.deliveryCode && s.shortReference,
  );
  const confirmDeliveryUrl = `${WEB_BASE_URL}/confirm-delivery`;

  const handleRelease = () => {
    const msg =
      escrow?.status === 'AWAITING_RELEASE'
        ? 'Confirm service completion and release funds to seller? This action cannot be undone.'
        : 'Release funds to seller? This action cannot be undone.';
    Alert.alert('Release Funds', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Release',
        style: 'destructive',
        onPress: () => {
          setActionLoading('release');
          releaseMutation.mutate();
        },
      },
    ]);
  };

  const handleServiceCompleted = () => {
    Alert.alert(
      'Service Completed',
      'Mark this escrow as "Service Completed" (no shipping)? Buyer can then confirm and release funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: () => {
            setActionLoading('service-completed');
            serviceCompletedMutation.mutate();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading escrow...</Text>
      </View>
    );
  }

  if (!escrow) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Escrow not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escrow Details</Text>
      </View>

      <View style={styles.secondaryActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(`/(tabs)/escrows/${id}/messages`)}
        >
          <Text style={styles.secondaryButtonText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(`/(tabs)/escrows/${id}/milestones`)}
        >
          <Text style={styles.secondaryButtonText}>Milestones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push(`/(tabs)/escrows/${id}/evidence`)}
        >
          <Text style={styles.secondaryButtonText}>Evidence</Text>
        </TouchableOpacity>
        {(escrow.status === 'RELEASED' || escrow.status === 'REFUNDED') && (
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: '#f59e0b' }]}
            onPress={() => setRatingModalVisible(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: '#fff' }]}>⭐ Rate</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={[styles.statusBadge, (styles as any)[`status${escrow.status}`]]}>
              <Text style={styles.statusText}>{formatStatus(escrow.status)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>{formatCurrency(escrow.amountCents, escrow.currency)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={styles.infoValue}>{escrow.description || 'No description'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>{formatDate(escrow.createdAt)}</Text>
          </View>

          {((escrow as any).deliveryRegion || (escrow as any).deliveryCity || (escrow as any).deliveryAddressLine) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ship to</Text>
              <Text style={styles.infoValue}>
                {[(escrow as any).deliveryAddressLine, (escrow as any).deliveryCity, (escrow as any).deliveryRegion]
                  .filter(Boolean)
                  .join(', ')}
                {(escrow as any).deliveryPhone ? ` · ${(escrow as any).deliveryPhone}` : ''}
              </Text>
            </View>
          )}

          {isBuyer && firstShipmentWithCode && (
            <View style={[styles.card, { backgroundColor: '#fef3c7', marginTop: 12, borderWidth: 1, borderColor: '#f59e0b' }]}>
              <Text style={[styles.label, { color: '#92400e' }]}>Your delivery verification code</Text>
              <Text style={[styles.helpText, { color: '#92400e', marginBottom: 8 }]}>
                Give reference and code to the delivery person so they can confirm delivery.
              </Text>
              <Text style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', color: '#92400e' }}>
                Ref: {firstShipmentWithCode.shortReference} · Code: {firstShipmentWithCode.deliveryCode}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`${confirmDeliveryUrl}?ref=${encodeURIComponent(firstShipmentWithCode.shortReference)}`)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: '#b45309', fontWeight: '600', fontSize: 14 }}>Open confirm-delivery page →</Text>
              </TouchableOpacity>
            </View>
          )}

          {escrow.buyer && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buyer</Text>
              <Text style={styles.infoValue}>
                {escrow.buyer.firstName} {escrow.buyer.lastName} ({escrow.buyer.email})
              </Text>
            </View>
          )}

          {escrow.seller && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Seller</Text>
              <Text style={styles.infoValue}>
                {escrow.seller.firstName} {escrow.seller.lastName} ({escrow.seller.email})
              </Text>
            </View>
          )}
        </View>

        {canFund && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleFund}
            disabled={fundMutation.isPending}
          >
            {fundMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Fund Escrow</Text>
            )}
          </TouchableOpacity>
        )}

        {canShip && (
          <View style={styles.card}>
            <Text style={styles.label}>Tracking Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleShip}
              disabled={shipMutation.isPending}
            >
              {shipMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Mark as Shipped</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {canMarkServiceCompleted && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleServiceCompleted}
            disabled={serviceCompletedMutation.isPending}
          >
            {serviceCompletedMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Mark Service Completed</Text>
            )}
          </TouchableOpacity>
        )}

        {canDeliver && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={handleDeliver}
              disabled={deliverMutation.isPending}
            >
              {deliverMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Mark as Delivered (no code)</Text>
              )}
            </TouchableOpacity>
            {firstShipmentWithCode && (
              <View style={styles.card}>
                <Text style={styles.label}>Confirm with delivery code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter delivery code"
                  value={deliveryCodeInput}
                  onChangeText={(t) => setDeliveryCodeInput(t.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#d97706', marginTop: 8 }]}
                  onPress={handleConfirmDeliveryByCode}
                  disabled={confirmDeliveryByCodeMutation.isPending || !deliveryCodeInput.trim()}
                >
                  {confirmDeliveryByCodeMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>Confirm with code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {canRelease && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={handleRelease}
            disabled={releaseMutation.isPending}
          >
            {releaseMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {escrow?.status === 'AWAITING_RELEASE' ? 'Confirm Service & Release Funds' : 'Release Funds'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push(`/(tabs)/disputes/new?escrowId=${id}`)}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Create Dispute</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push(`/(tabs)/escrows/${id}/messages`)}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        escrowId={id!}
        rateeId={isBuyer ? escrow?.sellerId : escrow?.buyerId}
        rateeName={
          isBuyer
            ? `${escrow?.seller?.firstName || ''} ${escrow?.seller?.lastName || ''}`.trim() || escrow?.seller?.email || 'Seller'
            : `${escrow?.buyer?.firstName || ''} ${escrow?.buyer?.lastName || ''}`.trim() || escrow?.buyer?.email || 'Buyer'
        }
        role={isBuyer ? 'buyer' : 'seller'}
      />
    </ScrollView>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusAWAITING_FUNDING: {
    backgroundColor: '#f59e0b',
  },
  statusFUNDED: {
    backgroundColor: '#3b82f6',
  },
  statusSHIPPED: {
    backgroundColor: '#8b5cf6',
  },
  statusDELIVERED: {
    backgroundColor: '#10b981',
  },
  statusAWAITING_RELEASE: {
    backgroundColor: '#4f46e5',
  },
  statusRELEASED: {
    backgroundColor: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  actionButtonSuccess: {
    backgroundColor: '#10b981',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#3b82f6',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
