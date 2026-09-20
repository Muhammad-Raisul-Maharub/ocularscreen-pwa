import { INFERENCE_CONFIG } from './config';

export interface QualityIssue {
  type: 'resolution' | 'luminance' | 'blur';
  severity: 'warning' | 'error';
  message: string;
  recommendation: string;
}

export interface QualityReport {
  isAcceptable: boolean;
  score: number; // 0-100 overall quality index
  metrics: {
    width: number;
    height: number;
    meanLuminance: number; // 0 - 255
    laplacianVariance: number; // Higher is sharper
  };
  issues: QualityIssue[];
}

/**
 * Performs deterministic pre-inference image quality checks directly on raw canvas image data.
 * Checks for:
 * 1. Insufficient input resolution
 * 2. Severe underexposure (too dark) or overexposure (specular reflection / glare)
 * 3. Motion blur or out-of-focus capture using Laplacian variance
 */
export function assessImageQuality(imageData: ImageData): QualityReport {
  const { width, height, data } = imageData;
  const issues: QualityIssue[] = [];
  const cfg = INFERENCE_CONFIG.qualityChecks;

  // 1. Resolution Check
  const minDim = Math.min(width, height);
  if (minDim < cfg.minResolution) {
    issues.push({
      type: 'resolution',
      severity: 'warning',
      message: `Image dimension (${width}x${height}) is below ideal resolution (${cfg.minResolution}px).`,
      recommendation: 'Position camera closer to capture anterior-segment ocular structures in full detail.',
    });
  }

  // 2. Grayscale & Luminance extraction
  const totalPixels = width * height;
  const gray = new Float32Array(totalPixels);
  let luminanceSum = 0;

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // ITU-R BT.601 standard luma
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = y;
    luminanceSum += y;
  }

  const meanLuminance = luminanceSum / totalPixels;

  if (meanLuminance < cfg.minLuminance) {
    issues.push({
      type: 'luminance',
      severity: 'warning',
      message: `Lighting is too dim (mean luminance: ${meanLuminance.toFixed(1)} / 255).`,
      recommendation: 'Improve ambient lighting or face a window for clear view of sclera and conjunctiva.',
    });
  } else if (meanLuminance > cfg.maxLuminance) {
    issues.push({
      type: 'luminance',
      severity: 'warning',
      message: `Excessive brightness or specular flash reflection (mean luminance: ${meanLuminance.toFixed(1)} / 255).`,
      recommendation: 'Avoid harsh flashlight directly into the eye to prevent washed-out vascular contrast.',
    });
  }

  // 3. Laplacian Variance for Sharpness / Blur Detection
  // Discrete 3x3 Laplacian kernel:
  // [ 0  1  0 ]
  // [ 1 -4  1 ]
  // [ 0  1  0 ]
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let interiorPixels = 0;

  // Sample interior pixels to compute variance
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const prevRow = rowOffset - width;
    const nextRow = rowOffset + width;

    for (let x = 1; x < width - 1; x++) {
      const center = gray[rowOffset + x];
      const top = gray[prevRow + x];
      const bottom = gray[nextRow + x];
      const left = gray[rowOffset + x - 1];
      const right = gray[rowOffset + x + 1];

      const lap = top + bottom + left + right - 4 * center;
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      interiorPixels++;
    }
  }

  const laplacianMean = laplacianSum / interiorPixels;
  const laplacianVariance = (laplacianSqSum / interiorPixels) - (laplacianMean * laplacianMean);

  if (laplacianVariance < cfg.minLaplacianVariance) {
    issues.push({
      type: 'blur',
      severity: 'warning',
      message: `Image appears blurry or out of focus (sharpness index: ${laplacianVariance.toFixed(1)}).`,
      recommendation: 'Hold phone steady and tap screen on the eye to refocus before capturing.',
    });
  }

  // Compute composite score (0 - 100)
  let qualityScore = 100;
  if (meanLuminance < cfg.minLuminance || meanLuminance > cfg.maxLuminance) {
    qualityScore -= 30;
  }
  if (laplacianVariance < cfg.minLaplacianVariance) {
    qualityScore -= 35;
  }
  if (minDim < cfg.minResolution) {
    qualityScore -= 20;
  }
  qualityScore = Math.max(10, Math.min(100, qualityScore));

  return {
    isAcceptable: issues.length === 0,
    score: qualityScore,
    metrics: {
      width,
      height,
      meanLuminance: Number(meanLuminance.toFixed(1)),
      laplacianVariance: Number(laplacianVariance.toFixed(1)),
    },
    issues,
  };
}
