/**
 * Canonical Reference Metadata & Configuration
 * Synchronized with the canonical 96.33% validation benchmark evaluation (Table II Reference).
 * 
 * Strict numerical agreement between:
 * - Research Manuscript Evaluation Protocol
 * - benchmark_master.csv
 * - Client-side ONNX Runtime Web execution
 */

export const CANONICAL_BENCHMARK_CONFIG = {
  // Model Architecture
  modelName: "MobileNetV3-Small",
  backboneLibrary: "torchvision",
  parameterCount: "1.36M", // Exact: 1,355,169 parameters
  featureDim: 576,
  modelFilePath: "/models/mobilenetv3_small.onnx",
  modelFileSizeMB: 5.19, // Exact: 5.187 MB

  // ONNX Graph Tensor I/O Specifications
  inputNodeName: "input",
  outputNodeName: "logit",
  inputShape: [1, 3, 224, 224] as const,
  inputSize: 224,
  channels: 3,
  colorOrder: "RGB",
  tensorLayout: "NCHW", // [Batch, Channels, Height, Width]

  // ImageNet Preprocessing Coefficients
  mean: [0.485, 0.456, 0.406] as const,
  std: [0.229, 0.224, 0.225] as const,

  // Canonical Decision Threshold (Validation-Locked Youden's J)
  // NEVER round this to 0.50 or substitute 0.59!
  TAU_STAR: 0.4970010817050934,

  // Manuscript Ground Truth Performance (Test split n = 109)
  paperBenchmark: {
    accuracy: 0.9633, // 105 / 109 correct
    aucRoc: 0.9913,
    aucPr: 0.9973,
    sensitivity: 0.9487, // 74 / 78 detected (4 false negatives)
    specificity: 1.0000, // 31 / 31 rejected (0 false positives)
    mcc: 0.9167,
    brierScore: 0.0366,
    onnxCpuLatencyMs: 1.59, // Baseline CPU proxy (628.4 FPS)
    confusionMatrix: { tn: 31, fp: 0, fn: 4, tp: 74 },
  },

  // Clinical Referral & Safety Text Directives (Canonical 96.33% Specification)
  messages: {
    positiveTitle: "Conjunctivitis-Compatible Features Detected",
    positiveReferral:
      "Conjunctivitis-compatible features detected. Clinical ophthalmic assessment is recommended.",
    positiveAction:
      "Clinical ophthalmic examination is advised for definitive diagnosis and etiology determination.",
    
    negativeTitle: "No Conjunctivitis-Compatible Features Detected",
    negativeReferral:
      "No conjunctivitis-compatible classification detected.",
    negativeAction:
      "This screening does not exclude other ocular surface conditions or corneal disease. Seek medical consultation if pain, photophobia, or vision changes persist.",

    disclaimer:
      "OcularScreen is an edge-based research screening instrument and does not provide medical diagnosis. Clinical judgment takes precedence in all cases.",
  },

  // Deterministic Image Quality Assurance thresholds
  qualityChecks: {
    minResolution: 224, // minimum dimension in pixels
    minLaplacianVariance: 85, // Laplacian blur variance cutoff for motion blur
    minLuminance: 40, // 0-255 grayscale luminance floor (too dark)
    maxLuminance: 220, // 0-255 grayscale luminance ceiling (overexposed / glare)
  },

  // Automated benchmark protocol
  benchmark: {
    warmupRuns: 30,
    measuredRuns: 100,
  },
} as const;

// Legacy alias for convenience across modules
export const INFERENCE_CONFIG = {
  ...CANONICAL_BENCHMARK_CONFIG,
  modelPath: CANONICAL_BENCHMARK_CONFIG.modelFilePath,
  lockedThreshold: CANONICAL_BENCHMARK_CONFIG.TAU_STAR,
  imageNetMean: CANONICAL_BENCHMARK_CONFIG.mean,
  imageNetStd: CANONICAL_BENCHMARK_CONFIG.std,
} as const;
