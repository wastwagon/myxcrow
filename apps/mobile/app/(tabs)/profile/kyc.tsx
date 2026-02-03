import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { formatStatus } from '../../../src/lib/constants';
import { showMessenger } from '../../../src/services/intercom';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

type KycDetail = {
  id: string;
  userId: string;
  ghanaCardNumber?: string | null;
  cardFrontUrl?: string | null;
  cardBackUrl?: string | null;
  selfieUrl?: string | null;
  faceMatchScore?: number | null;
  faceMatchPassed?: boolean;
  adminApproved?: boolean;
  rejectionReason?: string | null;
  user?: {
    id: string;
    email: string;
    kycStatus: string;
  };
} | null;

function toUploadPart(asset: ImagePicker.ImagePickerAsset, name: string) {
  const uri = asset.uri;
  const ext = uri.split('.').pop()?.toLowerCase();
  const type =
    ext === 'png'
      ? 'image/png'
      : ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : 'image/jpeg';
  return { uri, type, name } as any;
}

export default function KycScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [kycDetail, setKycDetail] = useState<KycDetail>(null);
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [cardFront, setCardFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cardBack, setCardBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selfie, setSelfie] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const canResubmit = useMemo(() => {
    const status = (user?.kycStatus || 'PENDING').toUpperCase();
    return status !== 'VERIFIED';
  }, [user?.kycStatus]);

  const loadKyc = async () => {
    try {
      setLoadingKyc(true);
      const res = await apiClient.get('/kyc/me');
      const detail = res.data as KycDetail;
      setKycDetail(detail);
      if (detail?.ghanaCardNumber) {
        setGhanaCardNumber(detail.ghanaCardNumber);
      }
    } catch (e: any) {
      // If user has no KYC detail yet (unlikely since registration requires), keep going.
      setKycDetail(null);
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const pickImage = async (type: 'cardFront' | 'cardBack' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        if (type === 'cardFront') setCardFront(result.assets[0]);
        else if (type === 'cardBack') setCardBack(result.assets[0]);
        else setSelfie(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async (type: 'cardFront' | 'cardBack' | 'selfie') => {
    if (cameraPermission === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        if (type === 'cardFront') setCardFront(result.assets[0]);
        else if (type === 'cardBack') setCardBack(result.assets[0]);
        else setSelfie(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const submitResubmission = async () => {
    if (!canResubmit) return;
    if (!ghanaCardNumber.trim()) {
      Alert.alert('Missing Ghana Card Number', 'Please enter your Ghana Card number');
      return;
    }
    if (!cardFront || !cardBack || !selfie) {
      Alert.alert('Missing Documents', 'Please upload Ghana Card front, back, and selfie photo');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('ghanaCardNumber', ghanaCardNumber.trim());
      formData.append('files', toUploadPart(cardFront, 'card-front.jpg'));
      formData.append('files', toUploadPart(cardBack, 'card-back.jpg'));
      formData.append('files', toUploadPart(selfie, 'selfie.jpg'));

      const res = await apiClient.post('/kyc/resubmit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const faceMatchScore = res.data?.faceMatchScore;
      Alert.alert(
        'KYC Submitted',
        faceMatchScore != null
          ? `Submitted successfully. Face match score: ${(faceMatchScore * 100).toFixed(1)}%.`
          : 'Submitted successfully.',
      );

      // Refresh local user status + screen data
      await refreshUser();
      await loadKyc();
      queryClient.invalidateQueries();

      // Clear selected images so user sees it submitted
      setCardFront(null);
      setCardBack(null);
      setSelfie(null);
    } catch (e: any) {
      Alert.alert('KYC Submission Failed', e?.response?.data?.message || e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>KYC</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Current status</Text>
        <Text style={styles.status}>{formatStatus(user?.kycStatus || 'PENDING')}</Text>

        {loadingKyc ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading your KYC details…</Text>
          </View>
        ) : (
          <>
            {!!kycDetail?.rejectionReason && (
              <View style={styles.warnBox}>
                <Text style={styles.warnTitle}>Last rejection reason</Text>
                <Text style={styles.warnText}>{kycDetail.rejectionReason}</Text>
              </View>
            )}

            <Text style={styles.note}>
              KYC is required before you can create/fund escrows. You can resubmit your Ghana Card and selfie here.
            </Text>

            {!canResubmit ? (
              <View style={styles.okBox}>
                <Text style={styles.okText}>Your KYC is already verified.</Text>
              </View>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Ghana Card Number</Text>
                  <TextInput
                    value={ghanaCardNumber}
                    onChangeText={setGhanaCardNumber}
                    autoCapitalize="characters"
                    placeholder="GHA-123456789-1"
                    style={styles.textInput}
                  />
                  <Text style={styles.helpText}>Format: GHA-XXXXXXXXX-X</Text>
                </View>

                <Text style={styles.sectionTitle}>Ghana Card Front</Text>
                <DocumentUpload
                  hasValue={!!cardFront}
                  onTakePicture={() => takePicture('cardFront')}
                  onPickImage={() => pickImage('cardFront')}
                  onRemove={() => setCardFront(null)}
                />

                <Text style={styles.sectionTitle}>Ghana Card Back</Text>
                <DocumentUpload
                  hasValue={!!cardBack}
                  onTakePicture={() => takePicture('cardBack')}
                  onPickImage={() => pickImage('cardBack')}
                  onRemove={() => setCardBack(null)}
                />

                <Text style={styles.sectionTitle}>Selfie Photo</Text>
                <DocumentUpload
                  hasValue={!!selfie}
                  onTakePicture={() => takePicture('selfie')}
                  onPickImage={() => pickImage('selfie')}
                  onRemove={() => setSelfie(null)}
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                  onPress={submitResubmission}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Submit KYC</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <TouchableOpacity style={styles.supportBtn} onPress={showMessenger}>
          <Text style={styles.supportText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DocumentUpload({
  hasValue,
  onPickImage,
  onTakePicture,
  onRemove,
}: {
  hasValue: boolean;
  onPickImage: () => void;
  onTakePicture: () => void;
  onRemove: () => void;
}) {
  if (hasValue) {
    return (
      <View style={styles.imagePreview}>
        <Text style={styles.imagePreviewText}>✓ Photo selected</Text>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.uploadContainer}>
      <TouchableOpacity style={styles.uploadButton} onPress={onTakePicture}>
        <Text style={styles.uploadButtonText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.uploadButton, styles.uploadButtonSecondary]} onPress={onPickImage}>
        <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { color: '#374151', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  card: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  label: { color: '#6b7280', fontSize: 12 },
  status: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#111827' },
  note: { marginTop: 12, color: '#6b7280', fontSize: 13, lineHeight: 18 },
  loadingRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#6b7280' },
  warnBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#FEF3C7' },
  warnTitle: { fontWeight: '800', color: '#92400E', marginBottom: 4 },
  warnText: { color: '#92400E' },
  okBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#D1FAE5' },
  okText: { color: '#065F46', fontWeight: '800' },
  sectionTitle: { marginTop: 14, fontSize: 14, fontWeight: '800', color: '#111827' },
  uploadContainer: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 4 },
  uploadButton: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  uploadButtonSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#3b82f6' },
  uploadButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  uploadButtonTextSecondary: { color: '#3b82f6' },
  imagePreview: { marginTop: 10, backgroundColor: '#d1fae5', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imagePreviewText: { color: '#059669', fontWeight: '700' },
  removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
  removeButtonText: { color: '#dc2626', fontSize: 13, fontWeight: '700' },
  primaryBtn: { marginTop: 14, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
  field: { marginTop: 12 },
  fieldLabel: { color: '#6b7280', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    color: '#111827',
    fontWeight: '700',
  },
  helpText: { marginTop: 6, color: '#6b7280', fontSize: 12 },
  supportBtn: { marginTop: 16, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  supportText: { color: '#fff', fontWeight: '800' },
});

