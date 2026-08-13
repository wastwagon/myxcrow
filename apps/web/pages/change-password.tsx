import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
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
      toast.success('Password changed — check your phone for a confirmation SMS');
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
    <CustomerLayout title="Password" back>
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
            <div className="rounded-[12px] bg-[#f2f2f7] p-4">
              <p className="text-[13px] font-medium text-[rgba(60,60,67,0.6)] mb-2">Password</p>
              <ul className="space-y-1 text-[13px]">
                {[
                  { ok: newPassword.length >= 8, label: 'At least 8 characters' },
                  { ok: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
                  { ok: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
                  { ok: /[0-9]/.test(newPassword), label: 'Number' },
                  { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Special character' },
                ].map(({ ok, label }) => (
                  <li key={label} className={ok ? 'text-emerald-600' : 'text-[rgba(60,60,67,0.4)]'}>
                    {ok ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" size="lg" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="maroon" size="lg" fullWidth loading={changePasswordMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
        <div className={`${form.calloutInfo} mt-4`}>
          <p className="text-sm text-[var(--form-label)]">
            A confirmation SMS will be sent to your phone. You stay signed in on this device.
          </p>
        </div>
    </CustomerLayout>
  );
}
