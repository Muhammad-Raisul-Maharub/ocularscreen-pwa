import * as ort from 'onnxruntime-web';
import { CANONICAL_BENCHMARK_CONFIG } from './config';

export type ExecutionBackend = 'webgpu' | 'wasm';

export interface ModelLoadTelemetry {
  loadTimeMs: number; // T_load: fetch model arrayBuffer
  initTimeMs: number; // T_init: onnxruntime session creation
  modelSizeBytes: number;
  executionProvider: string;
  backendRequested: ExecutionBackend;
}

export interface InferenceTelemetry {
  rawLogit: number;
  inferenceTimeMs: number;
  isColdRun: boolean;
  provider: string;
}

/**
 * Validates whether the browser hardware and drivers actually support WebGPU.
 */
export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Checks if cross-origin isolation and SharedArrayBuffer are available for WebAssembly multi-threading.
 */
export function isMultiThreadingSupported(): boolean {
  const isIsolated = typeof window !== 'undefined' && Boolean(window.crossOriginIsolated);
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  return isIsolated && hasSharedArrayBuffer;
}

class InferenceSessionManager {
  private sessions = new Map<ExecutionBackend, ort.InferenceSession>();
  private telemetries = new Map<ExecutionBackend, ModelLoadTelemetry>();
  private activeBackend: ExecutionBackend = 'wasm';
  private modelArrayBuffer: ArrayBuffer | null = null;
  private loadTimeMs = 0;
  private coldRunFlags = new Map<ExecutionBackend, boolean>();

  constructor() {
    this.configureOrtEnvironment();
  }

  private configureOrtEnvironment(): void {
    try {
      // Ensure WASM binaries and glue scripts are loaded from /wasm/
      ort.env.wasm.wasmPaths = '/wasm/';

      if (isMultiThreadingSupported()) {
        const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
        ort.env.wasm.numThreads = Math.min(4, Math.max(1, hardwareConcurrency));
        console.log(`[ONNX Web] Multi-threading WASM enabled: threads=${ort.env.wasm.numThreads}`);
      } else {
        // Enforce single-threaded mode to prevent SharedArrayBuffer crashes on non-isolated clients
        ort.env.wasm.numThreads = 1;
        console.log('[ONNX Web] Cross-origin isolation or SharedArrayBuffer unavailable; using single-threaded WASM (threads=1)');
      }
    } catch (err) {
      console.warn('[ONNX Web] Environment configuration warning:', err);
    }
  }

  private async fetchModelBinary(): Promise<ArrayBuffer> {
    if (this.modelArrayBuffer) {
      return this.modelArrayBuffer;
    }
    const t0 = performance.now();
    const response = await fetch(CANONICAL_BENCHMARK_CONFIG.modelFilePath);
    if (!response.ok) {
      throw new Error(`Failed to load ONNX model from ${CANONICAL_BENCHMARK_CONFIG.modelFilePath} (HTTP ${response.status})`);
    }
    this.modelArrayBuffer = await response.arrayBuffer();
    this.loadTimeMs = performance.now() - t0;
    return this.modelArrayBuffer;
  }

  /**
   * Creates or retrieves an InferenceSession for the requested backend.
   * Gracefully routes to WASM without poisoning initWasm if WebGPU is absent.
   */
  public async getInferenceSession(backend: ExecutionBackend): Promise<ort.InferenceSession> {
    if (this.sessions.has(backend)) {
      return this.sessions.get(backend)!;
    }

    const buffer = await this.fetchModelBinary();
    const t0Init = performance.now();

    const webgpuAvailable = await isWebGPUSupported();
    const targetProvider: ExecutionBackend = (backend === 'webgpu' && webgpuAvailable) ? 'webgpu' : 'wasm';

    let session: ort.InferenceSession;
    let actualProvider = targetProvider;

    if (targetProvider === 'webgpu') {
      try {
        session = await ort.InferenceSession.create(buffer, {
          executionProviders: ['webgpu', 'wasm'],
          graphOptimizationLevel: 'all',
          enableCpuMemArena: true,
          enableMemPattern: true,
        });
      } catch (webgpuErr) {
        console.warn('[ONNX Web] WebGPU session creation failed despite adapter check, falling back to WASM:', webgpuErr);
        actualProvider = 'wasm';
        session = await ort.InferenceSession.create(buffer, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
      }
    } else {
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true,
      });
    }

