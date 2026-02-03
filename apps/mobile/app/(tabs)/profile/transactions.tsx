import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatCurrency, formatDate } from '../../../src/lib/constants';

export default function TransactionsScreen() {
  const router = useRouter();

  const { data: transactions, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['wallet-transactions'],
    url: '/wallet/transactions',
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.meta}>{item.description || '—'}</Text>
        <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, item.amountCents >= 0 ? styles.pos : styles.neg]}>
        {item.amountCents >= 0 ? '+' : ''}
        {formatCurrency(item.amountCents, item.currency)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { color: '#374151', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  row: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10 },
  type: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  amount: { fontSize: 14, fontWeight: '800' },
  pos: { color: '#059669' },
  neg: { color: '#dc2626' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontWeight: '600' },
});

