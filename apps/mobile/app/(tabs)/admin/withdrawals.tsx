import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import { formatCurrency, formatDate } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

interface Withdrawal {
  id: string;
  amountCents: number;
  feeCents?: number;
  currency?: string;
  status: string;
  methodType: string;
  methodDetails: any;
  createdAt: string;
  wallet: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    availableCents?: number;
  };
}

export default function WithdrawalApprovalsScreen() {
  const queryClient = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('REQUESTED');
  const { data: withdrawalsData, isLoading, refetch } = useQuery<{ withdrawals: Withdrawal[]; total: number }>({
    queryKey: ['admin-withdrawals', statusFilter],
    url: statusFilter === 'all'
      ? '/wallet/admin/withdrawals?limit=50'
      : `/wallet/admin/withdrawals?status=${statusFilter}&limit=50`,
  });
  const withdrawals = withdrawalsData?.withdrawals ?? [];

  const processMutation = useMutation({
    mutationFn: async ({ id, succeeded, reason }: { id: string; succeeded: boolean; reason?: string }) => {
      return apiClient.put(`/wallet/withdraw/${id}/process`, { succeeded, reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: variables.succeeded ? 'Withdrawal approved' : 'Withdrawal denied',
      });
      setDetailModalVisible(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to process withdrawal',
      });
    },
  });

  const user = (w: Withdrawal) => w.wallet?.user ?? (w as any).user;
  const handleApprove = (withdrawal: Withdrawal) => {
    const u = user(withdrawal);
    Alert.alert(
      'Approve Withdrawal',
      `Approve ${formatCurrency(withdrawal.amountCents)} withdrawal for ${u?.firstName || ''} ${u?.lastName || ''} (${u?.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => processMutation.mutate({ id: withdrawal.id, succeeded: true }),
        },
      ]
    );
  };

  const handleReject = (withdrawal: Withdrawal) => {
    if (!rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please provide a rejection reason',
      });
      return;
    }

    Alert.alert(
      'Deny Withdrawal',
      'Are you sure you want to deny this withdrawal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: () =>
            processMutation.mutate({ id: withdrawal.id, succeeded: false, reason: rejectionReason }),
        },
      ]
    );
  };

  const openDetailModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDetailModalVisible(true);
    setRejectionReason('');
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status filter */}
      <View style={styles.filterRow}>
        {(['REQUESTED', 'all', 'SUCCEEDED', 'FAILED'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s === 'all' ? 'All' : s === 'REQUESTED' ? 'Pending' : s === 'SUCCEEDED' ? 'Approved' : 'Denied'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!withdrawals || withdrawals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>
            {statusFilter === 'REQUESTED' ? 'No Pending Withdrawals' : 'No Withdrawals Found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {statusFilter === 'REQUESTED' ? 'All withdrawal requests have been processed' : 'Try a different filter'}
          </Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {withdrawals.map((withdrawal) => {
          const u = user(withdrawal);
          return (
          <TouchableOpacity
            key={withdrawal.id}
            style={styles.withdrawalCard}
            onPress={() => openDetailModal(withdrawal)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.userSection}>
                <Text style={styles.userName}>
                  {u?.firstName || ''} {u?.lastName || ''}
                </Text>
                <Text style={styles.userEmail}>{u?.email}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(withdrawal.amountCents)}</Text>
                <Text style={styles.date}>{formatDate(withdrawal.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.methodContainer}>
              <Ionicons name="card-outline" size={16} color="#6b7280" />
              <Text style={styles.methodText}>
                {withdrawal.methodType === 'BANK_ACCOUNT' ? 'Bank Transfer' : 
                 withdrawal.methodType === 'MOBILE_MONEY' ? 'Mobile Money' : 
                 withdrawal.methodType}
              </Text>
            </View>

            {withdrawal.methodDetails && (
              <View style={styles.detailsPreview}>
                {withdrawal.methodDetails.accountNumber && (
                  <Text style={styles.detailText}>
                    Acct: {withdrawal.methodDetails.accountNumber}
                  </Text>
                )}
                {withdrawal.methodDetails.phoneNumber && (
                  <Text style={styles.detailText}>
                    Phone: {withdrawal.methodDetails.phoneNumber}
                  </Text>
                )}
                {withdrawal.methodDetails.accountName && (
                  <Text style={styles.detailText}>
                    Name: {withdrawal.methodDetails.accountName}
                  </Text>
                )}
              </View>
            )}

            {withdrawal.wallet?.availableCents != null && (
            <View style={styles.walletInfo}>
              <Ionicons name="wallet-outline" size={14} color="#6b7280" />
              <Text style={styles.walletText}>
                Wallet Balance: {formatCurrency(withdrawal.wallet.availableCents)}
              </Text>
            </View>
            )}

            <View style={styles.actionRow}>
              <Text style={styles.reviewPrompt}>
                {withdrawal.status === 'REQUESTED' ? 'Tap to review' : withdrawal.status}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        );
        })}
      </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        {selectedWithdrawal && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Withdrawal Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Amount Section */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Withdrawal Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(selectedWithdrawal.amountCents)}
                </Text>
              </View>

              {/* User Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>User Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedWithdrawal.wallet?.user?.firstName || ''} {selectedWithdrawal.wallet?.user?.lastName || ''}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedWithdrawal.wallet?.user?.email}</Text>
                </View>
                {selectedWithdrawal.wallet?.availableCents != null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Wallet Balance:</Text>
                  <Text style={styles.infoValue}>
                    {formatCurrency(selectedWithdrawal.wallet.availableCents)}
                  </Text>
                </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Requested:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedWithdrawal.createdAt)}</Text>
                </View>
              </View>

              {/* Payment Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Payment Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Method:</Text>
                  <Text style={styles.infoValue}>
                    {selectedWithdrawal.methodType === 'BANK_ACCOUNT' ? 'Bank Transfer' : 
                     selectedWithdrawal.methodType === 'MOBILE_MONEY' ? 'Mobile Money' : 
                     selectedWithdrawal.methodType}
                  </Text>
                </View>
                {selectedWithdrawal.methodDetails?.accountNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Number:</Text>
                    <Text style={styles.infoValue}>
                      {selectedWithdrawal.methodDetails.accountNumber}
                    </Text>
                  </View>
                )}
                {selectedWithdrawal.methodDetails?.accountName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Name:</Text>
                    <Text style={styles.infoValue}>
                      {selectedWithdrawal.methodDetails.accountName}
                    </Text>
                  </View>
                )}
                {selectedWithdrawal.methodDetails?.bankName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bank:</Text>
                    <Text style={styles.infoValue}>{selectedWithdrawal.methodDetails.bankName}</Text>
                  </View>
                )}
                {selectedWithdrawal.methodDetails?.phoneNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <Text style={styles.infoValue}>
                      {selectedWithdrawal.methodDetails.phoneNumber}
                    </Text>
                  </View>
                )}
                {selectedWithdrawal.methodDetails?.provider && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Provider:</Text>
                    <Text style={styles.infoValue}>{selectedWithdrawal.methodDetails.provider}</Text>
                  </View>
                )}
              </View>

              {/* Rejection Reason */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Rejection Reason (if rejecting)</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(selectedWithdrawal)}
                disabled={processMutation.isPending}
              >
                {processMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(selectedWithdrawal)}
                disabled={processMutation.isPending}
              >
                {processMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  withdrawalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userSection: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  date: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  detailsPreview: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#374151',
    marginVertical: 2,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  reviewPrompt: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  amountSection: {
    backgroundColor: '#dcfce7',
    padding: 24,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#047857',
  },
  modalSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
