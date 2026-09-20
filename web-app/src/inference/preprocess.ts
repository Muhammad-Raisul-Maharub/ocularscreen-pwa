import * as ort from 'onnxruntime-web';
import { CANONICAL_BENCHMARK_CONFIG } from './config';

export interface PreprocessOutput {
  tensor: ort.Tensor;
  preprocessTimeMs: number;
  previewCanvas: HTMLCanvasElement;
  imageData: ImageData;
}

/**
 * Preprocesses an input image (HTMLCanvasElement, HTMLImageElement, or ImageData)
 * into a normalized Float32Array tensor strictly replicating Python torchvision transform:
 * 
 * 1. Dimension: Bilinear resize of source image/frame to 224 x 224 pixels.
 * 2. Channel Format: RGB layout (strip alpha channel from canvas RGBA).
 * 3. Intensity Scaling: Divide pixel values by 255.0 to scale to [0.0, 1.0].
 * 4. Channel Normalization: x_norm[c] = ((x[c] / 255.0) - mu[c]) / sigma[c]
 *      mu = [0.485, 0.456, 0.406], sigma = [0.229, 0.224, 0.225]
 * 5. Planar Array Layout: Contiguous Float32Array of size 3 x 224 x 224 = 150,528
 *      in NCHW planar order (all R pixels, then all G pixels, then all B pixels).
 * 6. Tensor Creation: new ort.Tensor("float32", float32Array, [1, 3, 224, 224]).
 */
export function preprocessImageForInference(
  source: HTMLCanvasElement | HTMLImageElement | ImageData
): PreprocessOutput {
  const t0 = performance.now();
  const targetSize = CANONICAL_BENCHMARK_CONFIG.inputSize; // 224

  // Offscreen canvas for bilinear resizing and cropping
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Failed to create 2D canvas rendering context.');
  }

  // Determine source dimensions
  let srcWidth: number;
  let srcHeight: number;

  if (source instanceof ImageData) {
    srcWidth = source.width;
    srcHeight = source.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = srcWidth;
    tempCanvas.height = srcHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(source, 0, 0);
      drawBilinearCenterCropped(ctx, tempCanvas, srcWidth, srcHeight, targetSize);
    }
  } else {
    srcWidth = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
    srcHeight = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
    drawBilinearCenterCropped(ctx, source, srcWidth, srcHeight, targetSize);
  }

  // Extract raw RGBA pixel bytes (224 x 224)
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const rgba = imgData.data;

  // Planar NCHW layout: [1, 3, 224, 224] -> exactly 150,528 elements
  const planeSize = targetSize * targetSize; // 50,176 elements per channel
  const totalElements = 3 * planeSize; // 150,528
  const float32Array = new Float32Array(totalElements);

  const [meanR, meanG, meanB] = CANONICAL_BENCHMARK_CONFIG.mean;
  const [stdR, stdG, stdB] = CANONICAL_BENCHMARK_CONFIG.std;

  const rOffset = 0;
  const gOffset = planeSize;
  const bOffset = 2 * planeSize;

  for (let i = 0; i < planeSize; i++) {
    const pixelOffset = i * 4;
    // Strip alpha channel; scale intensities to [0.0, 1.0] and normalize
    const rNorm = (rgba[pixelOffset] / 255.0 - meanR) / stdR;
    const gNorm = (rgba[pixelOffset + 1] / 255.0 - meanG) / stdG;
    const bNorm = (rgba[pixelOffset + 2] / 255.0 - meanB) / stdB;

    float32Array[rOffset + i] = rNorm;
    float32Array[gOffset + i] = gNorm;
    float32Array[bOffset + i] = bNorm;
  }

  const tensor = new ort.Tensor('float32', float32Array, [1, 3, targetSize, targetSize]);
  const preprocessTimeMs = performance.now() - t0;

  return {
    tensor,
    preprocessTimeMs,
    previewCanvas: canvas,
    imageData: imgData,
  };
}

/**
 * Bilinear resizing with center square crop to prevent anatomical aspect-ratio drift.
 */
function drawBilinearCenterCropped(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  targetSize: number
): void {
  const minDim = Math.min(srcWidth, srcHeight);
  const sx = (srcWidth - minDim) / 2;
  const sy = (srcHeight - minDim) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high'; // Bilinear/bicubic high-fidelity interpolation
  ctx.drawImage(src, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
}
