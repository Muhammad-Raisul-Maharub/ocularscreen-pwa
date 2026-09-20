import { useState } from 'react';
import { Gauge, X, Play, Download, CheckCircle2, RotateCcw, Activity, BookOpen } from 'lucide-react';
import { runBenchmarkSuite, BenchmarkReport } from '../metrics/benchmarkStats';
import { CANONICAL_BENCHMARK_CONFIG } from '../inference/config';
import { exportBenchmarkRunsAsCsv, downloadFile } from '../utils/exportUtils';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BenchmarkModal({ isOpen, onClose }: BenchmarkModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(130);
  const [currentLatency, setCurrentLatency] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'warmup' | 'measure'>('warmup');
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    setReport(null);
    setProgressStep(0);

    try {
      const result = await runBenchmarkSuite((step, total, latency, phase) => {
        setProgressStep(step);
        setTotalSteps(total);
        setCurrentLatency(latency);
        setCurrentPhase(phase);
      });
      setReport(result);
    } catch (err: any) {
      console.error('Benchmark execution error:', err);
      setError(err.message || 'Benchmark suite execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!report) return;
    exportBenchmarkRunsAsCsv(
      report.executionProvider,
      report.latenciesMs,
      {
        median: report.stats.median,
        iqr: report.stats.iqr,
        p95: report.stats.p95,
        mean: report.stats.mean,
      }
    );
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ocularscreen_benchmark_${report.executionProvider}_${timestamp}.json`;
    downloadFile(
      JSON.stringify(report, null, 2),
      filename,
      'application/json;charset=utf-8'
    );
  };

  const progressPercent = totalSteps > 0 ? (progressStep / totalSteps) * 100 : 0;
  const paper = CANONICAL_BENCHMARK_CONFIG.paperBenchmark;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-clinical-500/20 text-clinical-400">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white tracking-tight">
                Target Reference Benchmark (Frozen Baseline)
              </h2>
              <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                Canonical Validation Baseline: 96.33% Acc | 100% Spec | 94.87% Sens | 1.59 ms ONNX CPU Proxy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close Benchmark Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Baseline Comparison Grid (Canonical Manuscript Table II) */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-clinical-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-clinical-300">
                <BookOpen className="w-4 h-4 text-clinical-400" />
                <span>Manuscript Ground Truth (Table II Reference)</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-clinical-500/10 text-clinical-400 border border-clinical-500/20">
                n = 109 Test Split
              </span>
            </div>

            {/* 4 Main Paper Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono tabular-nums">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
                <span className="text-sm font-bold text-white">{(paper.accuracy * 100).toFixed(2)}%</span>
                <span className="text-[9px] text-slate-500 block">105/109 correct</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Specificity</span>
                <span className="text-sm font-bold text-emerald-400">{(paper.specificity * 100).toFixed(1)}%</span>
                <span className="text-[9px] text-slate-500 block">31/31 rejected (0 FP)</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Sensitivity</span>
                <span className="text-sm font-bold text-teal-300">{(paper.sensitivity * 100).toFixed(2)}%</span>
                <span className="text-[9px] text-slate-500 block">74/78 detected (4 FN)</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Baseline CPU</span>
                <span className="text-sm font-bold text-amber-300">{paper.onnxCpuLatencyMs.toFixed(2)} ms</span>
                <span className="text-[9px] text-slate-500 block">628.4 FPS proxy</span>
              </div>
            </div>

            {/* Additional manuscript indices & confusion matrix */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono tabular-nums">
              <span>AUC-ROC: <strong className="text-slate-200">{paper.aucRoc.toFixed(4)}</strong></span>
              <span>AUC-PR: <strong className="text-slate-200">{paper.aucPr.toFixed(4)}</strong></span>
              <span>MCC: <strong className="text-slate-200">{paper.mcc.toFixed(4)}</strong></span>
              <span>Brier: <strong className="text-slate-200">{paper.brierScore.toFixed(4)}</strong></span>
              <span>CM: TN={paper.confusionMatrix.tn}, FP={paper.confusionMatrix.fp}, FN={paper.confusionMatrix.fn}, TP={paper.confusionMatrix.tp}</span>
            </div>
          </div>

          {/* Automated Physical Profiler Live View */}
          {isRunning && (
            <div className="p-4 rounded-xl bg-slate-950 border border-clinical-500/40 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium capitalize flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-clinical-400 animate-spin" />
                  Phase: {currentPhase === 'warmup' ? 'JIT / Cache Warm-up (30 runs)' : 'Timed Measurement (100 runs)'}
                </span>
                <span className="font-mono tabular-nums text-clinical-400 font-semibold">
                  {progressStep} / {totalSteps} ({progressPercent.toFixed(0)}%)
                </span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-clinical-500 to-teal-400 transition-all duration-100 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>Instantaneous: {currentLatency ? `${currentLatency.toFixed(1)} ms` : '--'}</span>
                <span>Active Provider Profiling</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Hardware Benchmark Explanatory Microcopy */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-400 mb-4">
            <span className="font-semibold text-slate-200">ℹ️ How This Hardware Benchmark Works:</span> This benchmark profiles raw physical client-side execution speed on your device's GPU/CPU. It passes standardized synthetic tensors ([1, 3, 224, 224]) directly through the loaded ONNX graph for 30 warm-up runs followed by 100 timed passes. Latency varies naturally across runs due to device scheduling, thermal throttling, and background tasks.
          </div>

          {/* Profiler Output Results */}
          {report && !isRunning && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>In-Browser Execution Profile (30 Warm-up + 100 Recorded Passes)</span>
              </div>

              {/* Physical Profiler Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans">Cold Start (T_cold)</span>
                  <span className="text-base font-bold text-amber-300 mt-1">
                    {report.tColdMs.toFixed(1)} ms
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Initial unprimed pass</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans">Median (T_warm)</span>
                  <span className="text-base font-bold text-clinical-300 mt-1">
                    {report.stats.median.toFixed(1)} ms
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Steady-state latency</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans">IQR (Q3 - Q1)</span>
                  <span className="text-base font-bold text-white mt-1">
                    {report.stats.iqr.toFixed(1)} ms
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Interquartile spread</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans">95th Percentile (P95)</span>
                  <span className="text-base font-bold text-emerald-400 mt-1">
                    {report.stats.p95.toFixed(1)} ms
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Latency bound</span>
                </div>
              </div>

              {/* Diagnostics Summary */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 font-mono tabular-nums text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Active Runtime Provider:</span>
                  <span className="text-white font-semibold uppercase">{report.executionProvider} (Multi-threaded)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Client Mean Latency:</span>
                  <span className="text-slate-200">{report.stats.mean.toFixed(1)} ± {report.stats.stdDev.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Throughput (FPS Proxy):</span>
                  <span className="text-teal-300 font-bold">{report.stats.fpsProxy.toFixed(1)} FPS</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Concurrency / Cores:</span>
                  <span className="text-slate-200">{report.hardwareConcurrency || 'N/A'} active worker threads</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {report && !isRunning && (
              <>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
                  title="Download benchmark CSV matching evaluation reporting schema"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Benchmark CSV</span>
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
                  title="Export JSON report"
                >
                  <Download className="w-4 h-4 text-clinical-400" />
                  <span>Export JSON</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 min-h-[44px] flex items-center justify-center"
            >
              Close
            </button>

            <button
              onClick={handleStartBenchmark}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-clinical-600 hover:bg-clinical-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Measuring 130 Runs...</span>
                </>
              ) : report ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Rerun Test Bench</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch 130-Run Profiler</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
