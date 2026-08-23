import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AdminGate } from '@/components/admin/AdminGate';
import { isAuthenticated, isAdmin, setUser, type User as AuthUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, User, CheckCircle, XCircle, DollarSign, Eye, Edit, Save, X, AlertCircle, LogIn, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConfirm } from '@/components/providers/UIProvider';
import { LightShell } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: usersData, isLoading, error: usersError } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users', searchTerm, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      params.append('limit', '100'); // Increased limit to show more users
      const response = await apiClient.get(`/users?${params.toString()}`);
      // The API returns { users: [], total: number, limit: number, offset: number }
      const data = response.data;
      if (data && typeof data === 'object') {
        // Ensure we have the expected structure
        return {
          users: Array.isArray(data.users) ? data.users : [],
          total: data.total || (Array.isArray(data.users) ? data.users.length : 0),
        };
      }
      // Fallback if response format is unexpected
      return { users: [], total: 0 };
    },
    retry: 2,
  });

  // Handle errors using useEffect (React Query v5 doesn't support onError in useQuery)
  useEffect(() => {
    if (usersError) {
      const error = usersError as any;
      console.error('Failed to fetch users:', error);
      // More detailed error logging
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.error('API Connection Error - Is the API server running on port 4000?');
        toast.error('Cannot connect to API server. Please ensure the API is running on port 4000.');
      } else if (error.response) {
        console.error('API Response Error:', error.response.status, error.response.data);
        toast.error(error.response?.data?.message || `API Error: ${error.response.status}`);
      } else {
        toast.error(error.message || 'Failed to load users. Please check your connection.');
      }
    }
  }, [usersError]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      return apiClient.put(`/users/${userId}/role`, { roles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User roles updated successfully');
      setEditingUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update roles');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiClient.put(`/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${editingUserId ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post('/auth/admin/impersonate', { userId });
      return res.data;
    },
    onSuccess: (data: { user: AuthUser }) => {
      setUser(data.user);
      toast.success(`Viewing as ${data.user.email}`);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to impersonate user');
    },
  });

  const handleEditRoles = (user: User) => {
    setEditingUserId(user.id);
    setEditingRoles([...user.roles]);
  };

  const handleSaveRoles = (userId: string) => {
    updateRoleMutation.mutate({ userId, roles: editingRoles });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingRoles([]);
  };

  const toggleRole = (role: string) => {
    if (editingRoles.includes(role)) {
      setEditingRoles(editingRoles.filter((r) => r !== role));
    } else {
      setEditingRoles([...editingRoles, role]);
    }
  };

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['users', searchTerm, roleFilter] });
  };

  return (
    <AdminGate title="Users">
      <PullToRefresh onRefresh={refreshUsers} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className={dash.subtitle}>
              Search and manage users. Phone numbers are verified automatically at registration via SMS OTP.
            </p>
            <ButtonLink href="/admin" variant="outline" size="sm">
              Back to admin
            </ButtonLink>
          </div>

          <TableShell
            tone="light"
            toolbar={
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  tone="light"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, name..."
                  leading={<Search className="w-4 h-4" />}
                />
                <Select
                  tone="light"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="SUPPORT">Support</option>
                </Select>
              </div>
            }
            footer={
              usersData ? (
                <p>
                  Showing <span className="font-semibold text-gray-900">{usersData.users.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{usersData.total}</span> users
                </p>
              ) : undefined
            }
          >
            <Table>
              <TableHead>
                <tr>
                  <TableTh>User</TableTh>
                  <TableTh>Role</TableTh>
                  <TableTh>Phone</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Joined</TableTh>
                  <TableTh>Actions</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableEmpty colSpan={6}>
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-maroon" />
                    </div>
                  </TableEmpty>
                ) : usersError ? (
                  <TableEmpty colSpan={6}>
                    <div className="max-w-md mx-auto text-left">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                      <p className="font-semibold text-lg text-gray-900 mb-2 text-center">
                        API Connection Error
                      </p>
                      <p className="text-sm text-gray-500 mb-4 text-center">
                        {usersError instanceof Error
                          ? usersError.message
                          : 'Failed to connect to API'}
                      </p>
                    </div>
                  </TableEmpty>
                ) : usersData?.users && usersData.users.length > 0 ? (
                  usersData.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableTd className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <AdminAvatar label={user.email} variant="maroon" />
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableTd>
                      <TableTd className="whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-3">
                              {['ADMIN', 'BUYER', 'SELLER', 'AUDITOR', 'SUPPORT'].map((role) => (
                                <Checkbox
                                  key={role}
                                  tone="light"
                                  checked={editingRoles.includes(role)}
                                  onChange={() => toggleRole(role)}
                                  label={role}
                                />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="maroon"
                                onClick={() => handleSaveRoles(user.id)}
                                loading={updateRoleMutation.isPending}
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <Badge
                                  key={role}
                                  tone="light"
                                  color={
                                    role === 'ADMIN'
                                      ? 'maroon'
                                      : role === 'AUDITOR'
                                      ? 'info'
                                      : role === 'SUPPORT'
                                      ? 'success'
                                      : role === 'SELLER'
                                      ? 'warning'
                                      : 'gray'
                                  }
                                  variant="subtle"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditRoles(user)}
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] text-brand-maroon hover:bg-brand-maroon/10"
                              title="Edit Roles"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </TableTd>
                      <TableTd className="whitespace-nowrap text-sm text-gray-600">
                        {user.phone || '—'}
                      </TableTd>
                      <TableTd className="whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={user.isActive ? 'outline' : 'destructive'}
                          onClick={async () => {
                            if (user.isActive) {
                              const ok = await confirm({
                                title: 'Deactivate user',
                                message: `Deactivate ${user.email}? They will not be able to sign in.`,
                                confirmLabel: 'Deactivate',
                                destructive: true,
                              });
                              if (!ok) return;
                            }
                            updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive });
                          }}
                          loading={updateStatusMutation.isPending}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </TableTd>
                      <TableTd muted className="whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableTd>
                      <TableTd className="whitespace-nowrap">
                        <DropdownMenu
                          tone="light"
                          label={`Actions for ${user.email}`}
                          items={[
                            {
                              id: 'impersonate',
                              label: 'View as user',
                              icon: <LogIn className="w-4 h-4" />,
                              disabled: impersonateMutation.isPending || user.roles.includes('ADMIN'),
                              onClick: async () => {
                                const ok = await confirm({
                                  title: 'View as user',
                                  message: `Open the app as ${user.email}? You can return to admin without signing in again.`,
                                  confirmLabel: 'Continue',
                                });
                                if (ok) impersonateMutation.mutate(user.id);
                              },
                            },
                            {
                              id: 'credit',
                              label: 'Credit wallet',
                              icon: <DollarSign className="w-4 h-4" />,
                              href: `/admin/wallet/credit?userId=${user.id}`,
                            },
                            {
                              id: 'debit',
                              label: 'Debit wallet',
                              icon: <Minus className="w-4 h-4" />,
                              href: `/admin/wallet/debit?userId=${user.id}`,
                            },
                            {
                              id: 'view',
                              label: 'View wallet',
                              icon: <Eye className="w-4 h-4" />,
                              href: `/wallet/admin/${user.id}`,
                            },
                          ]}
                        />
                      </TableTd>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={6}>
                    <EmptyState
                      tone="light"
                      icon={<User className="w-6 h-6" />}
                      title="No users found"
                      description="Try a different search or role filter."
                      className="py-6"
                    />
                  </TableEmpty>
                )}
              </TableBody>
            </Table>
          </TableShell>
        </LightShell>
      </PullToRefresh>
    </AdminGate>
  );
}

