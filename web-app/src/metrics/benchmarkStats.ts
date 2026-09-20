import * as ort from 'onnxruntime-web';
import { sessionManager } from '../inference/session';
import { CANONICAL_BENCHMARK_CONFIG } from '../inference/config';

export interface BenchmarkReport {
  timestamp: string;
  userAgent: string;
  hardwareConcurrency: number;
  deviceMemoryGb?: number;
  executionProvider: string;
  modelName: string;
  paperReference: {
    accuracy: number;
    specificity: number;
    sensitivity: number;
    aucRoc: number;
    aucPr: number;
    mcc: number;
    brierScore: number;
    baselineCpuLatencyMs: number;
    confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
  };
  iterations: number;
  warmupIterations: number;
  tLoadMs?: number;
  tInitMs?: number;
  tColdMs: number;
  latenciesMs: number[];
  stats: {
    mean: number;
    median: number;
    stdDev: number;
    iqr: number;
    q1: number;
    q3: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    fpsProxy: number;
  };
}

/**
 * Creates a synthetic dummy input tensor with random floats matching ImageNet normalized distribution
 */
export function createSyntheticInputTensor(): ort.Tensor {
  const size = CANONICAL_BENCHMARK_CONFIG.inputSize;
  const numElements = 3 * size * size;
  const data = new Float32Array(numElements);
  for (let i = 0; i < numElements; i++) {
    data[i] = (Math.random() - 0.5) * 2;
  }
  return new ort.Tensor('float32', data, [1, 3, size, size]);
}

/**
 * Executes an automated in-browser benchmarking protocol adhering strictly
 * to the research manuscript's evaluation methodology:
 * 30 warm-up iterations + 100 measured iterations.
 */
export async function runBenchmarkSuite(
  onProgress?: (step: number, total: number, currentLatencyMs: number, phase: 'warmup' | 'measure') => void,
  customTensor?: ort.Tensor
): Promise<BenchmarkReport> {
  // Ensure session is initialized
  const loadTelemetry = await sessionManager.initSession();
  const inputTensor = customTensor || createSyntheticInputTensor();

  const warmupCount = CANONICAL_BENCHMARK_CONFIG.benchmark.warmupRuns; // 30
  const measuredCount = CANONICAL_BENCHMARK_CONFIG.benchmark.measuredRuns; // 100
  const totalRuns = warmupCount + measuredCount;

  // 1. Initial / Cold run
  const coldStart = performance.now();
  const coldResult = await sessionManager.runInference(inputTensor);
  const tColdMs = coldResult.inferenceTimeMs || (performance.now() - coldStart);

  // 2. Warm-up Phase (30 runs)
  for (let i = 0; i < warmupCount; i++) {
    const res = await sessionManager.runInference(inputTensor);
    if (onProgress) {
      onProgress(i + 1, totalRuns, res.inferenceTimeMs, 'warmup');
    }
    await new Promise((r) => setTimeout(r, 6));
  }

  // 3. Measurement Phase (100 runs)
  const latencies: number[] = [];
  for (let i = 0; i < measuredCount; i++) {
    const res = await sessionManager.runInference(inputTensor);
    latencies.push(res.inferenceTimeMs);
    if (onProgress) {
      onProgress(warmupCount + i + 1, totalRuns, res.inferenceTimeMs, 'measure');
    }
    await new Promise((r) => setTimeout(r, 6));
  }

  // 4. Compute Statistical Summary
  latencies.sort((a, b) => a - b);
  const n = latencies.length;
  const sum = latencies.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median = n % 2 === 0 ? (latencies[n / 2 - 1] + latencies[n / 2]) / 2 : latencies[Math.floor(n / 2)];
  const q1 = latencies[Math.floor(n * 0.25)];
  const q3 = latencies[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const p95 = latencies[Math.floor(n * 0.95)];
  const p99 = latencies[Math.floor(n * 0.99)];
  const min = latencies[0];
  const max = latencies[n - 1];

  const variance = latencies.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const fpsProxy = median > 0 ? 1000 / median : 0;

  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const paper = CANONICAL_BENCHMARK_CONFIG.paperBenchmark;

  return {
    timestamp: new Date().toISOString(),
    userAgent: nav ? nav.userAgent : 'Unknown',
    hardwareConcurrency: nav ? nav.hardwareConcurrency || 0 : 0,
    deviceMemoryGb: (nav as any)?.deviceMemory,
    executionProvider: loadTelemetry.executionProvider,
    modelName: CANONICAL_BENCHMARK_CONFIG.modelName,
    paperReference: {
      accuracy: paper.accuracy,
      specificity: paper.specificity,
      sensitivity: paper.sensitivity,
      aucRoc: paper.aucRoc,
      aucPr: paper.aucPr,
      mcc: paper.mcc,
      brierScore: paper.brierScore,
      baselineCpuLatencyMs: paper.onnxCpuLatencyMs,
      confusionMatrix: paper.confusionMatrix,
    },
    iterations: measuredCount,
    warmupIterations: warmupCount,
    tLoadMs: loadTelemetry.loadTimeMs,
    tInitMs: loadTelemetry.initTimeMs,
    tColdMs,
    latenciesMs: latencies,
    stats: {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      iqr: Number(iqr.toFixed(2)),
      q1: Number(q1.toFixed(2)),
      q3: Number(q3.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      fpsProxy: Number(fpsProxy.toFixed(1)),
    },
  };
}

/**
 * Formats benchmark report as CSV matching the manuscript's reporting schema
 */
export function formatReportAsCSV(report: BenchmarkReport): string {
  const headers = [
    'model',
    'provider',
    'concurrency',
    'warmup_runs',
    'measured_runs',
    'paper_accuracy',
    'paper_specificity',
    'paper_sensitivity',
    'paper_baseline_cpu_ms',
    'client_t_load_ms',
    'client_t_init_ms',
    'client_t_cold_ms',
    'client_median_ms',
    'client_mean_ms',
    'client_std_dev_ms',
    'client_iqr_ms',
    'client_p95_ms',
    'client_min_ms',
    'client_max_ms',
    'client_fps_proxy',
    'timestamp',
  ].join(',');

  const values = [
    `"${report.modelName}"`,
    report.executionProvider,
    report.hardwareConcurrency,
    report.warmupIterations,
    report.iterations,
    (report.paperReference.accuracy * 100).toFixed(2) + '%',
    (report.paperReference.specificity * 100).toFixed(2) + '%',
    (report.paperReference.sensitivity * 100).toFixed(2) + '%',
    report.paperReference.baselineCpuLatencyMs.toFixed(2),
    report.tLoadMs?.toFixed(2) || 'N/A',
    report.tInitMs?.toFixed(2) || 'N/A',
    report.tColdMs.toFixed(2),
    report.stats.median.toFixed(2),
    report.stats.mean.toFixed(2),
    report.stats.stdDev.toFixed(2),
    report.stats.iqr.toFixed(2),
    report.stats.p95.toFixed(2),
    report.stats.min.toFixed(2),
    report.stats.max.toFixed(2),
    report.stats.fpsProxy.toFixed(1),
    `"${report.timestamp}"`,
  ].join(',');

  return `${headers}\n${values}\n`;
}
