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
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import { formatDate } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../../src/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  kycStatus: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['BUYER', 'SELLER', 'ADMIN', 'SUPPORT', 'AUDITOR'] as const;

export default function UserManagementScreen() {
  const router = useRouter();
  const { impersonate: doImpersonate } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);

  const { data: usersResponse, isLoading, refetch } = useQuery<{ users: User[] }>({
    queryKey: ['admin-users'],
    url: '/users?limit=100',
  });
  const users = usersResponse?.users ?? [];

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => apiClient.put(`/users/${userId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'User approved' });
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to approve' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) =>
      apiClient.put(`/users/${userId}/role`, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Roles updated' });
      setEditingUser(null);
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.message || 'Failed to update roles' });
    },
  });

  const toggleActiveStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiClient.put(`/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'User status updated',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update user status',
      });
    },
  });

  const handleToggleActive = (user: User) => {
    Alert.alert(
      `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user.isActive ? 'Deactivate' : 'Activate',
          style: user.isActive ? 'destructive' : 'default',
          onPress: () => toggleActiveStatus.mutate({ userId: user.id, isActive: !user.isActive }),
        },
      ]
    );
  };

  const handleImpersonate = async (user: User) => {
    if (user.roles?.includes('ADMIN')) {
      Toast.show({ type: 'error', text1: 'Cannot impersonate admin' });
      return;
    }
    Alert.alert('Impersonate', `Log in as ${user.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Impersonate',
        onPress: async () => {
          try {
            await doImpersonate(user.id);
            Toast.show({ type: 'success', text1: 'Logged in', text2: `As ${user.email}` });
            router.replace('/(tabs)/dashboard');
          } catch (e: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: e.message });
          }
        },
      },
    ]);
  };

  const openRoleModal = (user: User) => {
    setEditingUser(user);
    setEditingRoles([...user.roles]);
  };

  const toggleRole = (role: string) => {
    setEditingRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const getKYCBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { bg: '#dcfce7', text: '#059669' };
      case 'PENDING':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'REJECTED':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{users?.length || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{users?.filter((u) => u.isActive).length || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {users?.filter((u) => u.kycStatus === 'VERIFIED').length || 0}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredUsers?.map((user) => {
          const kycColor = getKYCBadgeColor(user.kycStatus);
          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    {!user.isActive && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inactive</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
                </View>
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: kycColor.bg }]}>
                  <Text style={[styles.badgeText, { color: kycColor.text }]}>
                    KYC: {user.kycStatus}
                  </Text>
                </View>
                {user.roles.map((role) => (
                  <View
                    key={role}
                    style={[
                      styles.badge,
                      { backgroundColor: role === 'ADMIN' ? '#dbeafe' : '#f3f4f6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: role === 'ADMIN' ? '#1e40af' : '#6b7280' },
                      ]}
                    >
                      {role}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.userMeta}>
                <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                <Text style={styles.metaText}>Joined {formatDate(user.createdAt)}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewWalletButton]}
                  onPress={() => router.push({ pathname: '/(tabs)/admin/user-wallet', params: { userId: user.id } })}
                >
                  <Ionicons name="wallet-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Wallet</Text>
                </TouchableOpacity>
                {!user.roles?.includes('ADMIN') && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
                  onPress={() => handleImpersonate(user)}
                >
                  <Ionicons name="person-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Login As</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                  onPress={() => openRoleModal(user)}
                >
                  <Ionicons name="people-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Roles</Text>
                </TouchableOpacity>
                {user.kycStatus === 'PENDING' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#059669' }]}
                  onPress={() => {
                    Alert.alert('Approve User', `Approve ${user.email}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Approve', onPress: () => approveMutation.mutate(user.id) },
                    ]);
                  }}
                  disabled={approveMutation.isPending}
                >
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    user.isActive ? styles.deactivateButton : styles.activateButton,
                  ]}
                  onPress={() => handleToggleActive(user)}
                  disabled={toggleActiveStatus.isPending}
                >
                  {toggleActiveStatus.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={user.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.actionButtonText}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredUsers?.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      </ScrollView>

      {/* Role Edit Modal */}
      <Modal visible={!!editingUser} animationType="slide" presentationStyle="pageSheet">
        {editingUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Roles</Text>
              <TouchableOpacity
                onPress={() => {
                  if (editingRoles.length === 0) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'User must have at least one role' });
                    return;
                  }
                  updateRoleMutation.mutate({ userId: editingUser.id, roles: editingRoles });
                }}
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.modalSave}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.modalUser}>{editingUser.email}</Text>
            <View style={styles.roleList}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleChip, editingRoles.includes(role) && styles.roleChipActive]}
                  onPress={() => toggleRole(role)}
                >
                  <Text style={[styles.roleChipText, editingRoles.includes(role) && styles.roleChipTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Modal>
    </View>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  userPhone: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewWalletButton: {
    backgroundColor: '#3b82f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  modalUser: {
    padding: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  roleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  roleChipActive: {
    backgroundColor: '#3b82f6',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  roleChipTextActive: {
    color: '#fff',
  },
});
