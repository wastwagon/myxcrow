import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '../../../src/hooks/useQuery';
import { formatCurrency } from '../../../src/lib/constants';
import { useAuth } from '../../../src/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalEscrows: number;
  activeEscrows: number;
  totalDisputes: number;
  openDisputes: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  platformRevenue: number;
  totalVolume: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Redirect non-admins
  React.useEffect(() => {
    if (user && !user.roles?.includes('ADMIN')) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user]);

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    url: '/admin/stats',
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    url: '/admin/activity/recent?limit=5',
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const adminMenuItems = [
    {
      title: 'User Management',
      description: 'Manage platform users',
      icon: 'people-outline',
      route: '/(tabs)/admin/users',
      color: '#3b82f6',
      badge: stats?.activeUsers,
    },
    {
      title: 'KYC Review',
      description: 'Review pending verifications',
      icon: 'shield-checkmark-outline',
      route: '/(tabs)/admin/kyc-review',
      color: '#f59e0b',
      badge: stats?.pendingKYC,
    },
    {
      title: 'Withdrawal Approvals',
      description: 'Approve pending withdrawals',
      icon: 'cash-outline',
      route: '/(tabs)/admin/withdrawals',
      color: '#10b981',
      badge: stats?.pendingWithdrawals,
    },
    {
      title: 'Wallet Operations',
      description: 'Credit/debit user wallets',
      icon: 'wallet-outline',
      route: '/(tabs)/admin/wallet',
      color: '#8b5cf6',
    },
    {
      title: 'Platform Settings',
      description: 'Configure system settings',
      icon: 'settings-outline',
      route: '/(tabs)/admin/settings',
      color: '#6b7280',
    },
    {
      title: 'Fee Management',
      description: 'Configure fees and pricing',
      icon: 'calculator-outline',
      route: '/(tabs)/admin/fees',
      color: '#ec4899',
    },
    {
      title: 'Reconciliation',
      description: 'Financial reconciliation',
      icon: 'receipt-outline',
      route: '/(tabs)/admin/reconciliation',
      color: '#06b6d4',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Platform Management & Monitoring</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
          <Ionicons name="people" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statSubtext}>{stats?.activeUsers || 0} active</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats?.totalEscrows || 0}</Text>
          <Text style={styles.statLabel}>Total Escrows</Text>
          <Text style={styles.statSubtext}>{stats?.activeEscrows || 0} active</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="alert-circle" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats?.totalDisputes || 0}</Text>
          <Text style={styles.statLabel}>Disputes</Text>
          <Text style={styles.statSubtext}>{stats?.openDisputes || 0} open</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
          <Ionicons name="cash" size={24} color="#6366f1" />
          <Text style={styles.statValue}>{formatCurrency(stats?.platformRevenue || 0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statSubtext}>Platform fees</Text>
        </View>
      </View>

      {/* Alert Cards */}
      {(stats?.pendingKYC || 0) > 0 && (
        <TouchableOpacity
          style={[styles.alertCard, { backgroundColor: '#fef3c7', borderLeftColor: '#f59e0b' }]}
          onPress={() => router.push('/(tabs)/admin/kyc-review')}
        >
          <Ionicons name="warning" size={24} color="#f59e0b" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Pending KYC Reviews</Text>
            <Text style={styles.alertText}>
              {stats?.pendingKYC} verification{stats?.pendingKYC !== 1 ? 's' : ''} awaiting review
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {(stats?.pendingWithdrawals || 0) > 0 && (
        <TouchableOpacity
          style={[styles.alertCard, { backgroundColor: '#dcfce7', borderLeftColor: '#10b981' }]}
          onPress={() => router.push('/(tabs)/admin/withdrawals')}
        >
          <Ionicons name="cash" size={24} color="#10b981" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Pending Withdrawals</Text>
            <Text style={styles.alertText}>
              {stats?.pendingWithdrawals} withdrawal{stats?.pendingWithdrawals !== 1 ? 's' : ''} awaiting approval
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#10b981" />
        </TouchableOpacity>
      )}

      {(stats?.openDisputes || 0) > 0 && (
        <TouchableOpacity
          style={[styles.alertCard, { backgroundColor: '#fee2e2', borderLeftColor: '#ef4444' }]}
          onPress={() => router.push('/(tabs)/disputes')}
        >
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Open Disputes</Text>
            <Text style={styles.alertText}>
              {stats?.openDisputes} dispute{stats?.openDisputes !== 1 ? 's' : ''} requiring attention
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ef4444" />
        </TouchableOpacity>
      )}

      {/* Admin Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Functions</Text>
        {adminMenuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <View style={styles.menuTitleRow}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.badge !== undefined && item.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: item.color }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity: any, index: number) => (
            <View key={index} style={styles.activityItem}>
              <Ionicons name="ellipse" size={8} color="#3b82f6" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  alertText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 13,
    color: '#374151',
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
});
