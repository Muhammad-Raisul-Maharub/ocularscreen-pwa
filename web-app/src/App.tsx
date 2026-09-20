import { useState, useEffect } from 'react';
import { Eye, ShieldAlert, Gauge, Sparkles, Loader2, BookOpen, Zap, Cpu } from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RedFlagModal } from './components/RedFlagModal';
import { CameraCapture } from './components/CameraCapture';
import { QualityCheck } from './components/QualityCheck';
import { ResultCard } from './components/ResultCard';
import { LatencyPanel } from './components/LatencyPanel';
import { BenchmarkModal } from './components/BenchmarkModal';
import { GuideModal } from './components/GuideModal';

import { sessionManager, ModelLoadTelemetry, ExecutionBackend } from './inference/session';
import { preprocessImageForInference } from './inference/preprocess';
import { evaluatePrediction, ScreeningResult } from './inference/postprocess';
import { QualityReport } from './inference/qualityChecks';
import { latencyTracker, LatencyRecord } from './metrics/latencyTracker';

type AppStep = 'welcome' | 'capture' | 'quality' | 'inferring' | 'result';

export function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [isRedFlagModalOpen, setIsRedFlagModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Model session telemetry & dual runtime backend toggling
  const [activeBackend, setActiveBackend] = useState<ExecutionBackend>('webgpu');
  const [isSwitchingBackend, setIsSwitchingBackend] = useState(false);
  const [loadTelemetry, setLoadTelemetry] = useState<ModelLoadTelemetry | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Active screening pipeline state
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [currentLatency, setCurrentLatency] = useState<LatencyRecord | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // Proactively warm up model on mount in background
  useEffect(() => {
    let isMounted = true;
    const warmup = async () => {
      try {
        setIsModelLoading(true);
        const telemetry = await sessionManager.initSession();
        if (isMounted) {
          setLoadTelemetry(telemetry);
          setActiveBackend(telemetry.backendRequested);
        }
      } catch (err) {
        console.warn('Background model warmup warning:', err);
      } finally {
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    };
    warmup();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic dual-backend switching handler
  const handleBackendToggle = async (newBackend: ExecutionBackend) => {
    if (newBackend === activeBackend || isSwitchingBackend) return;
    try {
      setIsSwitchingBackend(true);
      const telemetry = await sessionManager.switchBackend(newBackend);
      setLoadTelemetry(telemetry);
      setActiveBackend(telemetry.backendRequested);
    } catch (err: any) {
      console.error('Failed to switch runtime backend:', err);
    } finally {
      setIsSwitchingBackend(false);
    }
  };

  // Handle capture completed
  const handleCaptureComplete = (canvas: HTMLCanvasElement, quality: QualityReport) => {
    setCapturedCanvas(canvas);
    setQualityReport(quality);
    setCurrentStep('quality');
  };

  // Run full inference pipeline
  const handleRunInference = async () => {
    if (!capturedCanvas) return;

    setCurrentStep('inferring');
    setInferenceError(null);

    try {
      const t0E2E = performance.now();

      // 1. Preprocessing (Center crop + Float32Array NCHW ImageNet normalize)
      const prep = preprocessImageForInference(capturedCanvas);
      setPreviewUrl(prep.previewCanvas.toDataURL('image/jpeg', 0.92));

      // 2. Inference via ONNX Runtime Web
      const inf = await sessionManager.runInference(prep.tensor);

      // 3. Postprocess (Sigmoid + exact threshold tau* check)
      const t0Post = performance.now();
      const result = evaluatePrediction(inf.rawLogit);
      const tPostprocessMs = performance.now() - t0Post;

      const tE2EMs = performance.now() - t0E2E;

      // 4. Record latency metrics
      const latencyRec = latencyTracker.recordRun({
        tLoadMs: loadTelemetry?.loadTimeMs,
        tInitMs: loadTelemetry?.initTimeMs,
        tPreprocessMs: prep.preprocessTimeMs,
        tInferenceMs: inf.inferenceTimeMs,
        tPostprocessMs,
        tE2EMs,
        isColdRun: inf.isColdRun,
        provider: inf.provider,
      });

      setScreeningResult(result);
      setCurrentLatency(latencyRec);
      setCurrentStep('result');
    } catch (err: any) {
      console.error('Inference execution failure:', err);
      setInferenceError(err.message || 'Error executing on-device neural network.');
      setCurrentStep('quality');
    }
  };

  // Reset screening pipeline
  const handleResetScreening = () => {
    setCapturedCanvas(null);
    setQualityReport(null);
    setPreviewUrl(null);
    setScreeningResult(null);
    setInferenceError(null);
    setCurrentStep('capture');
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-0 sm:h-16 flex flex-wrap items-center justify-between gap-2">
          {/* Brand */}
          <button
            onClick={() => setCurrentStep('welcome')}
            className="flex items-center gap-2 text-left group min-h-[44px]"
            title="Go to Welcome Screen"
          >
            <div className="w-8 h-8 rounded-lg bg-clinical-600 flex items-center justify-center text-white shadow-md shadow-clinical-600/30 group-hover:bg-clinical-500 transition-all duration-150 active:scale-[0.98]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                OcularScreen
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-clinical-500/20 text-clinical-300 font-normal border border-clinical-500/30">
                  v1.0
                </span>
              </span>
            </div>
          </button>

          {/* Interactive Dual-Backend Toggle (WebGPU <-> WASM CPU) */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
              <button
                onClick={() => handleBackendToggle('webgpu')}
                disabled={isSwitchingBackend}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all duration-150 active:scale-[0.98] min-h-[38px] ${
                  activeBackend === 'webgpu'
                    ? 'bg-gradient-to-r from-clinical-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Execute via WebGPU hardware acceleration"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>WebGPU</span>
              </button>
              <button
                onClick={() => handleBackendToggle('wasm')}
                disabled={isSwitchingBackend}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all duration-150 active:scale-[0.98] min-h-[38px] ${
                  activeBackend === 'wasm'
                    ? 'bg-gradient-to-r from-clinical-600 to-teal-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Execute via multi-threaded WASM CPU"
              >
                <Cpu className="w-3.5 h-3.5 text-sky-300" />
                <span>WASM CPU</span>
              </button>
            </div>

            {(isSwitchingBackend || isModelLoading) && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isSwitchingBackend ? 'Switching backend...' : 'Warming model...'}</span>
              </div>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
              title="Clinical Methodology & Technical Guide"
            >
              <BookOpen className="w-4 h-4 text-clinical-400" />
              <span className="hidden md:inline">Guide & Methodology</span>
            </button>

            <button
              onClick={() => setIsRedFlagModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
              title="Clinical Red Flag Symptoms"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Red Flags</span>
            </button>

            <button
              onClick={() => setIsBenchmarkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
              title="Inference Benchmark & Profiler"
            >
              <Gauge className="w-4 h-4 text-clinical-400" />
              <span className="hidden sm:inline">Benchmark</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-center">
        {/* Error Alert if any */}
        {inferenceError && (
          <div className="mb-4 max-w-lg mx-auto w-full p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between">
            <span>{inferenceError}</span>
            <button
              onClick={() => setInferenceError(null)}
              className="text-red-400 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Welcome Screen */}
        {currentStep === 'welcome' && (
          <WelcomeScreen
            onStartScreening={() => setCurrentStep('capture')}
            onOpenBenchmark={() => setIsBenchmarkModalOpen(true)}
            onOpenRedFlags={() => setIsRedFlagModalOpen(true)}
          />
        )}

        {/* 2. Camera / Image Capture */}
        {currentStep === 'capture' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Capture Anterior-Segment Image
              </h2>
              <p className="text-xs text-slate-400">
                Center the eye inside the target frame with clear focus on the sclera.
              </p>
            </div>

            <CameraCapture
              onCaptureComplete={handleCaptureComplete}
              onOpenRedFlags={() => setIsRedFlagModalOpen(true)}
            />
          </div>
        )}

        {/* 3. Image Quality Inspection */}
        {currentStep === 'quality' && qualityReport && (
          <div className="max-w-lg mx-auto w-full space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Quality Gate Inspection
              </h2>
              <p className="text-xs text-slate-400">
                Automated deterministic check for sharpness, illumination, and minimum resolution.
              </p>
            </div>

            {capturedCanvas && (
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-black relative shadow-lg">
                <img
                  src={capturedCanvas.toDataURL()}
                  alt="Candidate Ocular Capture"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <QualityCheck
              report={qualityReport}
              onProceed={handleRunInference}
              onRetake={handleResetScreening}
            />
          </div>
        )}

        {/* 4. Inferring Animated State */}
        {currentStep === 'inferring' && (
          <div className="max-w-md mx-auto w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-clinical-400 animate-spin" />
              <Eye className="w-6 h-6 text-clinical-400 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Running On-Device Inference</h3>
              <p className="text-xs text-slate-400">
                Evaluating anterior-segment features with MobileNetV3-Small...
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-clinical-400" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        )}

        {/* 5. Results & Latency Display */}
        {currentStep === 'result' && screeningResult && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <ResultCard
              result={screeningResult}
              previewUrl={previewUrl || ''}
              latencyRecord={currentLatency}
              loadTelemetry={loadTelemetry}
              onReset={handleResetScreening}
            />

            <LatencyPanel
              currentRecord={currentLatency}
              loadTelemetry={loadTelemetry}
            />
          </div>
        )}
      </main>

      {/* Footer Note */}
      <footer className="py-4 text-center text-xs text-slate-500 font-medium">
        OcularScreen Research Benchmark Prototype &bull; MobileNetV3-Small &bull; 100% Client-Side Privacy
      </footer>

      {/* Modals */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <RedFlagModal
        isOpen={isRedFlagModalOpen}
        onClose={() => setIsRedFlagModalOpen(false)}
      />

      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </div>
  );
}
