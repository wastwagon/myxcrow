import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import { formatDate, formatStatus } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

export default function DisputeDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const r = await apiClient.get(`/disputes/${id}`);
      return r.data;
    },
    enabled: !!id,
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
});

