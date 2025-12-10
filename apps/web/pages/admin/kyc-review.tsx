import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CheckCircle, XCircle, Eye, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';

interface KYCDetail {
  id: string;
  userId: string;
  ghanaCardNumber: string;
  cardFrontUrl: string;
  cardBackUrl: string;
  selfieUrl: string;
  faceMatchScore: number;
  faceMatchPassed: boolean;
  adminApproved: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    kycStatus: string;
    createdAt: string;
  };
}

export default function KYCReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedKYC, setSelectedKYC] = useState<KYCDetail | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: kycData, isLoading } = useQuery<{ kycDetails: KYCDetail[]; total: number }>({
    queryKey: ['kyc-pending'],
    queryFn: async () => {
      const response = await apiClient.get('/kyc/pending');
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes?: string }) => {
      return apiClient.put(`/kyc/approve/${userId}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      toast.success('KYC approved successfully');
      setSelectedKYC(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiClient.put(`/kyc/reject/${userId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-pending'] });
      toast.success('KYC rejected');
      setSelectedKYC(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    },
  });

  const getImageUrl = async (objectName: string): Promise<string> => {
    try {
      const response = await apiClient.get(`/kyc/download/${encodeURIComponent(objectName)}`);
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to get image URL:', error);
      return '';
    }
  };

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="KYC Verification Review"
          subtitle="Review and approve user identity verifications"
          icon={<CreditCard className="w-6 h-6 text-white" />}
          gradient="red"
        />

        {/* Pending Verifications List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Verifications ({kycData?.total || 0})
            </h2>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : kycData?.kycDetails && kycData.kycDetails.length > 0 ? (
              <div className="space-y-4">
                {kycData.kycDetails.map((kyc) => (
                  <div
                    key={kyc.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedKYC(kyc)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {kyc.user.firstName} {kyc.user.lastName}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              kyc.faceMatchScore >= 0.75
                                ? 'bg-green-100 text-green-800'
                                : kyc.faceMatchScore >= 0.6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Match: {(kyc.faceMatchScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{kyc.user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ghana Card: {kyc.ghanaCardNumber} • Submitted: {formatDate(kyc.user.createdAt)}
                        </p>
                      </div>
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-medium">No pending verifications</p>
                <p className="text-sm">All KYC requests have been reviewed</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedKYC && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Review KYC Verification</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedKYC.user.firstName} {selectedKYC.user.lastName} • {selectedKYC.user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedKYC(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Face Match Score */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Face Match Score</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {(selectedKYC.faceMatchScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        selectedKYC.faceMatchPassed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedKYC.faceMatchPassed ? (
                        <span className="font-medium">✓ Passed</span>
                      ) : (
                        <span className="font-medium">✗ Failed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghana Card Front</h3>
                    <ImagePreview objectName={selectedKYC.cardFrontUrl} alt="Ghana Card Front" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Selfie Photo</h3>
                    <ImagePreview objectName={selectedKYC.selfieUrl} alt="Selfie" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Ghana Card Back</h3>
                  <ImagePreview objectName={selectedKYC.cardBackUrl} alt="Ghana Card Back" />
                </div>

                {/* User Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedKYC.user.firstName} {selectedKYC.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedKYC.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedKYC.user.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ghana Card</p>
                      <p className="font-medium text-gray-900">{selectedKYC.ghanaCardNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes (Optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any notes about this verification..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      approveMutation.mutate({
                        userId: selectedKYC.userId,
                        notes: reviewNotes || undefined,
                      });
                    }}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast.error('Please provide a rejection reason');
                        return;
                      }
                      rejectMutation.mutate({
                        userId: selectedKYC.userId,
                        reason: rejectionReason,
                      });
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>

                {/* Rejection Reason Input */}
                {!rejectionReason && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={2}
                      placeholder="Reason for rejection..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Image Preview Component
function ImagePreview({ objectName, alt }: { objectName: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const response = await apiClient.get(`/kyc/download/${encodeURIComponent(objectName)}`);
        setImageUrl(response.data.downloadUrl);
      } catch (error) {
        console.error('Failed to load image:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [objectName]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full border-2 border-gray-200 rounded-lg overflow-hidden">
      <img src={imageUrl} alt={alt} className="w-full h-auto object-contain" />
    </div>
  );
}

