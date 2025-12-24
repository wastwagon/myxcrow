import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Settings, Save, RefreshCw, Shield, DollarSign, Bell, Lock, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';

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

export default function AdminSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<'fees' | 'general' | 'security' | 'notifications'>('fees');
  const [settings, setSettings] = useState<PlatformSettings>({
    fees: { percentage: 5, fixedCents: 0, paidBy: 'buyer' },
    general: { platformName: 'MYXCROW', supportEmail: 'support@myxcrow.com', maintenanceMode: false },
    security: { requireKYC: true, minPasswordLength: 8, sessionTimeout: 7 },
    notifications: { emailEnabled: true, smsEnabled: false },
  });

  // Fetch fee settings
  const { data: feeSettings, isLoading: feesLoading } = useQuery({
    queryKey: ['fee-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/fees');
      return response.data;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return apiClient.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (feeSettings) {
      setSettings((prev) => ({
        ...prev,
        fees: {
          percentage: feeSettings.percentage || 5,
          fixedCents: feeSettings.fixedCents || 0,
          paidBy: feeSettings.paidBy || 'buyer',
        },
      }));
    }
  }, [feeSettings]);

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const handleSave = async (section: keyof PlatformSettings) => {
    const sectionData = settings[section];
    if (section === 'fees') {
      const feesData = sectionData as PlatformSettings['fees'];
      await updateMutation.mutateAsync({
        key: 'fees.percentage',
        value: feesData.percentage,
      });
      await updateMutation.mutateAsync({
        key: 'fees.fixedCents',
        value: feesData.fixedCents,
      });
      await updateMutation.mutateAsync({
        key: 'fees.paidBy',
        value: feesData.paidBy,
      });
    } else {
      // For other sections, save individual keys
      for (const [key, value] of Object.entries(sectionData)) {
        await updateMutation.mutateAsync({
          key: `${section}.${key}`,
          value,
        });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Platform Settings"
          subtitle="Configure system-wide settings and preferences"
          icon={<Settings className="w-6 h-6 text-white" />}
          gradient="purple"
        />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'fees', label: 'Fees', icon: DollarSign },
                { id: 'general', label: 'General', icon: Globe },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Fees Tab */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage Fee (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.fees.percentage}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: { ...settings.fees, percentage: parseFloat(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Percentage of escrow amount charged as fee (e.g., 5 for 5%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fixed Fee (GHS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.fees.fixedCents / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: {
                              ...settings.fees,
                              fixedCents: Math.round(parseFloat(e.target.value) * 100) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-sm text-gray-500">Fixed amount charged per transaction</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Paid By
                      </label>
                      <select
                        value={settings.fees.paidBy}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: { ...settings.fees, paidBy: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="split">Split (50/50)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleSave('fees')}
                      disabled={updateMutation.isPending || feesLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Fee Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.platformName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, platformName: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, supportEmail: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, maintenanceMode: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                        Maintenance Mode
                      </label>
                    </div>

                    <button
                      onClick={() => handleSave('general')}
                      disabled={updateMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save General Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="requireKYC"
                        checked={settings.security.requireKYC}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: { ...settings.security, requireKYC: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="requireKYC" className="text-sm font-medium text-gray-700">
                        Require KYC Verification
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Password Length
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="32"
                        value={settings.security.minPasswordLength}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              minPasswordLength: parseInt(e.target.value) || 8,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              sessionTimeout: parseInt(e.target.value) || 7,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={() => handleSave('security')}
                      disabled={updateMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Security Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailEnabled"
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, emailEnabled: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                        Enable Email Notifications
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="smsEnabled"
                        checked={settings.notifications.smsEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, smsEnabled: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
                        Enable SMS Notifications
                      </label>
                    </div>

                    <button
                      onClick={() => handleSave('notifications')}
                      disabled={updateMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Notification Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

