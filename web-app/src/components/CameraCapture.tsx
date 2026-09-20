import { useRef, useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { Camera, SwitchCamera, Upload, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { CaptureOverlay } from './CaptureOverlay';
import { assessImageQuality, QualityReport } from '../inference/qualityChecks';

interface CameraCaptureProps {
  onCaptureComplete: (canvas: HTMLCanvasElement, quality: QualityReport) => void;
  onOpenRedFlags: () => void;
}

export function CameraCapture({
  onCaptureComplete,
  onOpenRedFlags,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchActive, setTorchActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Initialize and switch camera stream with standardized mobile sensor constraints
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);

      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.()) as any;
      setHasTorch(Boolean(capabilities && 'torch' in capabilities));
    } catch (err: any) {
      console.warn('Camera initialization warning:', err);
      setHasCamera(false);
      setCameraError(err.message || 'Unable to access camera.');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !torchActive;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchActive(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const switchFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleShutterCapture = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const quality = assessImageQuality(imgData);

    setIsCapturing(false);
    onCaptureComplete(canvas, quality);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const quality = assessImageQuality(imgData);
          onCaptureComplete(canvas, quality);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Red flag notice banner */}
      <div className="w-full mb-3 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs min-h-[44px]">
        <span className="text-amber-300 font-medium">Severe pain or sudden vision loss?</span>
        <button
          onClick={onOpenRedFlags}
          className="text-amber-400 hover:text-amber-300 underline font-semibold transition-colors min-h-[44px] flex items-center px-1"
        >
          Check Red Flags
        </button>
      </div>

      {/* Viewport Frame */}
      <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {hasCamera !== false && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        )}

        {hasCamera !== false && <CaptureOverlay isCapturing={isCapturing} />}

        {/* Fallback view if camera unavailable or denied */}
        {hasCamera === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Camera Access Not Available</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                {cameraError || 'Please enable camera access or select an anterior-segment image from your device.'}
              </p>
            </div>
            <button
              onClick={() => startCamera(facingMode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Live Controls Bar (Top Right) with 44px min touch target */}
        {hasCamera && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl backdrop-blur-md transition-all duration-150 active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  torchActive ? 'bg-amber-500 text-black' : 'bg-black/50 text-white hover:bg-black/70'
                }`}
                title="Toggle Torch/Flash"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={switchFacingMode}
              className="p-2.5 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all duration-150 active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Switch Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full mt-4 flex items-center justify-between px-2 gap-4">
        {/* Upload Fallback Button */}
        <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]">
          <Upload className="w-4 h-4 text-clinical-400" />
          <span>Upload Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        {/* Shutter Button */}
        {hasCamera && (
          <button
            onClick={handleShutterCapture}
            className="p-1 rounded-full bg-gradient-to-r from-clinical-500 to-teal-400 shadow-xl shadow-clinical-500/25 transition-all duration-150 active:scale-95 hover:brightness-110 min-w-[56px] min-h-[56px] flex items-center justify-center"
            title="Take Photo"
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-4 border-slate-950">
              <Camera className="w-5 h-5 text-slate-900" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
