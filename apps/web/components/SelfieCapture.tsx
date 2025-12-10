import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface SelfieCaptureProps {
  onCapture: (file: File) => void;
  onRemove: () => void;
  value?: File | null;
  error?: string;
}

export default function SelfieCapture({ onCapture, onRemove, value, error }: SelfieCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

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
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
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

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob/file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onCapture(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <img
            src={URL.createObjectURL(value)}
            alt="Selfie preview"
            className="w-full h-48 md:h-64 object-cover rounded-xl border-2 border-green-500 bg-gray-50"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3" />
            Photo captured
          </div>
        </div>
      ) : isCapturing ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-semibold shadow-lg transition-all"
            >
              Capture Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 md:p-8 text-center hover:border-blue-400 hover:bg-gray-50 transition-all group">
          <Camera className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4 group-hover:text-blue-500 transition-colors" />
          <p className="text-sm md:text-base font-medium text-gray-700 mb-2">
            Take a clear selfie matching your Ghana Card photo
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Ensure good lighting and your face is clearly visible
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={startCamera}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Use Camera
            </button>
            <label className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold cursor-pointer transition-all flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        💡 Requirements: Clear face, good lighting, similar angle to Ghana Card photo
      </p>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

