import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatCurrency, formatDate } from '../../../src/lib/constants';

export default function WalletScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    url: '/wallet/transactions',
  });

  React.useEffect(() => {
    refreshUser();
  }, []);

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text
          style={[
            styles.transactionAmount,
            item.amountCents > 0 ? styles.positive : styles.negative,
          ]}
        >
          {item.amountCents > 0 ? '+' : ''}
          {formatCurrency(item.amountCents, item.currency)}
        </Text>
      </View>
      <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      {item.description && <Text style={styles.transactionDescription}>{item.description}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(user?.walletBalance || 0)}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/wallet/topup')}
        >
          <Text style={styles.actionButtonText}>Top Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => router.push('/(tabs)/wallet/withdraw')}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={transactions || []}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    backgroundColor: '#3b82f6',
    padding: 24,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
  transactionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});

