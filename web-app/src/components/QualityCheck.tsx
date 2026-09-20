import { CheckCircle2, AlertTriangle, XCircle, Sun, Sliders, Maximize2, ArrowRight, RotateCcw } from 'lucide-react';
import { QualityReport } from '../inference/qualityChecks';

interface QualityCheckProps {
  report: QualityReport;
  onProceed: () => void;
  onRetake: () => void;
}

export function QualityCheck({
  report,
  onProceed,
  onRetake,
}: QualityCheckProps) {
  const { isAcceptable, score, metrics, issues } = report;

  const getStatusBadge = () => {
    if (isAcceptable) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Optimal Image Quality ({score}/100)</span>
        </div>
      );
    } else if (score >= 60) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>Image Quality Warning ({score}/100)</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
          <XCircle className="w-4 h-4" />
          <span>Sub-Optimal Quality ({score}/100)</span>
        </div>
      );
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
          Image Quality Assessment
        </h3>
        {getStatusBadge()}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {/* Sharpness */}
        <div className="p-2 sm:p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex flex-col items-center text-center">
          <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-clinical-400 mb-1" />
          <span className="text-[10px] sm:text-[11px] text-slate-400">Sharpness</span>
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 mt-0.5 tabular-nums">
            {metrics.laplacianVariance.toFixed(1)}
          </span>
        </div>

        {/* Luminance */}
        <div className="p-2 sm:p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex flex-col items-center text-center">
          <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mb-1" />
          <span className="text-[10px] sm:text-[11px] text-slate-400">Luminance</span>
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 mt-0.5 tabular-nums">
            {metrics.meanLuminance.toFixed(0)} <span className="text-[9px] sm:text-[10px] text-slate-500">/ 255</span>
          </span>
        </div>

        {/* Resolution */}
        <div className="p-2 sm:p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl flex flex-col items-center text-center">
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 mb-1" />
          <span className="text-[10px] sm:text-[11px] text-slate-400">Resolution</span>
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 mt-0.5 tabular-nums">
            {metrics.width}×{metrics.height}
          </span>
        </div>
      </div>

      {/* Issues list if any */}
      {issues.length > 0 ? (
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 sm:gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-amber-300">{issue.message}</p>
                <p className="text-slate-300 text-[11px]">{issue.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 sm:gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-200">
            Sharp anterior-segment focus and balanced lighting verified. Ready for inference.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3 pt-2">
        <button
          onClick={onRetake}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[46px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retake Capture</span>
        </button>

        <button
          onClick={onProceed}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-clinical-600 to-teal-500 hover:from-clinical-500 hover:to-teal-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/30 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[46px]"
        >
          <span>Run Screening Model</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
