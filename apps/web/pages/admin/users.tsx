import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin, setAuthTokens, setUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, User, CheckCircle, XCircle, DollarSign, Eye, Edit, Save, X, Users as UsersIcon, AlertCircle, LogIn, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { admin } from '@/components/admin/adminClasses';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles: string[];
  kycStatus: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
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

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.put(`/users/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post('/auth/admin/impersonate', { userId });
      return res.data;
    },
    onSuccess: (data: { user: User; accessToken: string; refreshToken: string }) => {
      setAuthTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success(`Logged in as ${data.user.email}`);
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

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const getRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('ADMIN')) return 'bg-purple-500/20 text-purple-200 border border-purple-500/30';
    if (roles.includes('AUDITOR')) return 'bg-blue-500/20 text-blue-200 border border-blue-500/30';
    if (roles.includes('SUPPORT')) return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30';
    if (roles.includes('SELLER')) return 'bg-amber-500/20 text-amber-200 border border-amber-500/30';
    return 'bg-white/10 text-white/80 border border-white/20';
  };

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['users', searchTerm, roleFilter] });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshUsers} disabled={!isMobile} className="space-y-5">
        <PageHeader
          eyebrow="Admin"
          title="User Management"
          subtitle="View and manage all platform users"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
        />

        <div className={admin.tableWrap}>
          <div className={admin.tableToolbar}>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email, name..."
                  className={`${admin.input} pl-9`}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={admin.select}
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="AUDITOR">Auditor</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={admin.tableHead}>
                <tr>
                  <th className={admin.th}>User</th>
                  <th className={admin.th}>Role</th>
                  <th className={admin.th}>KYC Status</th>
                  <th className={admin.th}>Status</th>
                  <th className={admin.th}>Joined</th>
                  <th className={admin.th}>Actions</th>
                </tr>
              </thead>
              <tbody className={admin.tbody}>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className={`${admin.td} text-center py-12`}>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold" />
                      </div>
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={6} className={`${admin.td} text-center py-12`}>
                      <div className="max-w-md mx-auto">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <p className="font-semibold text-lg text-white mb-2">API Connection Error</p>
                        <p className="text-sm text-white/70 mb-4">
                          {usersError instanceof Error && usersError.message?.includes('Network Error')
                            ? 'Cannot connect to API server. The API may not be running.'
                            : usersError instanceof Error
                            ? usersError.message
                            : 'Failed to connect to API'}
                        </p>
                        <div className={admin.calloutInfo}>
                          <p className="font-semibold mb-2 text-label-primary">To fix this:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Start the API server: <code className="bg-white/10 px-1 rounded">docker-compose up -d</code></li>
                            <li>Or start manually: <code className="bg-white/10 px-1 rounded">cd services/api && npm run start:dev</code></li>
                            <li>Verify API is running: <code className="bg-white/10 px-1 rounded">curl YOUR_API_URL/api/health</code> (use your API base URL)</li>
                            <li>Refresh this page after starting the API</li>
                          </ol>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : usersData?.users && usersData.users.length > 0 ? (
                  usersData.users.map((user) => (
                    <tr key={user.id} className={admin.trHover}>
                      <td className={`${admin.td} whitespace-nowrap`}>
                        <div className="flex items-center gap-3">
                          <AdminAvatar label={user.email} variant="maroon" />
                          <div>
                            <p className="font-medium text-white">{user.email}</p>
                            <p className={`text-sm ${admin.tdMuted}`}>ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${admin.td} whitespace-nowrap`}>
                        {editingUserId === user.id ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {['ADMIN', 'BUYER', 'SELLER', 'AUDITOR', 'SUPPORT'].map((role) => (
                                <label
                                  key={role}
                                  className="flex items-center gap-1 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingRoles.includes(role)}
                                    onChange={() => toggleRole(role)}
                                    className="w-4 h-4 text-brand-gold border-white/20 rounded focus:ring-brand-gold"
                                  />
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor([role])}`}>
                                    {role}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveRoles(user.id)}
                                loading={updateRoleMutation.isPending}
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </Button>
                              <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor([role])}`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditRoles(user)}
                              className={`${admin.rowAction} text-brand-gold hover:bg-brand-gold/15`}
                              title="Edit Roles"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className={`${admin.td} whitespace-nowrap`}>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={user.kycStatus} />
                          {user.kycStatus === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="tinted"
                              onClick={() => approveMutation.mutate(user.id)}
                              loading={approveMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className={`${admin.td} whitespace-nowrap`}>
                        <Button
                          size="sm"
                          variant={user.isActive ? 'tinted' : 'destructive'}
                          onClick={() =>
                            updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })
                          }
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
                      </td>
                      <td className={`${admin.td} ${admin.tdMuted} whitespace-nowrap`}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className={`${admin.td} whitespace-nowrap`}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => impersonateMutation.mutate(user.id)}
                            disabled={impersonateMutation.isPending || user.roles.includes('ADMIN')}
                            className={`${admin.rowAction} text-brand-gold hover:bg-brand-gold/15 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Login as User"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/wallet/credit?userId=${user.id}`}
                            className={`${admin.rowAction} text-emerald-400 hover:bg-emerald-500/15`}
                            title="Credit (Top-up) Wallet"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/wallet/debit?userId=${user.id}`}
                            className={`${admin.rowAction} text-amber-400 hover:bg-amber-500/15`}
                            title="Debit (Deduct) Wallet"
                          >
                            <Minus className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/wallet/admin/${user.id}`}
                            className={`${admin.rowAction} text-brand-gold hover:bg-brand-gold/15`}
                            title="View Wallet"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`${admin.td} text-center py-12 text-white/55`}>
                      <User className="w-12 h-12 mx-auto mb-3 text-white/50" />
                      <p>No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {usersData && (
            <div className={admin.footerBar}>
              <p className="text-sm text-white/70">
                Showing <span className="font-medium">{usersData.users.length}</span> of{' '}
                <span className="font-medium">{usersData.total}</span> users
              </p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </Layout>
  );
}

