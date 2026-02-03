import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import Toast from 'react-native-toast-message';

const REASONS = [
  { value: 'NOT_RECEIVED', label: 'Not received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'DEFECTIVE', label: 'Defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item' },
  { value: 'PARTIAL_DELIVERY', label: 'Partial delivery' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function NewDisputeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { escrowId } = useLocalSearchParams<{ escrowId?: string }>();

  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('NOT_RECEIVED');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!escrowId) throw new Error('Missing escrowId');
      return apiClient.post('/disputes', { escrowId, reason, description });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      Toast.show({ type: 'success', text1: 'Dispute opened', text2: 'We will review it shortly.' });
      router.replace(`/(tabs)/disputes/${res.data.id}`);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to open dispute',
        text2: error.response?.data?.message || error.message || 'Unknown error',
      });
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Open a dispute</Text>
      <Text style={styles.subtitle}>
        Funds will be held until an admin resolves the dispute.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Escrow ID</Text>
        <Text style={styles.value}>{escrowId || '—'}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Reason</Text>
        <View style={styles.reasonGrid}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonChip, reason === r.value && styles.reasonChipActive]}
              onPress={() => setReason(r.value)}
            >
              <Text style={[styles.reasonText, reason === r.value && styles.reasonTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Explain what happened..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, !escrowId && styles.buttonDisabled]}
          onPress={() => createMutation.mutate()}
          disabled={!escrowId || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit dispute</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60 },
  back: { color: '#374151', marginBottom: 12, fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle: { marginTop: 6, color: '#6b7280' },
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 12, color: '#6b7280' },
  value: { marginTop: 4, fontSize: 14, fontWeight: '600', color: '#111827' },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  reasonChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  reasonText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  reasonTextActive: { color: '#fff' },
  textarea: {
    marginTop: 8,
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

