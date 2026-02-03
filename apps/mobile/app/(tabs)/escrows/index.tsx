import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatCurrency, formatDate, formatStatus } from '../../../src/lib/constants';

export default function EscrowsScreen() {
  const router = useRouter();

  const { data: escrows, isLoading, refetch } = useQuery({
    queryKey: ['escrows'],
    url: '/escrows',
  });

  const renderEscrow = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.escrowCard}
      onPress={() => router.push(`/(tabs)/escrows/${item.id}`)}
    >
      <View style={styles.escrowHeader}>
        <Text style={styles.escrowId}>#{item.id.slice(0, 8)}</Text>
        <Text style={[styles.status, (styles as any)[`status${item.status}`]]}>
          {formatStatus(item.status)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(item.amountCents, item.currency)}</Text>
      <Text style={styles.date}>Created: {formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Escrows</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/escrows/new')}
        >
          <Text style={styles.createButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading escrows...</Text>
        </View>
      ) : (
        <FlatList
          data={escrows || []}
          renderItem={renderEscrow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No escrows yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/escrows/new')}
              >
                <Text style={styles.emptyButtonText}>Create Your First Escrow</Text>
              </TouchableOpacity>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  escrowCard: {
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
  escrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  escrowId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusAWAITING_FUNDING: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  statusFUNDED: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  statusAWAITING_SHIPMENT: {
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
  },
  statusSHIPPED: {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
  },
  statusIN_TRANSIT: {
    backgroundColor: '#e0e7ff',
    color: '#6366f1',
  },
  statusDELIVERED: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  statusAWAITING_RELEASE: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  statusRELEASED: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  statusDISPUTED: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  statusREFUNDED: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  statusCANCELLED: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
