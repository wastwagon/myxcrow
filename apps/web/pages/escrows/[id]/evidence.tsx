import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Upload, File, Download, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Evidence {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: string;
  description?: string;
  createdAt: string;
}

export default function EvidencePage() {
  const router = useRouter();
  const { id: escrowId } = router.query;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
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

    try {
      setUploading(true);

      // Step 1: Get presigned URL
      const presignedResponse = await apiClient.post('/evidence/presigned-url', {
        escrowId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      });

      const { uploadUrl, objectName } = presignedResponse.data;

      // Step 2: Upload to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Step 3: Verify and create evidence record
      await apiClient.post('/evidence/verify-upload', {
        escrowId,
        objectName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        type: 'SHIPPING',
        description: `Uploaded evidence: ${selectedFile.name}`,
      });

      toast.success('File uploaded successfully');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (evidenceId: string) => {
    try {
      const response = await apiClient.get(`/evidence/${evidenceId}/download`);
      const { downloadUrl } = response.data;
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      toast.error('Failed to get download URL');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      return apiClient.delete(`/evidence/${evidenceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      toast.success('Evidence deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete evidence');
    },
  });

  if (!isAuthenticated()) {
    return null;
  }

  // Mock evidence data - in real app, fetch from API
  const evidenceList: Evidence[] = [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push(`/escrows/${escrowId}`)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Escrow
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Evidence</h1>
          <p className="text-gray-600 mt-1">Upload and manage evidence for this escrow</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Evidence</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <input
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select File
              </label>
              {selectedFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Supported formats: Images, PDF, Word documents. Max size: 10MB
            </p>
          </div>
        </div>

        {/* Evidence List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Evidence</h2>
          </div>
          <div className="p-6">
            {evidenceList.length > 0 ? (
              <div className="space-y-4">
                {evidenceList.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <File className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{evidence.fileName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{(evidence.fileSize / 1024).toFixed(2)} KB</span>
                          <span>•</span>
                          <span>{evidence.type}</span>
                          <span>•</span>
                          <span>{formatDate(evidence.createdAt)}</span>
                        </div>
                        {evidence.description && (
                          <p className="text-sm text-gray-500 mt-1">{evidence.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(evidence.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this evidence?')) {
                            deleteMutation.mutate(evidence.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <File className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No evidence uploaded yet</p>
                <p className="text-sm mt-1">Upload files to provide proof of shipment or delivery</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}




