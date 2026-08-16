import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListGroup } from '@/components/ui/ListGroup';

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

  const fieldRow =
    'flex items-center min-h-[44px] px-4 gap-3 relative after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[rgba(60,60,67,0.12)] after:left-4 last:after:hidden';
  const fieldInput =
    'flex-1 min-h-[44px] py-2 pr-10 text-[17px] bg-transparent outline-none text-gray-900 placeholder:text-[rgba(60,60,67,0.5)]';
  const eyeBtn =
    'absolute right-1 top-1/2 -translate-y-1/2 text-gray-600 hover:text-brand-maroon min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation';

  if (!isAuthenticated()) return null;

  return (
    <CustomerLayout title="Password" back>
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <ListGroup title="Current">
          <div className={fieldRow}>
            <div className="relative flex-1">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldInput}
                placeholder="Current password"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className={eyeBtn}>
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </ListGroup>

        <ListGroup title="New" footer="At least 8 characters. You stay signed in on this device.">
          <div className={fieldRow}>
            <div className="relative flex-1">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldInput}
                placeholder="New password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={eyeBtn}>
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center min-h-[44px] px-4">
            <div className="relative flex-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldInput}
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={eyeBtn}>
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </ListGroup>

        {newPassword && (
          <ul className="px-4 space-y-1 text-[13px]">
            {[
              { ok: newPassword.length >= 8, label: 'At least 8 characters' },
              { ok: /[A-Z]/.test(newPassword), label: 'Uppercase letter' },
              { ok: /[a-z]/.test(newPassword), label: 'Lowercase letter' },
              { ok: /[0-9]/.test(newPassword), label: 'Number' },
              { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Special character' },
            ].map(({ ok, label }) => (
              <li key={label} className={ok ? 'text-emerald-700' : 'text-[rgba(60,60,67,0.6)]'}>
                {ok ? 'Ready' : 'Needed'} — {label}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" variant="maroon" size="lg" fullWidth loading={changePasswordMutation.isPending}>
          Update password
        </Button>
      </form>
    </CustomerLayout>
  );
}
