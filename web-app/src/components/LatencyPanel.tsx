import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Cpu, Zap, Clock, HardDrive } from 'lucide-react';
import { LatencyRecord, latencyTracker } from '../metrics/latencyTracker';
import { ModelLoadTelemetry } from '../inference/session';

interface LatencyPanelProps {
  currentRecord: LatencyRecord | null;
  loadTelemetry: ModelLoadTelemetry | null;
}

export function LatencyPanel({
  currentRecord,
  loadTelemetry,
}: LatencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const summary = latencyTracker.getSummary();
  const history = latencyTracker.getHistory();

  if (!currentRecord && !loadTelemetry) {
    return null;
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl text-xs transition-all">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 sm:px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left gap-2 min-h-[46px]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300 min-w-0">
          <Activity className="w-4 h-4 text-clinical-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white text-xs sm:text-sm truncate">
            <span className="hidden xs:inline">Client </span>Telemetry
          </span>
          {currentRecord && (
            <span className="px-2 py-0.5 rounded-full bg-clinical-500/10 text-clinical-400 font-mono text-[10px] border border-clinical-500/20 whitespace-nowrap shrink-0">
              E2E: {currentRecord.tE2EMs.toFixed(1)} ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 shrink-0">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-mono capitalize border border-slate-700/60">
            {loadTelemetry?.executionProvider || 'WASM'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      {/* Expanded Metrics Details */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 border-t border-slate-800 space-y-3.5 sm:space-y-4 bg-slate-950/40">
          {/* Main 4-metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 sm:p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-clinical-400" />
                Preprocess
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white mt-1 tabular-nums">
                {currentRecord ? `${currentRecord.tPreprocessMs.toFixed(1)} ms` : '--'}
              </span>
              <span className="text-[9px] text-slate-500">224x224 NCHW</span>
            </div>

            <div className="p-2 sm:p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Inference
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white mt-1 tabular-nums">
                {currentRecord ? `${currentRecord.tInferenceMs.toFixed(1)} ms` : '--'}
              </span>
              <span className="text-[9px] text-slate-500">
                {currentRecord?.isColdRun ? 'Cold run' : 'Warm run'}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                Postprocess
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white mt-1 tabular-nums">
                {currentRecord ? `${currentRecord.tPostprocessMs.toFixed(2)} ms` : '--'}
              </span>
              <span className="text-[9px] text-slate-500">Sigmoid + &tau;*</span>
            </div>

            <div className="p-2 sm:p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Total E2E
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white mt-1 tabular-nums">
                {currentRecord ? `${currentRecord.tE2EMs.toFixed(1)} ms` : '--'}
              </span>
              <span className="text-[9px] text-slate-500">User perceived</span>
            </div>
          </div>

          {/* Model Load & Lifecycle Information */}
          {loadTelemetry && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-clinical-400" />
                  Model Binary Size:
                </span>
                <span className="font-mono">
                  {(loadTelemetry.modelSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">T_load (Binary Fetch / Cache):</span>
                <span className="font-mono">{loadTelemetry.loadTimeMs.toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">T_init (Session Graph Compile):</span>
                <span className="font-mono">{loadTelemetry.initTimeMs.toFixed(1)} ms</span>
              </div>
              {summary.avgWarmInferenceMs && (
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Average Warm Latency:</span>
                  <span className="font-mono font-semibold text-clinical-300">
                    {summary.avgWarmInferenceMs.toFixed(2)} ms ({summary.warmRunCount} runs)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mini History Table */}
          {history.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
                <span>Recent Runs</span>
                <span>Inference / E2E</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                {history.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-300"
                  >
                    <span>{rec.timestamp} {rec.isColdRun ? '(cold)' : ''}</span>
                    <span className="text-slate-200">
                      {rec.tInferenceMs.toFixed(1)}ms <span className="text-slate-500">/</span> {rec.tE2EMs.toFixed(1)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
