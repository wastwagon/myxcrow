import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import { formatDate, formatStatus } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../../src/contexts/AuthContext';

export default function DisputeDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [outcome, setOutcome] = useState<'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER'>('RELEASE_TO_SELLER');

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPPORT');

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const r = await apiClient.get(`/disputes/${id}`);
      return r.data;
    },
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: async (data: { resolution: string; outcome: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER' }) => {
      return apiClient.put(`/disputes/${id}/resolve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      Toast.show({ type: 'success', text1: 'Resolved', text2: 'Dispute resolved and funds applied' });
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to resolve' });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => apiClient.put(`/disputes/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      Toast.show({ type: 'success', text1: 'Closed', text2: 'Dispute closed' });
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to close' });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      await apiClient.post(`/disputes/${id}/message`, { content: message.trim() });
    },
    onSuccess: async () => {
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      Toast.show({ type: 'success', text1: 'Message sent' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to send',
        text2: error.response?.data?.message || 'Try again',
      });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading dispute...</Text>
      </View>
    );
  }

  if (!dispute) {
    return (
      <View style={styles.loading}>
        <Text>Dispute not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#3b82f6', fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const messages = dispute.messages || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Dispute #{dispute.id.slice(0, 8)}</Text>
        <Text style={styles.status}>{formatStatus(dispute.status)}</Text>
        <Text style={styles.meta}>
          Escrow: {dispute.escrowId?.slice(0, 8)} • {formatStatus(dispute.reason)}
        </Text>
        <Text style={styles.date}>Opened: {formatDate(dispute.createdAt)}</Text>
      </View>

      {dispute.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.text}>{dispute.description}</Text>
        </View>
      ) : null}

      {/* Admin: Resolve / Close */}
      {isAdmin && dispute.status === 'OPEN' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <Text style={styles.label}>Resolution notes</Text>
          <TextInput
            style={styles.resolutionInput}
            placeholder="Enter resolution notes..."
            value={resolution}
            onChangeText={setResolution}
            multiline
          />
          <View style={styles.outcomeRow}>
            <TouchableOpacity
              style={[styles.outcomeChip, outcome === 'RELEASE_TO_SELLER' && styles.outcomeChipActive]}
              onPress={() => setOutcome('RELEASE_TO_SELLER')}
            >
              <Text style={[styles.outcomeText, outcome === 'RELEASE_TO_SELLER' && styles.outcomeTextActive]}>
                Release to Seller
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.outcomeChip, outcome === 'REFUND_TO_BUYER' && styles.outcomeChipActive]}
              onPress={() => setOutcome('REFUND_TO_BUYER')}
            >
              <Text style={[styles.outcomeText, outcome === 'REFUND_TO_BUYER' && styles.outcomeTextActive]}>
                Refund to Buyer
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.adminButton, styles.resolveButton]}
              onPress={() => {
                if (!resolution.trim()) {
                  Toast.show({ type: 'error', text1: 'Enter resolution notes' });
                  return;
                }
                Alert.alert('Resolve Dispute', `Outcome: ${outcome === 'RELEASE_TO_SELLER' ? 'Release to seller' : 'Refund to buyer'}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Resolve', onPress: () => resolveMutation.mutate({ resolution, outcome }) },
                ]);
              }}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.adminButtonText}>Resolve</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminButton, styles.closeButton]}
              onPress={() => {
                Alert.alert('Close Dispute', 'Close without resolving?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Close', style: 'destructive', onPress: () => closeMutation.mutate() },
                ]);
              }}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.adminButtonText}>Close</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {dispute.status === 'RESOLVED' && (dispute.resolutionOutcome || dispute.resolution) ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resolution</Text>
          {dispute.resolutionOutcome ? (
            <Text style={styles.text}>
              Outcome:{' '}
              {dispute.resolutionOutcome === 'RELEASE_TO_SELLER'
                ? 'Released to seller'
                : 'Refunded to buyer'}
            </Text>
          ) : null}
          {dispute.resolution ? <Text style={styles.text}>Notes: {dispute.resolution}</Text> : null}
          {dispute.resolvedAt ? (
            <Text style={styles.small}>Resolved: {formatDate(dispute.resolvedAt)}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Messages</Text>
        {messages.length === 0 ? (
          <Text style={styles.small}>No messages yet.</Text>
        ) : (
          messages.map((m: any) => (
            <View key={m.id} style={[styles.message, m.isSystem && styles.messageSystem]}>
              <Text style={styles.small}>
                {m.isSystem ? 'System' : m.senderId?.slice(0, 8)} • {formatDate(m.createdAt)}
              </Text>
              <Text style={styles.text}>{m.content}</Text>
            </View>
          ))
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Write a message..."
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage.mutate()}
            disabled={!message.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  back: { color: '#374151', marginBottom: 12, fontSize: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  status: { marginTop: 6, color: '#6b7280', fontWeight: '700' },
  meta: { marginTop: 6, color: '#6b7280' },
  date: { marginTop: 6, color: '#9ca3af', fontSize: 12 },
  card: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  text: { color: '#374151' },
  small: { color: '#9ca3af', fontSize: 12 },
  message: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  messageSystem: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10 },
  composer: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  sendButton: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  resolutionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#111827',
  },
  outcomeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  outcomeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  outcomeChipActive: { backgroundColor: '#3b82f6' },
  outcomeText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  outcomeTextActive: { color: '#fff' },
  adminActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  adminButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButton: { backgroundColor: '#10b981' },
  closeButton: { backgroundColor: '#6b7280' },
  adminButtonText: { color: '#fff', fontWeight: '600' },
});

