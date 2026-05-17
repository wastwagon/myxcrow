import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { form } from '@/lib/form-classes';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/profile'), 1500);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const eyeBtn = 'absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary';

  if (!isAuthenticated()) return null;

  return (
    <Layout>
      <PageHeader
        title="Change password"
        subtitle="Update your account password"
        icon={<Lock className="w-6 h-6" />}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className={`${form.panel} space-y-6`}>
          <div>
            <label htmlFor="currentPassword" className={form.label}>
              Current password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${form.input} pr-12`}
                placeholder="Enter current password"
                required
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className={eyeBtn}>
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className={form.label}>
              New password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${form.input} pr-12`}
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={eyeBtn}>
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={form.label}>
              Confirm new password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${form.input} pr-12`}
                placeholder="Confirm new password"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={eyeBtn}>
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="rounded-ios-lg bg-white/5 border border-white/10 p-4">
              <p className="text-ios-footnote font-medium text-label-secondary mb-2">Password strength</p>
              <ul className="space-y-1 text-ios-footnote">
                {[
                  { ok: newPassword.length >= 8, label: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                  { ok: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
                  { ok: /[0-9]/.test(newPassword), label: 'Number' },
                  { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Special character' },
                ].map(({ ok, label }) => (
                  <li key={label} className={ok ? 'text-emerald-400' : 'text-label-tertiary'}>
                    {ok ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="filled" size="lg" fullWidth loading={changePasswordMutation.isPending}>
              Change password
            </Button>
          </div>
        </form>

        <div className={form.calloutInfo}>
          <p className="text-sm text-label-secondary">
            <strong className="text-label-primary">Security notice: </strong>
            You will stay signed in on this device. Log out everywhere if you suspect unauthorized access.
          </p>
        </div>
      </div>
    </Layout>
  );
}
