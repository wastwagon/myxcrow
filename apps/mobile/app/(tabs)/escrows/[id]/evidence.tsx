import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../../src/lib/api-client';
import { useQuery } from '../../../../src/hooks/useQuery';
import { formatDate } from '../../../../src/lib/constants';

type Evidence = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
  type: string;
  description?: string | null;
  createdAt: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function EscrowEvidenceScreen() {
  const router = useRouter();
  const { id: escrowId } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', escrowId],
    url: `/escrows/${escrowId}`,
    enabled: !!escrowId,
  });

  const evidenceList: Evidence[] = useMemo(() => escrow?.evidence ?? [], [escrow]);

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      await apiClient.delete(`/evidence/${evidenceId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      Toast.show({ type: 'success', text1: 'Deleted' });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Failed', text2: error.response?.data?.message || 'Could not delete' });
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelected(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelected(result.assets[0]);
    }
  };

  const upload = async () => {
    if (!escrowId || !selected) return;

    try {
      setUploading(true);

      const fileName = selected.fileName || `evidence_${Date.now()}.jpg`;
      const fileResp = await fetch(selected.uri);
      const blob = await fileResp.blob();
      const mimeType = blob.type || 'image/jpeg';

      // Step 1: presigned URL
      const presigned = await apiClient.post('/evidence/presigned-url', {
        escrowId,
        fileName,
        fileSize: blob.size,
        mimeType,
      });

      const { uploadUrl, objectName } = presigned.data;

      // Step 2: upload to storage
      const putResp = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': mimeType },
      });
      if (!putResp.ok) {
        throw new Error('Upload failed');
      }

      // Step 3: create evidence record
      await apiClient.post('/evidence/verify-upload', {
        escrowId,
        objectName,
        fileName,
        fileSize: blob.size,
        mimeType,
        type: 'PHOTO',
        description: 'Mobile upload',
      });

      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      Toast.show({ type: 'success', text1: 'Uploaded' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: error.response?.data?.message || error.message });
    } finally {
      setUploading(false);
    }
  };

  const download = async (evidenceId: string) => {
    try {
      const resp = await apiClient.get(`/evidence/${evidenceId}/download`);
      const { downloadUrl } = resp.data;
      // For now open in external browser (mobile browsers handle viewing/downloading).
      await Linking.openURL(downloadUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not get download link' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Evidence</Text>
      <Text style={styles.subTitle}>Upload and manage evidence for this escrow.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Upload</Text>

        <View style={styles.row}>
          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto} disabled={uploading}>
            <Text style={styles.primaryBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage} disabled={uploading}>
            <Text style={styles.secondaryBtnText}>Choose</Text>
          </TouchableOpacity>
        </View>

        {selected ? (
          <View style={{ marginTop: 12 }}>
            <Image source={{ uri: selected.uri }} style={styles.preview} />
            <Text style={styles.small}>
              {selected.fileName || 'Selected image'} • {selected.fileSize ? formatBytes(selected.fileSize) : '—'}
            </Text>
            <TouchableOpacity style={[styles.uploadBtn, uploading && styles.disabled]} onPress={upload} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadBtnText}>Upload</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.small}>Tip: upload shipment/delivery photos or receipts.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Uploaded Evidence</Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Loading…</Text>
          </View>
        ) : evidenceList.length === 0 ? (
          <Text style={styles.small}>No evidence uploaded yet.</Text>
        ) : (
          evidenceList.map((e) => (
            <View key={e.id} style={styles.evidenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceName}>{e.fileName}</Text>
                <Text style={styles.small}>
                  {formatBytes(e.fileSize)} • {e.type} • {formatDate(e.createdAt)}
                </Text>
                {e.description ? <Text style={styles.small}>{e.description}</Text> : null}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => download(e.id)} style={styles.actionChip}>
                  <Text style={styles.actionText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteMutation.mutate(e.id)}
                  style={[styles.actionChip, styles.dangerChip]}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={[styles.actionText, styles.dangerText]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  back: { color: '#374151', marginBottom: 12, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subTitle: { marginTop: 6, color: '#6b7280' },
  card: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#3b82f6', fontWeight: '800' },
  preview: { marginTop: 10, width: '100%', height: 220, borderRadius: 12, backgroundColor: '#f3f4f6' },
  uploadBtn: { marginTop: 12, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.6 },
  small: { marginTop: 8, color: '#6b7280', fontSize: 12 },
  loading: { paddingVertical: 12, alignItems: 'center' },
  evidenceRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 },
  evidenceName: { fontWeight: '800', color: '#111827' },
  actions: { justifyContent: 'center', gap: 8 },
  actionChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#eef2ff', borderRadius: 10 },
  actionText: { color: '#3730a3', fontWeight: '800', fontSize: 12 },
  dangerChip: { backgroundColor: '#fee2e2' },
  dangerText: { color: '#991b1b' },
});

