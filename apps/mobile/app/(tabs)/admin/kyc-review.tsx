import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import { formatDate } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');

interface KYCSubmission {
  id: string;
  userId: string;
  status: string;
  ghanaCardNumber: string;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  cardFrontUrl?: string;
  cardBackUrl?: string;
  selfieUrl?: string;
  faceMatchScore?: number;
}

export default function KYCReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: submissions, isLoading } = useQuery<KYCSubmission[]>({
    queryKey: ['admin-kyc-pending'],
    url: '/admin/kyc/pending',
  });

  const approveMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiClient.put(`/admin/kyc/${submissionId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'KYC verification approved',
      });
      setReviewModalVisible(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to approve KYC',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      return apiClient.put(`/admin/kyc/${submissionId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'KYC verification rejected',
      });
      setReviewModalVisible(false);
      setSelectedSubmission(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to reject KYC',
      });
    },
  });

  const handleApprove = (submission: KYCSubmission) => {
    Alert.alert(
      'Approve KYC',
      `Are you sure you want to approve KYC verification for ${submission.user.firstName} ${submission.user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => approveMutation.mutate(submission.id),
        },
      ]
    );
  };

  const handleReject = (submission: KYCSubmission) => {
    if (!rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please provide a rejection reason',
      });
      return;
    }

    Alert.alert(
      'Reject KYC',
      `Are you sure you want to reject this KYC verification?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () =>
            rejectMutation.mutate({ submissionId: submission.id, reason: rejectionReason }),
        },
      ]
    );
  };

  const openReviewModal = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalVisible(true);
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No Pending KYC Reviews</Text>
        <Text style={styles.emptySubtext}>All KYC submissions have been reviewed</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {submissions.map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={styles.submissionCard}
            onPress={() => openReviewModal(submission)}
          >
            <View style={styles.submissionHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {submission.user.firstName} {submission.user.lastName}
                </Text>
                <Text style={styles.userEmail}>{submission.user.email}</Text>
                <Text style={styles.cardNumber}>Card: {submission.ghanaCardNumber}</Text>
              </View>
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Submitted</Text>
                <Text style={styles.dateValue}>{formatDate(submission.createdAt)}</Text>
              </View>
            </View>

            {submission.faceMatchScore !== undefined && (
              <View style={styles.faceMatchContainer}>
                <Ionicons
                  name={
                    submission.faceMatchScore >= 0.8
                      ? 'checkmark-circle'
                      : submission.faceMatchScore >= 0.6
                      ? 'alert-circle'
                      : 'close-circle'
                  }
                  size={20}
                  color={
                    submission.faceMatchScore >= 0.8
                      ? '#10b981'
                      : submission.faceMatchScore >= 0.6
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                />
                <Text style={styles.faceMatchText}>
                  Face Match: {(submission.faceMatchScore * 100).toFixed(1)}%
                </Text>
              </View>
            )}

            <View style={styles.thumbnailRow}>
              {submission.cardFrontUrl && (
                <Image source={{ uri: submission.cardFrontUrl }} style={styles.thumbnail} />
              )}
              {submission.cardBackUrl && (
                <Image source={{ uri: submission.cardBackUrl }} style={styles.thumbnail} />
              )}
              {submission.selfieUrl && (
                <Image source={{ uri: submission.selfieUrl }} style={styles.thumbnail} />
              )}
            </View>

            <View style={styles.actionRow}>
              <Text style={styles.reviewPrompt}>Tap to review</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        {selectedSubmission && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Review KYC</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* User Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>User Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedSubmission.user.firstName} {selectedSubmission.user.lastName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedSubmission.user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ghana Card:</Text>
                  <Text style={styles.infoValue}>{selectedSubmission.ghanaCardNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Submitted:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedSubmission.createdAt)}</Text>
                </View>
                {selectedSubmission.faceMatchScore !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Face Match:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        {
                          color:
                            selectedSubmission.faceMatchScore >= 0.8
                              ? '#10b981'
                              : selectedSubmission.faceMatchScore >= 0.6
                              ? '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {(selectedSubmission.faceMatchScore * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Documents */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Documents</Text>
                {selectedSubmission.cardFrontUrl && (
                  <TouchableOpacity
                    onPress={() => openImageModal(selectedSubmission.cardFrontUrl!)}
                  >
                    <Image
                      source={{ uri: selectedSubmission.cardFrontUrl }}
                      style={styles.fullImage}
                    />
                    <Text style={styles.imageLabel}>Ghana Card (Front)</Text>
                  </TouchableOpacity>
                )}
                {selectedSubmission.cardBackUrl && (
                  <TouchableOpacity
                    onPress={() => openImageModal(selectedSubmission.cardBackUrl!)}
                  >
                    <Image
                      source={{ uri: selectedSubmission.cardBackUrl }}
                      style={styles.fullImage}
                    />
                    <Text style={styles.imageLabel}>Ghana Card (Back)</Text>
                  </TouchableOpacity>
                )}
                {selectedSubmission.selfieUrl && (
                  <TouchableOpacity onPress={() => openImageModal(selectedSubmission.selfieUrl!)}>
                    <Image source={{ uri: selectedSubmission.selfieUrl }} style={styles.fullImage} />
                    <Text style={styles.imageLabel}>Selfie</Text>
                  </TouchableOpacity>
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
                onPress={() => handleReject(selectedSubmission)}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
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
                onPress={() => handleApprove(selectedSubmission)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
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

      {/* Image Zoom Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  submissionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
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
  cardNumber: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  dateValue: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  faceMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  faceMatchText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
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
  },
  fullImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  imageLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
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
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
});
