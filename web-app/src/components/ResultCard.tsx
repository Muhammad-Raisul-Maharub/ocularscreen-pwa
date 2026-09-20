import { ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2, Download } from 'lucide-react';
import { ScreeningResult } from '../inference/postprocess';
import { LatencyRecord } from '../metrics/latencyTracker';
import { ModelLoadTelemetry } from '../inference/session';
import { exportScreeningJson, buildSanitizedExportPayload } from '../utils/exportUtils';

interface ResultCardProps {
  result: ScreeningResult;
  previewUrl: string;
  latencyRecord?: LatencyRecord | null;
  loadTelemetry?: ModelLoadTelemetry | null;
  onReset: () => void;
}

export function ResultCard({
  result,
  previewUrl,
  latencyRecord,
  loadTelemetry,
  onReset,
}: ResultCardProps) {
  const { isPositive, score, threshold, scoreLabel, title, clinicalReferral, clinicalAction } = result;

  const scorePercent = Math.min(100, Math.max(0, score * 100));
  const thresholdPercent = threshold * 100;

  const handleExportSummary = () => {
    const payload = buildSanitizedExportPayload({
      isPositive,
      score: Number(score.toFixed(4)),
      backend: latencyRecord?.provider || loadTelemetry?.executionProvider || 'wasm',
      tPreprocess: Number((latencyRecord?.tPreprocessMs || 0).toFixed(2)),
      tInference: Number((latencyRecord?.tInferenceMs || 0).toFixed(2)),
      tPostprocess: Number((latencyRecord?.tPostprocessMs || 0).toFixed(2)),
      tE2E: Number((latencyRecord?.tE2EMs || 0).toFixed(2)),
      tInit: Number((loadTelemetry?.initTimeMs || 0).toFixed(2)),
      tLoad: Number((loadTelemetry?.loadTimeMs || 0).toFixed(2)),
    });

    exportScreeningJson(payload);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* Top Banner Status */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between ${
          isPositive
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isPositive ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
              {title}
            </h2>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              Decision Rule: Score {isPositive ? '≥' : '<'} &tau;* ({threshold.toFixed(4)})
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Visual Preview & Score Tile */}
        <div className="flex items-center gap-4 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          {previewUrl && (
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-black">
              <img
                src={previewUrl}
                alt="Analyzed Ocular Crop"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <span className="text-xs text-slate-400 font-medium block">
              Classification Metric
            </span>
            <div className="text-xl font-mono tabular-nums font-extrabold text-white tracking-tight">
              {scoreLabel}
            </div>
            <p className="text-[10px] text-slate-400">
              Uncalibrated focal score &bull; MobileNetV3-Small frozen benchmark.
            </p>
          </div>
        </div>

        {/* Operating Threshold Comparison Slider */}
        <div className="space-y-1.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-400">0.00 (Non-Conjunctivitis)</span>
            <span className="text-amber-400 font-semibold">&tau;* = {threshold.toFixed(4)}</span>
            <span className="text-slate-400">1.00 (Conjunctivitis)</span>
          </div>

          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            {/* Threshold marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${thresholdPercent}%` }}
              title={`Decision threshold: ${threshold.toFixed(4)}`}
            />
            {/* Score progress fill */}
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isPositive ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Score Position: <strong className="text-white font-mono tabular-nums">{score.toFixed(4)}</strong></span>
            <span className={isPositive ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {isPositive ? 'Above Threshold (Positive)' : 'Below Threshold (Negative)'}
            </span>
          </div>
        </div>

        {/* Standardized Referral Language */}
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            isPositive
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-100'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isPositive ? 'Clinical Referral Directive' : 'Observation Directive'}
            </h4>
          </div>

          <p className="text-xs leading-relaxed font-medium">
            {clinicalReferral}
          </p>

          <p className="text-[11px] text-slate-300 leading-normal pt-1 border-t border-white/10">
            {clinicalAction}
          </p>
        </div>

        {/* Action Buttons with 44px min touch target and active scaling */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Screen Another Image</span>
          </button>

          <button
            onClick={handleExportSummary}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-clinical-600 hover:bg-clinical-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-clinical-600/30 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
            title="Download formatted JSON report with date"
          >
            <Download className="w-4 h-4" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>
    </div>
  );
}