    const initTimeMs = performance.now() - t0Init;
    this.sessions.set(backend, session);
    if (targetProvider !== backend) {
      this.sessions.set(targetProvider, session);
    }

    const telemetry: ModelLoadTelemetry = {
      loadTimeMs: this.loadTimeMs,
      initTimeMs,
      modelSizeBytes: buffer.byteLength,
      executionProvider: actualProvider,
      backendRequested: backend,
    };
    this.telemetries.set(backend, telemetry);
    this.telemetries.set(targetProvider, telemetry);

    console.log(`[ONNX Web] Session initialized for backend "${backend}" (actual: ${actualProvider}) in ${initTimeMs.toFixed(1)} ms.`);
    return session;
  }

  /**
   * Initializes the session for the default or active backend.
   */
  public async initSession(backend?: ExecutionBackend): Promise<ModelLoadTelemetry> {
    const webgpuAvailable = await isWebGPUSupported();
    const selected = backend || (webgpuAvailable ? 'webgpu' : 'wasm');
    this.activeBackend = selected;
    await this.getInferenceSession(selected);
    return this.telemetries.get(selected)!;
  }

  /**
   * Switches the active backend dynamically with graph recompilation/caching.
   */
  public async switchBackend(backend: ExecutionBackend): Promise<ModelLoadTelemetry> {
    const webgpuAvailable = await isWebGPUSupported();
    if (backend === 'webgpu' && !webgpuAvailable) {
      console.warn('[ONNX Web] WebGPU not supported on this browser/device; remaining on WASM.');
      return this.telemetries.get('wasm') || await this.initSession('wasm');
    }
    this.activeBackend = backend;
    await this.getInferenceSession(backend);
    return this.telemetries.get(backend)!;
  }

  public getActiveBackend(): ExecutionBackend {
    return this.activeBackend;
  }

  /**
   * Runs model inference on the current active backend.
   */
  public async runInference(inputTensor: ort.Tensor, backendOverride?: ExecutionBackend): Promise<InferenceTelemetry> {
    const backend = backendOverride || this.activeBackend;
    const session = await this.getInferenceSession(backend);

    const isCold = !this.coldRunFlags.get(backend);
    const inputFeeds: Record<string, ort.Tensor> = {
      [CANONICAL_BENCHMARK_CONFIG.inputNodeName]: inputTensor,
    };

    const t0 = performance.now();
    const results = await session.run(inputFeeds);
    const inferenceTimeMs = performance.now() - t0;

    this.coldRunFlags.set(backend, true);

    const outputTensor = results[CANONICAL_BENCHMARK_CONFIG.outputNodeName];
    if (!outputTensor) {
      throw new Error(`Output node "${CANONICAL_BENCHMARK_CONFIG.outputNodeName}" not found in model outputs.`);
    }

    const outputData = outputTensor.data as Float32Array;
    const rawLogit = outputData[0];
    const telemetry = this.telemetries.get(backend);

    return {
      rawLogit,
      inferenceTimeMs,
      isColdRun: isCold,
      provider: telemetry?.executionProvider || backend,
    };
  }

  public getTelemetry(backend: ExecutionBackend = this.activeBackend): ModelLoadTelemetry | null {
    return this.telemetries.get(backend) || null;
  }

  public isReady(backend: ExecutionBackend = this.activeBackend): boolean {
    return this.sessions.has(backend);
  }
}

export const sessionManager = new InferenceSessionManager();

export async function getInferenceSession(backend: ExecutionBackend) {
  return sessionManager.getInferenceSession(backend);
}
