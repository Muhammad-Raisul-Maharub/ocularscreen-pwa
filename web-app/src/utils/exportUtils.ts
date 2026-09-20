export interface ScreeningState {
  isPositive: boolean;
  score: number;
  backend: string;
  tPreprocess: number;
  tInference: number;
  tPostprocess: number;
  tE2E: number;
  tInit: number;
  tLoad: number;
}

export interface ScreeningExportPayload {
  instrumentName: string;
  version: string;
  timestamp: string;
  screeningEvaluation: {
    finding: string;
    screeningScore: number;
    validationLockedThreshold: number;
    scoreInterpretation: string;
  };
  inferenceTelemetry: {
    executionProvider: string;
    preprocessDurationMs: number;
    inferenceDurationMs: number;
    postprocessDurationMs: number;
    endToEndUserPerceivedMs: number;
    modelBinarySizeBytes: number;
    modelBinarySizeMb: number;
    sessionInitDurationMs: number;
    binaryCacheFetchDurationMs: number;
  };
  clientRuntimeEnvironment: {
    hardwareConcurrency: number | string;
    userAgent: string;
    screenResolution: string;
  };
  disclaimer: string;
}

export function buildSanitizedExportPayload(state: ScreeningState): ScreeningExportPayload {
  return {
    instrumentName: "OcularScreen Research Prototype",
    version: "1.0.0-research",
    timestamp: new Date().toISOString(),
    screeningEvaluation: {
      finding: state.isPositive 
        ? "CONJUNCTIVITIS_COMPATIBLE_FEATURES_DETECTED" 
        : "NO_CONJUNCTIVITIS_COMPATIBLE_CLASSIFICATION_DETECTED",
      screeningScore: state.score,
      validationLockedThreshold: 0.4970010817050934,
      scoreInterpretation: "Uncalibrated focal loss score from frozen MobileNetV3-Small backbone. Not an empirical clinical probability."
    },
    inferenceTelemetry: {
      executionProvider: state.backend,
      preprocessDurationMs: state.tPreprocess,
      inferenceDurationMs: state.tInference,
      postprocessDurationMs: state.tPostprocess,
      endToEndUserPerceivedMs: state.tE2E,
      modelBinarySizeBytes: 5440000,
      modelBinarySizeMb: 5.19,
      sessionInitDurationMs: state.tInit,
      binaryCacheFetchDurationMs: state.tLoad
    },
    clientRuntimeEnvironment: {
      hardwareConcurrency: (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || "redacted",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "redacted",
      screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "redacted"
    },
    disclaimer: "Academic research instrument under peer review. Not a definitive medical diagnosis. Does not substitute for clinical ophthalmic biomicroscopy."
  };
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename; // Forces browser to save as .json or .csv
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function exportScreeningJson(payload: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadFile(
    JSON.stringify(payload, null, 2),
    `ocularscreen_report_${timestamp}.json`,
    "application/json;charset=utf-8"
  );
}

export function exportBenchmarkCsv(csvText: string, backend: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadFile(
    csvText,
    `ocularscreen_benchmark_${backend}_${timestamp}.csv`,
    "text/csv;charset=utf-8"
  );
}

export function exportScreeningSummaryAsJson(payload: any) {
  exportScreeningJson(payload);
}

export function exportBenchmarkRunsAsCsv(
  backend: string,
  measurements: number[],
  stats: { median: number; iqr: number; p95: number; mean: number }
) {
  let csvContent = "run_index,inference_latency_ms\n";
  measurements.forEach((lat, idx) => {
    csvContent += `${idx + 1},${lat.toFixed(3)}\n`;
  });
  csvContent += `\n# SUMMARY STATISTICS (${backend.toUpperCase()})\n`;
  csvContent += `# Measured Runs,${measurements.length}\n`;
  csvContent += `# Mean Latency (ms),${stats.mean.toFixed(2)}\n`;
  csvContent += `# Median Latency (ms),${stats.median.toFixed(2)}\n`;
  csvContent += `# IQR (ms),${stats.iqr.toFixed(2)}\n`;
  csvContent += `# P95 Latency (ms),${stats.p95.toFixed(2)}\n`;

  exportBenchmarkCsv(csvContent, backend);
}
