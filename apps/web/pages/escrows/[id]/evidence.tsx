import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Upload, File, Download, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/UIProvider';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
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
      window.open(response.data.downloadUrl, '_blank');
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
    <Layout>
      <PullToRefresh onRefresh={refreshEvidence} disabled={!isMobile} className="space-y-6">
        <button
          onClick={() => router.push(`/escrows/${escrowId}`)}
          className="text-brand-gold hover:text-brand-gold/80 font-medium transition-colors"
        >
          ← Back to escrow
        </button>

        <PageHeader
          title="Evidence"
          subtitle="Upload and manage evidence for this escrow"
          icon={<File className="w-6 h-6" />}
        />

        <div className={form.panel}>
          <h2 className="text-ios-headline font-semibold text-label-primary mb-4">Upload evidence</h2>
          <div className="border-2 border-dashed border-white/20 rounded-ios-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-label-tertiary mb-4" />
            <input
              type="file"
              id="file-upload"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx"
            />
            <label htmlFor="file-upload" className="cursor-pointer inline-block">
              <span className="inline-flex items-center px-4 py-2 rounded-ios-lg bg-brand-gold text-brand-maroon-black font-semibold hover:bg-brand-gold/90">
                Select file
              </span>
            </label>
            {selectedFile && (
              <div className="mt-4 space-y-3">
                <p className="text-ios-subhead text-label-secondary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
                <label className="flex items-center justify-center gap-2 text-ios-subhead text-label-secondary">
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                    className="rounded border-white/20 text-brand-gold focus:ring-brand-gold"
                  />
                  Include my location (proof of delivery)
                </label>
                {locationError && <p className="text-ios-caption text-red-400">{locationError}</p>}
                <Button type="button" variant="filled" loading={uploading} onClick={handleUpload}>
                  <Upload className="w-4 h-4" />
                  Upload file
                </Button>
              </div>
            )}
          </div>
          <p className="text-ios-caption text-label-tertiary text-center mt-3">
            Images, PDF, Word — max 10MB
          </p>
        </div>

        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-ios-headline font-semibold text-label-primary">Uploaded evidence</h2>
          </div>
          <div className="p-6">
            {evidenceList.length > 0 ? (
              <div className="space-y-3">
                {evidenceList.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-4 border border-white/10 rounded-ios-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <File className="w-8 h-8 text-brand-gold shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-label-primary truncate">{evidence.fileName}</p>
                        <p className="text-ios-caption text-label-secondary mt-1">
                          {(evidence.fileSize / 1024).toFixed(2)} KB · {evidence.type} ·{' '}
                          {formatDate(evidence.createdAt)}
                        </p>
                        {evidence.description && (
                          <p className="text-ios-caption text-label-tertiary mt-1">{evidence.description}</p>
                        )}
                        {evidence.metadata?.latitude != null && evidence.metadata?.longitude != null && (
                          <p className="text-ios-caption text-label-tertiary mt-1">
                            Location: {evidence.metadata.latitude.toFixed(5)},{' '}
                            {evidence.metadata.longitude.toFixed(5)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(evidence.id)}
                        className="p-2 min-w-[44px] min-h-[44px] text-brand-gold hover:bg-brand-gold/15 rounded-ios-lg touch-manipulation"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete evidence',
                            message: 'Delete this evidence? This cannot be undone.',
                            confirmLabel: 'Delete',
                            destructive: true,
                          });
                          if (ok) deleteMutation.mutate(evidence.id);
                        }}
                        className="p-2 min-w-[44px] min-h-[44px] text-red-400 hover:bg-red-500/10 rounded-ios-lg touch-manipulation"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-label-tertiary">
                <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No evidence uploaded yet</p>
                <p className="text-ios-caption mt-1">Upload files as proof of shipment or delivery</p>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
