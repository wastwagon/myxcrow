import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import apiClient from '@/lib/api-client';
import { isAuthenticated } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { CreditCard, Upload, X, CheckCircle, Loader2 } from 'lucide-react';

type KycDetail = {
  id: string;
  userId: string;
  ghanaCardNumber?: string | null;
  cardFrontUrl?: string | null;
  cardBackUrl?: string | null;
  selfieUrl?: string | null;
  faceMatchScore?: number | null;
  faceMatchPassed?: boolean;
  adminApproved?: boolean;
  rejectionReason?: string | null;
  user?: {
    id: string;
    email: string;
    kycStatus: string;
  };
} | null;

export default function KycPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [cardFront, setCardFront] = useState<File | null>(null);
  const [cardBack, setCardBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: kycDetail, isLoading } = useQuery<KycDetail>({
    queryKey: ['kyc-me'],
    queryFn: async () => {
      const res = await apiClient.get('/kyc/me');
      return res.data;
    },
    enabled: isAuthenticated(),
  });

  useEffect(() => {
    if (kycDetail?.ghanaCardNumber) {
      setGhanaCardNumber(kycDetail.ghanaCardNumber);
    }
  }, [kycDetail?.ghanaCardNumber]);

  const canResubmit = useMemo(() => {
    const status = (kycDetail?.user?.kycStatus || '').toUpperCase();
    // If API doesn't include user, fall back to allowing resubmit unless user is known verified elsewhere.
    return status !== 'VERIFIED';
  }, [kycDetail?.user?.kycStatus]);

  const validateImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }
  };

  const resubmitMutation = useMutation({
    mutationFn: async () => {
      if (!ghanaCardNumber.trim()) {
        throw new Error('Ghana Card number is required');
      }
      if (!cardFront || !cardBack || !selfie) {
        throw new Error('Please upload Ghana Card front, back, and selfie photo');
      }
      validateImage(cardFront);
      validateImage(cardBack);
      validateImage(selfie);

      const formData = new FormData();
      formData.append('ghanaCardNumber', ghanaCardNumber.trim());
      formData.append('files', cardFront, 'card-front.jpg');
      formData.append('files', cardBack, 'card-back.jpg');
      formData.append('files', selfie, 'selfie.jpg');

      const res = await apiClient.post('/kyc/resubmit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: async (data: any) => {
      toast.success('KYC submitted successfully');
      setCardFront(null);
      setCardBack(null);
      setSelfie(null);
      await queryClient.invalidateQueries({ queryKey: ['kyc-me'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (data?.faceMatchScore != null) {
        toast.success(`Face match: ${(data.faceMatchScore * 100).toFixed(1)}%`);
      }
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to submit KYC');
    },
  });

  if (!isAuthenticated()) return null;

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="KYC"
          subtitle="Submit or resubmit your Ghana Card and selfie verification"
          icon={<CreditCard className="w-6 h-6 text-white" />}
          gradient="blue"
        />

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {!!kycDetail?.user?.kycStatus && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm text-gray-600">Current status</p>
                    <p className="text-lg font-bold text-gray-900">{kycDetail.user.kycStatus}</p>
                  </div>
                  {kycDetail.user.kycStatus === 'VERIFIED' ? (
                    <div className="flex items-center gap-2 text-green-700 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Verified
                    </div>
                  ) : null}
                </div>
              )}

              {!!kycDetail?.rejectionReason && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-1">Last rejection reason</p>
                  <p className="text-yellow-900 text-sm">{kycDetail.rejectionReason}</p>
                </div>
              )}

              {!canResubmit ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 font-semibold">
                  Your KYC is already verified.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghana Card Number</label>
                    <input
                      value={ghanaCardNumber}
                      onChange={(e) => setGhanaCardNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      placeholder="GHA-123456789-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: GHA-XXXXXXXXX-X</p>
                  </div>

                  <FilePicker label="Ghana Card Front" file={cardFront} onChange={setCardFront} />
                  <FilePicker label="Ghana Card Back" file={cardBack} onChange={setCardBack} />
                  <FilePicker label="Selfie Photo" file={selfie} onChange={setSelfie} />

                  <button
                    onClick={() => resubmitMutation.mutate()}
                    disabled={resubmitMutation.isPending}
                    className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    {resubmitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Submit KYC
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function FilePicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {file ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 rounded-lg hover:bg-white border border-gray-200"
            aria-label={`Remove ${label}`}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Click to upload</p>
          <p className="text-xs text-gray-500">PNG/JPG up to 5MB</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  );
}

