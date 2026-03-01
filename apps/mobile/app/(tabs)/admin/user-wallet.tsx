import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import { formatCurrency, CURRENCY_SYMBOL } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

export default function AdminUserWalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-wallet', userId],
    url: `/wallet/admin/${userId}`,
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No user ID provided</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading wallet…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Failed to load wallet</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { wallet, user } = data;

  const walletMutation = useMutation({
    mutationFn: async (op: 'CREDIT' | 'DEBIT') => {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) throw new Error('Invalid amount');
      const endpoint = op === 'CREDIT' ? '/wallet/admin/credit' : '/wallet/admin/debit';
      return apiClient.post(endpoint, {
        userId,
        amountCents: Math.round(amt * 100),
        description: description.trim() || (op === 'CREDIT' ? 'Manual credit' : 'Manual debit'),
      });
    },
    onSuccess: (_, op) => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet', userId] });
      Toast.show({ type: 'success', text1: 'Success', text2: `Wallet ${op === 'CREDIT' ? 'credited' : 'debited'}` });
      setAmount('');
      setDescription('');
      refetch();
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Operation failed' });
    },
  });

  const handleCredit = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter valid amount' });
      return;
    }
    Alert.alert('Credit Wallet', `Add ${formatCurrency(amt * 100)} to ${user?.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Credit', onPress: () => walletMutation.mutate('CREDIT') },
    ]);
  };

  const handleDebit = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter valid amount' });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Description required for debit' });
      return;
    }
    Alert.alert('Debit Wallet', `Remove ${formatCurrency(amt * 100)} from ${user?.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Debit', style: 'destructive', onPress: () => walletMutation.mutate('DEBIT') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Available</Text>
          <Text style={styles.value}>
            {formatCurrency(wallet?.availableCents ?? 0)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Pending</Text>
          <Text style={styles.value}>
            {formatCurrency(wallet?.pendingCents ?? 0)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Currency</Text>
          <Text style={styles.value}>{wallet?.currency ?? 'GHS'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Credit / Debit</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Amount ({CURRENCY_SYMBOL})</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description (required for debit)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Reason..."
            multiline
          />
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.creditButton]}
            onPress={handleCredit}
            disabled={walletMutation.isPending}
          >
            {walletMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Credit</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.debitButton]}
            onPress={handleDebit}
            disabled={walletMutation.isPending}
          >
            {walletMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="remove-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Debit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.usersLink}
        onPress={() => router.push('/(tabs)/admin/users')}
      >
        <Ionicons name="people" size={20} color="#6b7280" />
        <Text style={styles.usersLinkText}>Back to Users</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  back: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  error: {
    fontSize: 16,
    color: '#dc2626',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  creditButton: {
    backgroundColor: '#10b981',
  },
  debitButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  field: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  usersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  usersLinkText: {
    fontSize: 15,
    color: '#6b7280',
  },
});
