import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import Toast from 'react-native-toast-message';

interface PlatformSettings {
  fees: {
    percentage: number;
    fixedCents: number;
    paidBy: string;
  };
  general: {
    platformName: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  security: {
    requireKYC: boolean;
    minPasswordLength: number;
    sessionTimeout: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
}

type TabId = 'fees' | 'general' | 'security' | 'notifications';

export default function AdminSettingsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('fees');
  const [settings, setSettings] = useState<PlatformSettings>({
    fees: { percentage: 5, fixedCents: 0, paidBy: 'buyer' },
    general: { platformName: 'MYXCROW', supportEmail: 'support@myxcrow.com', maintenanceMode: false },
    security: { requireKYC: true, minPasswordLength: 8, sessionTimeout: 7 },
    notifications: { emailEnabled: true, smsEnabled: false },
  });

  const { data: feeSettings, isLoading: feesLoading } = useQuery({
    queryKey: ['fee-settings'],
    url: '/settings/fees',
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return apiClient.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Settings updated' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update settings',
      });
    },
  });

  useEffect(() => {
    if (feeSettings) {
      setSettings((prev) => ({
        ...prev,
        fees: {
          percentage: feeSettings.percentage ?? 5,
          fixedCents: feeSettings.fixedCents ?? 0,
          paidBy: feeSettings.paidBy ?? 'buyer',
        },
      }));
    }
  }, [feeSettings]);

  const updateFeesMutation = useMutation({
    mutationFn: async (data: { percentage: number; fixedCents: number; paidBy: string }) => {
      return apiClient.put('/settings/fees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Fee settings updated' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update fees',
      });
    },
  });

  const handleSave = async (section: keyof PlatformSettings) => {
    const sectionData = settings[section];
    if (section === 'fees') {
      const feesData = sectionData as PlatformSettings['fees'];
      await updateFeesMutation.mutateAsync({
        percentage: feesData.percentage,
        fixedCents: feesData.fixedCents,
        paidBy: feesData.paidBy,
      });
    } else {
      for (const [key, value] of Object.entries(sectionData)) {
        await updateMutation.mutateAsync({ key: `${section}.${key}`, value });
      }
    }
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'fees', label: 'Fees', icon: 'cash-outline' },
    { id: 'general', label: 'General', icon: 'globe-outline' },
    { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'fees' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fee Configuration</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Percentage Fee (%)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.fees.percentage)}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    fees: { ...settings.fees, percentage: parseFloat(v) || 0 },
                  })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Fixed Fee (₵)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.fees.fixedCents / 100)}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    fees: { ...settings.fees, fixedCents: Math.round((parseFloat(v) || 0) * 100) },
                  })
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Fee Paid By</Text>
              <View style={styles.optionRow}>
                {(['buyer', 'seller', 'split'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionChip,
                      settings.fees.paidBy === opt && styles.optionChipActive,
                    ]}
                    onPress={() =>
                      setSettings({ ...settings, fees: { ...settings.fees, paidBy: opt } })
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        settings.fees.paidBy === opt && styles.optionChipTextActive,
                      ]}
                    >
                      {opt === 'split' ? 'Split' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave('fees')}
              disabled={updateFeesMutation.isPending || feesLoading}
            >
              {updateFeesMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Fee Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'general' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Platform Name</Text>
              <TextInput
                style={styles.input}
                value={settings.general.platformName}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, platformName: v },
                  })
                }
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Support Email</Text>
              <TextInput
                style={styles.input}
                value={settings.general.supportEmail}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, supportEmail: v },
                  })
                }
                keyboardType="email-address"
              />
            </View>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Maintenance Mode</Text>
                <Switch
                  value={settings.general.maintenanceMode}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, maintenanceMode: v },
                    })
                  }
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave('general')}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save General Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Require KYC</Text>
                <Switch
                  value={settings.security.requireKYC}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, requireKYC: v },
                    })
                  }
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Min Password Length</Text>
              <TextInput
                style={styles.input}
                value={String(settings.security.minPasswordLength)}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      minPasswordLength: parseInt(v, 10) || 8,
                    },
                  })
                }
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Session Timeout (days)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.security.sessionTimeout)}
                onChangeText={(v) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: parseInt(v, 10) || 7,
                    },
                  })
                }
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave('security')}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Security Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'notifications' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Email Notifications</Text>
                <Switch
                  value={settings.notifications.emailEnabled}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailEnabled: v },
                    })
                  }
                />
              </View>
            </View>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>SMS Notifications</Text>
                <Switch
                  value={settings.notifications.smsEnabled}
                  onValueChange={(v) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, smsEnabled: v },
                    })
                  }
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSave('notifications')}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Notification Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  optionChipActive: {
    backgroundColor: '#3b82f6',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
