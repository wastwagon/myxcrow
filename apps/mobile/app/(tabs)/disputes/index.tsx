import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatDate, formatStatus } from '../../../src/lib/constants';

export default function DisputesScreen() {
  const router = useRouter();

  const { data: disputes, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['disputes'],
    url: '/disputes',
  });

  const renderDispute = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/disputes/${item.id}`)}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dispute #{item.id.slice(0, 8)}</Text>
          <Text style={[styles.badge, (styles as any)[`badge${item.status}`]]}>
          {formatStatus(item.status)}
        </Text>
      </View>
      <Text style={styles.meta}>
        Reason: {formatStatus(item.reason)} • Escrow: {item.escrowId?.slice(0, 8)}
      </Text>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      <Text style={styles.date}>Opened: {formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Disputes</Text>
        <TouchableOpacity style={styles.helpButton} onPress={() => router.push('/(tabs)/escrows')}>
          <Text style={styles.helpButtonText}>Go to Escrows</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <Text>Loading disputes...</Text>
        </View>
      ) : (
        <FlatList
          data={disputes || []}
          renderItem={renderDispute}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No disputes found</Text>
              <Text style={styles.emptyHint}>
                Open a dispute from an escrow’s detail screen.
              </Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  helpButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  helpButtonText: { color: '#fff', fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  badgeOPEN: { backgroundColor: '#FEF3C7', color: '#92400E' },
  badgeNEGOTIATION: { backgroundColor: '#FFEDD5', color: '#9A3412' },
  badgeMEDIATION: { backgroundColor: '#FFEDD5', color: '#9A3412' },
  badgeARBITRATION: { backgroundColor: '#FFEDD5', color: '#9A3412' },
  badgeRESOLVED: { backgroundColor: '#D1FAE5', color: '#065F46' },
  badgeCLOSED: { backgroundColor: '#E5E7EB', color: '#374151' },
  meta: { marginTop: 8, color: '#6b7280', fontSize: 12 },
  description: { marginTop: 8, color: '#374151', fontSize: 14 },
  date: { marginTop: 10, color: '#9ca3af', fontSize: 12 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  emptyHint: { marginTop: 6, color: '#9ca3af', textAlign: 'center' },
});

