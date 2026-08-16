import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/UIProvider';
import { Button } from '@/components/ui/Button';

interface SelfieCaptureProps {
  onCapture: (file: File) => void;
  onRemove: () => void;
  value?: File | null;
  error?: string;
}

export default function SelfieCapture({ onCapture, onRemove, value, error }: SelfieCaptureProps) {
  const confirm = useConfirm();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch {
      toast.error('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isFromCamera = e.target.hasAttribute('capture');

    if (!isFromCamera) {
      const proceed = await confirm({
        title: 'Use live camera?',
        message:
          'For better security, we recommend taking a live photo with your camera. Uploaded files may not pass verification. Continue with this file?',
        confirmLabel: 'Continue',
        cancelLabel: 'Cancel',
      });
      if (!proceed) {
        e.target.value = '';
        return;
      }
    }

    onCapture(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs from createObjectURL */}
          {previewUrl && (
          <img
            src={previewUrl}
            alt="Selfie preview"
            className="w-full h-48 md:h-64 object-cover rounded-[20px] border-2 border-emerald-500/60 bg-black/20"
          />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3" />
            Photo captured
          </div>
        </div>
      ) : isCapturing ? (
        <div className="relative rounded-[20px] overflow-hidden border-2 border-brand-gold/50 bg-black/40">
          <video ref={videoRef} autoPlay playsInline className="w-full h-48 md:h-64 object-cover" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-2 px-4">
            <Button type="button" variant="filled" size="sm" onClick={capturePhoto}>
              Capture photo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[rgba(60,60,67,0.22)] rounded-[12px] p-6 md:p-8 text-center hover:border-brand-maroon/40 hover:bg-black/[0.03] transition-all group">
          <Camera className="w-12 h-12 md:w-16 md:h-16 mx-auto text-[rgba(60,60,67,0.45)] mb-4 group-hover:text-brand-maroon transition-colors" />
          <p className="text-sm md:text-base font-medium text-gray-900 mb-2">
            Take a clear selfie matching your Ghana Card photo
          </p>
          <p className="text-xs text-[rgba(60,60,67,0.6)] mb-4">
            Ensure good lighting and your face is clearly visible
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button type="button" variant="maroon" onClick={startCamera} className="gap-2">
              <Camera className="w-4 h-4" />
              Use camera
            </Button>
            <label className="inline-flex min-h-[44px] px-4 py-2.5 items-center justify-center gap-2 rounded-[12px] bg-transparent border-2 border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5 font-semibold text-ios-body cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Upload file
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[12px]">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <p className="text-xs text-[rgba(60,60,67,0.6)] mt-2">
        Requirements: clear face, good lighting, similar angle to Ghana Card photo
      </p>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
