import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatCurrency } from '../../../src/lib/constants';

interface ReconciliationSummary {
  escrowsByStatus: Array<{
    status: string;
    count: number;
    totalAmountCents: number;
  }>;
  escrowsByCurrency: Array<{
    currency: string;
    count: number;
    totalAmountCents: number;
    totalFeesCents: number;
    totalNetAmountCents: number;
  }>;
  totals: {
    totalEscrowValue: number;
    totalFees: number;
    totalReleased: number;
    totalPending: number;
  };
  generatedAt: string;
}

interface BalanceComparison {
  escrowHoldBalance: number;
  feesRevenue: number;
  pendingEscrows: number;
  difference: number;
  reconciled: boolean;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  AWAITING_FUNDING: { bg: '#fef3c7', text: '#d97706' },
  FUNDED: { bg: '#dbeafe', text: '#1e40af' },
  SHIPPED: { bg: '#e9d5ff', text: '#7c3aed' },
  DELIVERED: { bg: '#dcfce7', text: '#059669' },
  RELEASED: { bg: '#f3f4f6', text: '#6b7280' },
  DISPUTED: { bg: '#fee2e2', text: '#dc2626' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function ReconciliationScreen() {
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<ReconciliationSummary>({
    queryKey: ['reconciliation-summary'],
    url: '/admin/reconciliation',
  });

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<BalanceComparison>({
    queryKey: ['reconciliation-balance'],
    url: '/admin/reconciliation/balance',
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchBalance()]);
    setRefreshing(false);
  }, [refetchSummary, refetchBalance]);

  if (summaryLoading && !summary) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading reconciliation...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary Cards */}
      {summary && (
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Ionicons name="wallet-outline" size={28} color="#3b82f6" />
            <Text style={styles.cardLabel}>Total Escrow Value</Text>
            <Text style={styles.cardValue}>{formatCurrency(summary.totals.totalEscrowValue)}</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="bar-chart-outline" size={28} color="#8b5cf6" />
            <Text style={styles.cardLabel}>Total Fees</Text>
            <Text style={styles.cardValue}>{formatCurrency(summary.totals.totalFees)}</Text>
          </View>
        </View>
      )}
      {summary && (
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />
            <Text style={styles.cardLabel}>Total Released</Text>
            <Text style={styles.cardValue}>{formatCurrency(summary.totals.totalReleased)}</Text>
          </View>
          <View style={styles.card}>
            <Ionicons name="time-outline" size={28} color="#f59e0b" />
            <Text style={styles.cardLabel}>Total Pending</Text>
            <Text style={styles.cardValue}>{formatCurrency(summary.totals.totalPending)}</Text>
          </View>
        </View>
      )}

      {/* Balance Reconciliation */}
      {balanceLoading ? (
        <View style={styles.section}>
          <ActivityIndicator />
        </View>
      ) : balance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Reconciliation</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Escrow Hold Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance.escrowHoldBalance)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Pending Escrows</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance.pendingEscrows)}</Text>
          </View>
          <View style={[styles.balanceRow, styles.differenceRow]}>
            <Text style={styles.balanceLabel}>Difference</Text>
            <Text style={[styles.balanceValue, balance.difference !== 0 && styles.differenceBad]}>
              {formatCurrency(Math.abs(balance.difference))}
              {balance.difference !== 0 && (balance.difference > 0 ? ' Over' : ' Under')}
            </Text>
          </View>
          <View style={[styles.reconciledBadge, balance.reconciled ? styles.reconciledOk : styles.reconciledBad]}>
            <Ionicons
              name={balance.reconciled ? 'checkmark-circle' : 'alert-circle'}
              size={24}
              color={balance.reconciled ? '#059669' : '#dc2626'}
            />
            <Text style={[styles.reconciledText, balance.reconciled ? styles.reconciledOkText : styles.reconciledBadText]}>
              {balance.reconciled ? 'Reconciled' : 'Not Reconciled'}
            </Text>
          </View>
        </View>
      )}

      {/* Escrows by Status */}
      {summary && summary.escrowsByStatus?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escrows by Status</Text>
          {summary.escrowsByStatus.map((item) => {
            const colors = statusColors[item.status] || { bg: '#f3f4f6', text: '#6b7280' };
            return (
              <View key={item.status} style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.statusCount}>{item.count}</Text>
                <Text style={styles.statusAmount}>{formatCurrency(item.totalAmountCents)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Escrows by Currency */}
      {summary && summary.escrowsByCurrency?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escrows by Currency</Text>
          {summary.escrowsByCurrency.map((item) => (
            <View key={item.currency} style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>₵</Text>
              <Text style={styles.currencyCount}>{item.count}</Text>
              <Text style={styles.currencyAmount}>{formatCurrency(item.totalAmountCents)}</Text>
              <Text style={styles.currencyFees}>{formatCurrency(item.totalFeesCents)}</Text>
              <Text style={styles.currencyNet}>{formatCurrency(item.totalNetAmountCents)}</Text>
            </View>
          ))}
        </View>
      )}

      {summary && (
        <Text style={styles.generatedAt}>
          Generated: {new Date(summary.generatedAt).toLocaleString()}
        </Text>
      )}
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
  cardsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
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
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  differenceRow: {
    borderBottomWidth: 0,
  },
  differenceBad: {
    color: '#dc2626',
  },
  reconciledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  reconciledOk: {
    backgroundColor: '#dcfce7',
  },
  reconciledBad: {
    backgroundColor: '#fee2e2',
  },
  reconciledText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reconciledOkText: {
    color: '#059669',
  },
  reconciledBadText: {
    color: '#dc2626',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 120,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    width: 24,
  },
  currencyCount: {
    width: 40,
    fontSize: 14,
    color: '#6b7280',
  },
  currencyAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  currencyFees: {
    fontSize: 14,
    color: '#6b7280',
  },
  currencyNet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  generatedAt: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
});
