import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Search, User, Mail, Shield, CheckCircle, XCircle, DollarSign, Eye, Edit, Save, X, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';

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
    onError: (error: any) => {
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
    },
  });

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
    if (roles.includes('ADMIN')) return 'bg-purple-100 text-purple-800';
    if (roles.includes('AUDITOR')) return 'bg-blue-100 text-blue-800';
    if (roles.includes('SUPPORT')) return 'bg-green-100 text-green-800';
    if (roles.includes('SELLER')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          subtitle="View and manage all platform users"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          gradient="purple"
        />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email, name..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="max-w-md mx-auto">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <p className="font-semibold text-lg text-gray-900 mb-2">API Connection Error</p>
                        <p className="text-sm text-gray-600 mb-4">
                          {usersError instanceof Error && usersError.message?.includes('Network Error')
                            ? 'Cannot connect to API server. The API may not be running.'
                            : usersError instanceof Error
                            ? usersError.message
                            : 'Failed to connect to API'}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm text-gray-700">
                          <p className="font-semibold mb-2">To fix this:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Start the API server: <code className="bg-gray-100 px-1 rounded">docker-compose up -d</code></li>
                            <li>Or start manually: <code className="bg-gray-100 px-1 rounded">cd services/api && npm run start:dev</code></li>
                            <li>Verify API is running: <code className="bg-gray-100 px-1 rounded">curl http://localhost:4000/api/health</code></li>
                            <li>Refresh this page after starting the API</li>
                          </ol>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : usersData?.users && usersData.users.length > 0 ? (
                  usersData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor([role])}`}>
                                    {role}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveRoles(user.id)}
                                disabled={updateRoleMutation.isPending}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
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
                              onClick={() => handleEditRoles(user)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Roles"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            user.kycStatus === 'VERIFIED'
                              ? 'bg-green-100 text-green-800'
                              : user.kycStatus === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ userId: user.id, isActive: !user.isActive })
                          }
                          disabled={updateStatusMutation.isPending}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            user.isActive
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
                          } disabled:opacity-50`}
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
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/wallet/credit?userId=${user.id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Credit Wallet"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/wallet/admin/${user.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {usersData && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{usersData.users.length}</span> of{' '}
                <span className="font-medium">{usersData.total}</span> users
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

