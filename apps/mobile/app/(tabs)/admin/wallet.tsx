import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/api-client';
import { formatCurrency, CURRENCY_SYMBOL } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

export default function WalletOperationsScreen() {
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [operation, setOperation] = useState<'CREDIT' | 'DEBIT'>('CREDIT');

  const [searchedUser, setSearchedUser] = useState<any | null>(null);

  const searchUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiClient.get(`/admin/users/search?email=${email}`);
      return response.data;
    },
    onSuccess: (data) => {
      setSearchedUser(data);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'User not found',
      });
      setSearchedUser(null);
    },
  });

  const walletOperationMutation = useMutation({
    mutationFn: async (data: { userId: string; amountCents: number; description: string; type: string }) => {
      const endpoint = operation === 'CREDIT' ? '/admin/wallet/credit' : '/admin/wallet/debit';
      return apiClient.post(endpoint, data);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Wallet ${operation === 'CREDIT' ? 'credited' : 'debited'} successfully`,
      });
      // Reset form
      setAmount('');
      setDescription('');
      setSearchedUser(null);
      setUserEmail('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Operation failed',
      });
    },
  });

  const handleSearchUser = () => {
    if (!userEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter user email',
      });
      return;
    }
    searchUserMutation.mutate(userEmail.trim());
  };

  const handleSubmit = () => {
    if (!searchedUser) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please search for a user first',
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount',
      });
      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a description',
      });
      return;
    }

    Alert.alert(
      `${operation === 'CREDIT' ? 'Credit' : 'Debit'} Wallet`,
      `${operation === 'CREDIT' ? 'Add' : 'Remove'} ${formatCurrency(amountValue * 100)} ${operation === 'CREDIT' ? 'to' : 'from'} ${searchedUser.firstName} ${searchedUser.lastName}'s wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            walletOperationMutation.mutate({
              userId: searchedUser.id,
              amountCents: amountValue * 100,
              description: description.trim(),
              type: operation,
            }),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Operation Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operation Type</Text>
        <View style={styles.operationButtons}>
          <TouchableOpacity
            style={[
              styles.operationButton,
              operation === 'CREDIT' && styles.operationButtonActive,
            ]}
            onPress={() => setOperation('CREDIT')}
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={operation === 'CREDIT' ? '#fff' : '#10b981'}
            />
            <Text
              style={[
                styles.operationButtonText,
                operation === 'CREDIT' && styles.operationButtonTextActive,
              ]}
            >
              Credit (Add Funds)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.operationButton,
              operation === 'DEBIT' && styles.operationButtonActive,
            ]}
            onPress={() => setOperation('DEBIT')}
          >
            <Ionicons
              name="remove-circle"
              size={24}
              color={operation === 'DEBIT' ? '#fff' : '#ef4444'}
            />
            <Text
              style={[
                styles.operationButtonText,
                operation === 'DEBIT' && styles.operationButtonTextActive,
              ]}
            >
              Debit (Remove Funds)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Find User</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter user email address"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchUser}
            disabled={searchUserMutation.isPending}
          >
            {searchUserMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info (if found) */}
      {searchedUser && (
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <Ionicons name="person-circle" size={48} color="#3b82f6" />
            <View style={styles.userCardInfo}>
              <Text style={styles.userCardName}>
                {searchedUser.firstName} {searchedUser.lastName}
              </Text>
              <Text style={styles.userCardEmail}>{searchedUser.email}</Text>
            </View>
          </View>
          <View style={styles.walletInfo}>
            <Ionicons name="wallet" size={20} color="#6b7280" />
            <Text style={styles.walletLabel}>Current Balance:</Text>
            <Text style={styles.walletBalance}>
              {formatCurrency(searchedUser.wallet?.availableCents || 0)}
            </Text>
          </View>
        </View>
      )}

      {/* Amount Input */}
      {searchedUser && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount ({CURRENCY_SYMBOL})</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Reason for this operation..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                operation === 'CREDIT' ? styles.creditButton : styles.debitButton,
              ]}
              onPress={handleSubmit}
              disabled={walletOperationMutation.isPending}
            >
              {walletOperationMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={operation === 'CREDIT' ? 'add-circle' : 'remove-circle'}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {operation === 'CREDIT' ? 'Credit Wallet' : 'Debit Wallet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.warningText}>
              This action will {operation === 'CREDIT' ? 'add funds to' : 'remove funds from'} the
              user's wallet and create an audit log entry. Make sure the amount and description are
              correct.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  operationButtons: {
    gap: 12,
  },
  operationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  operationButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  operationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  operationButtonTextActive: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userCardEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 'auto',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  creditButton: {
    backgroundColor: '#10b981',
  },
  debitButton: {
    backgroundColor: '#ef4444',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 12,
    lineHeight: 18,
  },
});
