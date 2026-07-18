import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Settings, Save, Shield, DollarSign, Bell, Lock, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { admin } from '@/components/admin/adminClasses';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { calculateEscrowFees, formatPaidByLabel } from '@/lib/fee-calculator';
import { formatCurrency } from '@/lib/utils';

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
  const isMobile = useIsMobileNav();

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const settingsTabs = ['fees', 'general', 'security', 'notifications'] as const;
  const [activeTab, setActiveTab] = useState<'fees' | 'general' | 'security' | 'notifications'>('fees');
  const [feePreviewAmount, setFeePreviewAmount] = useState(100);
  const [settings, setSettings] = useState<PlatformSettings>({
    fees: { percentage: 5, fixedCents: 0, paidBy: 'split' },
    general: { platformName: 'MYXCROW', supportEmail: 'support@myxcrow.com', maintenanceMode: false },
    security: { requireKYC: true, minPasswordLength: 8, sessionTimeout: 7 },
    notifications: { emailEnabled: true, smsEnabled: false },
  });

  useEffect(() => {
    const tab = router.query.tab;
    if (typeof tab === 'string' && settingsTabs.includes(tab as (typeof settingsTabs)[number])) {
      setActiveTab(tab as (typeof settingsTabs)[number]);
    }
  }, [router.query.tab]);

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

  const feePreview = useMemo(() => {
    if (feePreviewAmount < 1) return null;
    return calculateEscrowFees(Math.round(feePreviewAmount * 100), settings.fees);
  }, [feePreviewAmount, settings.fees]);

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

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshSettings} disabled={!isMobile} className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Platform Settings"
          subtitle="Configure system-wide settings and preferences"
          icon={<Settings className="w-6 h-6 text-white" />}
        />

        {/* Tabs */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card">
          <div className="border-b border-white/10">
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
                      ? 'border-brand-gold text-brand-gold'
                      : 'border-transparent text-white/55 hover:text-white/80 hover:border-white/20'
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
                  <h3 className="text-lg font-semibold text-white mb-4">Fee Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
                      />
                      <p className="mt-1 text-sm text-white/55">
                        Percentage of escrow amount charged as fee (e.g., 5 for 5%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Fixed Fee (₵)
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
                        className={admin.input}
                      />
                      <p className="mt-1 text-sm text-white/55">Fixed amount charged per transaction</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="split">Split (50/50)</option>
                      </select>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('fees')}
                      disabled={updateMutation.isPending || feesLoading}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Fee Settings
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-md font-semibold text-white mb-3">Live fee preview</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Example deal amount (₵)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={feePreviewAmount}
                      onChange={(e) => setFeePreviewAmount(parseFloat(e.target.value) || 0)}
                      className={admin.input}
                    />
                  </div>
                  {feePreview && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Deal amount</span>
                        <span>{formatCurrency(feePreview.amountCents, 'GHS')}</span>
                      </div>
                      {feePreview.buyerFeeCents > 0 && (
                        <div className="flex justify-between text-white/80">
                          <span>Buyer pays (added)</span>
                          <span className="text-amber-300">+ {formatCurrency(feePreview.buyerFeeCents, 'GHS')}</span>
                        </div>
                      )}
                      {feePreview.buyerFeeCents > 0 && (
                        <div className="flex justify-between font-medium text-white pt-1 border-t border-white/10">
                          <span>Buyer funds from wallet</span>
                          <span>{formatCurrency(feePreview.fundingAmountCents, 'GHS')}</span>
                        </div>
                      )}
                      {feePreview.sellerFeeCents > 0 && (
                        <div className="flex justify-between text-white/80">
                          <span>Seller pays (deducted)</span>
                          <span>− {formatCurrency(feePreview.sellerFeeCents, 'GHS')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/80">
                        <span>Seller receives</span>
                        <span className="text-emerald-400">{formatCurrency(feePreview.netAmountCents, 'GHS')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-white/55 pt-1">
                        <span>Platform fee ({feePreview.feePercentage}% · {formatPaidByLabel(feePreview.paidBy)})</span>
                        <span>{formatCurrency(feePreview.feeCents, 'GHS')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
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
                        className="w-5 h-5 text-brand-gold border-white/20 rounded focus:ring-brand-gold"
                      />
                      <label htmlFor="maintenanceMode" className="text-sm font-medium text-white/80">
                        Maintenance Mode
                      </label>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('general')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save General Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
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
                        className="w-5 h-5 text-brand-gold border-white/20 rounded focus:ring-brand-gold"
                      />
                      <label htmlFor="requireKYC" className="text-sm font-medium text-white/80">
                        Require KYC Verification
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
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
                        className={admin.input}
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('security')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Security Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
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
                        className="w-5 h-5 text-brand-gold border-white/20 rounded focus:ring-brand-gold"
                      />
                      <label htmlFor="emailEnabled" className="text-sm font-medium text-white/80">
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
                        className="w-5 h-5 text-brand-gold border-white/20 rounded focus:ring-brand-gold"
                      />
                      <label htmlFor="smsEnabled" className="text-sm font-medium text-white/80">
                        Enable SMS Notifications
                      </label>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('notifications')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}

