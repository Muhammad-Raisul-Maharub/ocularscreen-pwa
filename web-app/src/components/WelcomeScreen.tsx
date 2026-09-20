import { Eye, ShieldCheck, Cpu, Zap, ArrowRight, Gauge, AlertCircle, Sparkles } from 'lucide-react';
import { INFERENCE_CONFIG } from '../inference/config';

interface WelcomeScreenProps {
  onStartScreening: () => void;
  onOpenBenchmark: () => void;
  onOpenRedFlags: () => void;
}

export function WelcomeScreen({
  onStartScreening,
  onOpenBenchmark,
  onOpenRedFlags,
}: WelcomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center">
      {/* Top Research Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-clinical-500/10 border border-clinical-500/30 text-clinical-300 text-xs font-mono mb-6 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-clinical-400" />
        <span>Edge Research Benchmark Prototype</span>
      </div>

      {/* Hero Icon & Title */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-clinical-600 to-teal-400 p-0.5 shadow-xl shadow-clinical-500/20">
          <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center">
            <Eye className="w-10 h-10 text-clinical-400" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-navy-950 rounded-full">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
        OcularScreen <span className="text-clinical-400">PWA</span>
      </h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
        Edge-oriented, privacy-preserving binary conjunctivitis screening instrument executing directly in your browser.
      </p>

      {/* Model Spec Card */}
      <div className="w-full grid grid-cols-3 gap-3 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl mb-8 backdrop-blur-sm">
        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
          <Cpu className="w-5 h-5 text-clinical-400 mb-1" />
          <span className="text-xs text-slate-400 font-medium">Model</span>
          <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5">MobileNetV3</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
          <Zap className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-xs text-slate-400 font-medium">Parameters</span>
          <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5">1.36M (Edge)</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/40">
          <Gauge className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-xs text-slate-400 font-medium">Threshold &tau;*</span>
          <span className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
            {INFERENCE_CONFIG.lockedThreshold.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Core Privacy & Clinical Pillars */}
      <div className="w-full text-left space-y-3 mb-8">
        <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">100% Client-Side Privacy</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Camera feeds and images never leave your device. All inference runs locally in browser RAM using ONNX Runtime Web.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-clinical-500/10 border border-clinical-500/20 text-clinical-400 shrink-0 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Canonical 96.33% Validation Baseline</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Table II Reference: 96.33% Accuracy &bull; 100% Specificity (0 FP) &bull; 94.87% Sensitivity &bull; 1.59 ms ONNX CPU proxy.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Pre-Screening Triage</h3>
              <button 
                onClick={onOpenRedFlags}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Review Red Flags
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Patients with acute severe pain, sudden vision changes, or chemical injuries require immediate emergency eye care.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={onStartScreening}
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-clinical-600 to-teal-500 hover:from-clinical-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-clinical-600/30 transition-all transform active:scale-[0.98]"
        >
          <span>Begin Image Screening</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenBenchmark}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-medium text-sm transition-all active:scale-[0.98]"
        >
          <Gauge className="w-4 h-4 text-clinical-400" />
          <span>In-Browser Benchmark</span>
        </button>
      </div>

      {/* Clinical Disclaimer */}
      <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
        {INFERENCE_CONFIG.messages.disclaimer}
      </p>
    </div>
  );
}
