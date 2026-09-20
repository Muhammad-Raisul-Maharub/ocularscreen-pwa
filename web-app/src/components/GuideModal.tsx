import { useState } from 'react';
import { BookOpen, X, ChevronDown, ChevronUp, ShieldCheck, Cpu, Lightbulb, AlertTriangle, Layers, Eye } from 'lucide-react';
import { CANONICAL_BENCHMARK_CONFIG } from '../inference/config';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    what: true,
    how: false,
    why: false,
    responsibleAI: false,
  });

  if (!isOpen) return null;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 safe-pb">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-clinical-500/20 text-clinical-400 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
                Clinical Methodology & Technical Guide
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                Academic Translational Research Instrument &bull; MobileNetV3-Small Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center shrink-0 ml-2"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accordions Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-2.5 sm:space-y-3">
          {/* A. What This App Is */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('what')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-clinical-500/10 text-clinical-400">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">A. What This App Is</span>
              </div>
              {openSections.what ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.what && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-300 space-y-2.5 border-t border-slate-800/60">
                <p className="leading-relaxed">
                  <strong className="text-white">OcularScreen</strong> is an edge-oriented, zero-backend Progressive Web App (PWA) developed as an academic translational research instrument under double-blind peer review.
                </p>
                <p className="leading-relaxed">
                  It is engineered to screen for anterior-segment conjunctival inflammation from standard smartphone photographs and provide automated referral guidance tailored for resource-constrained primary care settings where slit-lamp biomicroscopes and specialist ophthalmologists are unavailable.
                </p>
              </div>
            )}
          </div>

          {/* B. How It Works (Step-by-Step Architecture) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('how')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-teal-500/10 text-teal-400">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">B. How It Works (Step-by-Step Architecture)</span>
              </div>
              {openSections.how ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.how && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-300 space-y-3 border-t border-slate-800/60">
                <ol className="space-y-2.5 list-decimal list-inside text-slate-300">
                  <li className="leading-relaxed">
                    <strong className="text-white">Secure Image Acquisition:</strong> Images are captured via the browser's native <code className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">getUserMedia()</code> API targeting the high-resolution environment rear camera, or via local file picker fallback.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Deterministic Quality Audit:</strong> An HTML5 Canvas audit verifies resolution (<span className="font-mono tabular-nums">&ge; 224 &times; 224</span>), discrete 3&times;3 Laplacian variance (<span className="font-mono tabular-nums">&sigma;&sup2; &ge; 85</span>), and mean luminance (<span className="font-mono tabular-nums">40 &le; Y &le; 220</span>) to eliminate ungradable motion blur or flash glare.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Bilinear Normalization Preprocessing:</strong> Inputs are center-cropped and bilinearly scaled to <span className="font-mono tabular-nums">224 &times; 224</span> RGB. Intensities are divided by 255.0 and standardized with torchvision ImageNet coefficients:
                    <div className="my-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                      &mu; = [0.485, 0.456, 0.406], &sigma; = [0.229, 0.224, 0.225]
                    </div>
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">On-Device Inference:</strong> A planar Float32Array (<span className="font-mono tabular-nums">[1, 3, 224, 224]</span>, 150,528 elements) is evaluated directly inside client RAM via <code className="text-clinical-300 font-mono">onnxruntime-web</code> leveraging WebGPU or multi-threaded WASM SIMD without any remote transmission.
                  </li>
                  <li className="leading-relaxed">
                    <strong className="text-white">Validation-Locked Decision Rule:</strong> Output logit <span className="font-mono">z</span> is transformed via stable sigmoid <span className="font-mono">p = 1 / (1 + e&macr;&#769;&#788;)</span> and evaluated against the validation Youden threshold:
                    <div className="my-1.5 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300 font-semibold">
                      &tau;* = {CANONICAL_BENCHMARK_CONFIG.TAU_STAR} (Validation Baseline)
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* C. Why It Works (Research Rationale) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('why')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">C. Why It Works (Research Rationale)</span>
              </div>
              {openSections.why ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.why && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-300 space-y-3 border-t border-slate-800/60">
                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Zero Data Transmission (100% Patient Privacy)
                  </h4>
                  <p className="leading-relaxed text-slate-400">
                    Ocular photographs are processed in volatile memory. No medical images, biometric data, or telemetry logs are ever transmitted over the network or stored in external databases.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-teal-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Offline Independence via Service Workers
                  </h4>
                  <p className="leading-relaxed text-slate-400">
                    Progressive Web App service workers cache the application shell and the 5.19 MB ONNX model using a CacheFirst strategy, enabling full screening capability in peripheral field clinics lacking internet or mobile signal.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Low-Resource Clinical Viability
                  </h4>
                  <p className="leading-relaxed text-slate-400">
                    MobileNetV3-Small features only 1.36M parameters and achieves &lt;50 ms client turnaround, while matching the diagnostic performance of high-capacity vision transformers (86M ViT-B/16) as proven by exact paired McNemar-Holm statistical testing (<span className="font-mono">p_holm = 1.0</span>).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* D. Responsible AI Boundaries & Limitations */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('responsibleAI')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white">D. Responsible AI Boundaries & Limitations</span>
              </div>
              {openSections.responsibleAI ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.responsibleAI && (
              <div className="px-4 pb-4 pt-1 text-xs text-slate-300 space-y-2.5 border-t border-slate-800/60">
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                  <strong className="font-semibold text-red-300">Screening Instrument, Not a Diagnostic Device:</strong> OcularScreen functions as a triaging filter to support referral prioritization. It does not replace physical slit-lamp biomicroscopy or clinical ophthalmic evaluation.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="font-semibold text-slate-200">No Etiological Classification:</strong> The model detects anterior-segment clinical signs of conjunctivitis (hyperemia, vascular engorgement) but does not differentiate viral, bacterial, chlamydial, or allergic etiologies.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="font-semibold text-slate-200">Uncalibrated Focal Loss Score:</strong> Because training used focal loss (&gamma; = 2.0), model outputs reflect decision scores rather than well-calibrated posterior probabilities. Outputs are rendered strictly as <span className="font-mono">"Screening Score: 0.XX"</span>.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="font-semibold text-slate-200">Ethical Oversight:</strong> Ethical oversight approved by Institutional Review Board (Protocol Ref. Redacted for Double-Blind Review).
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Blinded Manuscript Reference Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-clinical-600 hover:bg-clinical-500 text-white rounded-lg text-xs font-semibold shadow transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
