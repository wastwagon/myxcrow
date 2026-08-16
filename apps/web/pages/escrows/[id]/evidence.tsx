import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Upload, File, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/UIProvider';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Banner } from '@/components/ui/Banner';
import { form } from '@/lib/form-classes';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

interface Evidence {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: string;
  description?: string;
  metadata?: { latitude?: number; longitude?: number; capturedAt?: string };
  createdAt: string;
}

export default function EvidencePage() {
  const router = useRouter();
  const { id: escrowId } = router.query;
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const isMobile = useIsMobileNav();
  const [uploading, setUploading] = useState(false);

  const refreshEvidence = async () => {
    await queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const { data: escrow } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}`);
      return response.data;
    },
    enabled: !!escrowId,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !escrowId) return;

    let lat: number | undefined;
    let lng: number | undefined;
    if (includeLocation && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 60000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setLocationError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not get location';
        setLocationError(msg);
        toast.error('Location not available.');
        return;
      }
    }

    try {
      setUploading(true);
      const presignedResponse = await apiClient.post('/evidence/presigned-url', {
        escrowId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      });
      const { uploadUrl, objectName } = presignedResponse.data;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      await apiClient.post('/evidence/verify-upload', {
        escrowId,
        objectName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        type: 'SHIPPING',
        description: `Uploaded evidence: ${selectedFile.name}`,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      toast.success('File uploaded successfully');
      setSelectedFile(null);
      setIncludeLocation(false);
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
    } catch (error: unknown) {
      const raw =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof raw === 'string' ? raw : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (evidenceId: string) => {
    try {
      const response = await apiClient.get(`/evidence/${evidenceId}/download`);
      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to get download URL');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => apiClient.delete(`/evidence/${evidenceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      toast.success('Evidence deleted');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete evidence');
    },
  });

  if (!isAuthenticated()) return null;

  const evidenceList: Evidence[] = escrow?.evidence ?? [];

  return (
    <CustomerLayout title="Evidence" back>
      <PullToRefresh onRefresh={refreshEvidence} disabled={!isMobile} className="space-y-6">
        <div className={form.panel}>
          <h2 className="text-[17px] font-semibold text-gray-900 mb-4">Upload evidence</h2>
          <div id="file-upload" className="border-2 border-dashed border-[rgba(60,60,67,0.18)] rounded-[12px] p-8 text-center scroll-mt-20">
            <Upload className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <input
              type="file"
              id="evidence-file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx"
            />
            <label htmlFor="evidence-file" className="cursor-pointer inline-block">
              <span className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-brand-maroon text-white font-semibold hover:bg-brand-maroon-dark touch-manipulation">
                Select file
              </span>
            </label>
            {selectedFile && (
              <div className="mt-4 space-y-3">
                <p className="text-ios-subhead text-[rgba(60,60,67,0.6)]">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
                <div className="flex justify-center">
                  <Checkbox
                    tone="light"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    label="Include my location (proof of delivery)"
                  />
                </div>
                {locationError && (
                  <Banner light tone="error" className="text-left">
                    {locationError}
                  </Banner>
                )}
                <Button type="button" variant="maroon" loading={uploading} onClick={handleUpload}>
                  <Upload className="w-4 h-4" />
                  Upload file
                </Button>
              </div>
            )}
          </div>
          <p className="text-ios-caption text-gray-500 text-center mt-3">
            Images, PDF, Word — max 10MB
          </p>
        </div>

        <div className="rounded-[12px] bg-white overflow-hidden">
          <div className="p-5 border-b border-[rgba(60,60,67,0.12)]">
            <h2 className="text-[17px] font-semibold text-gray-900">Uploaded evidence</h2>
          </div>
          <div className="p-5">
            {evidenceList.length > 0 ? (
              <div className="space-y-3">
                {evidenceList.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-4 border border-[rgba(60,60,67,0.12)] rounded-[12px]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <File className="w-8 h-8 text-brand-maroon shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{evidence.fileName}</p>
                        <p className="text-ios-caption text-[rgba(60,60,67,0.6)] mt-1">
                          {(evidence.fileSize / 1024).toFixed(2)} KB · {evidence.type} ·{' '}
                          {formatDate(evidence.createdAt)}
                        </p>
                        {evidence.description && (
                          <p className="text-ios-caption text-gray-500 mt-1">{evidence.description}</p>
                        )}
                        {evidence.metadata?.latitude != null && evidence.metadata?.longitude != null && (
                          <p className="text-ios-caption text-gray-500 mt-1">
                            Location: {evidence.metadata.latitude.toFixed(5)},{' '}
                            {evidence.metadata.longitude.toFixed(5)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(evidence.id)}
                        aria-label="Download"
                        className="min-w-[44px] px-2"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="min-w-[44px] px-2"
                        aria-label="Delete"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete evidence',
                            message: 'Delete this evidence? This cannot be undone.',
                            confirmLabel: 'Delete',
                            destructive: true,
                          });
                          if (ok) deleteMutation.mutate(evidence.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<File className="w-6 h-6" />}
                title="No evidence uploaded yet"
                description="Upload files as proof of shipment or delivery"
                tone="light"
                action={{ href: '#file-upload', label: 'Select a file', variant: 'maroon' }}
                className="border-0 bg-transparent"
              />
            )}
          </div>
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
