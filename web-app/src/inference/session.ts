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

class InferenceSessionManager {
  private sessions = new Map<ExecutionBackend, ort.InferenceSession>();
  private telemetries = new Map<ExecutionBackend, ModelLoadTelemetry>();
  private activeBackend: ExecutionBackend = 'webgpu';
  private modelArrayBuffer: ArrayBuffer | null = null;
  private loadTimeMs = 0;
  private coldRunFlags = new Map<ExecutionBackend, boolean>();

  constructor() {
    this.configureOrtEnvironment();
  }

  private configureOrtEnvironment(): void {
    try {
      ort.env.wasm.wasmPaths = '/wasm/';
      const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 2 : 2;
      ort.env.wasm.numThreads = Math.min(4, Math.max(1, hardwareConcurrency));
      ort.env.wasm.simd = true;
      console.log(`[ONNX Web] Multi-threading WASM configured: threads=${ort.env.wasm.numThreads}, SIMD=${ort.env.wasm.simd}`);
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
   * Gracefully falls back to WASM if WebGPU is unavailable or fails.
   */
  public async getInferenceSession(backend: ExecutionBackend): Promise<ort.InferenceSession> {
    if (this.sessions.has(backend)) {
      return this.sessions.get(backend)!;
    }

    const buffer = await this.fetchModelBinary();
    const t0Init = performance.now();

    const eps: ort.InferenceSession.ExecutionProviderConfig[] =
      backend === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];

    let session: ort.InferenceSession;
    let actualProvider = backend;

    try {
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: eps,
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        enableMemPattern: true,
      });
    } catch (err) {
      console.warn(`[ONNX Web] Backend ${backend} initialization failed, falling back to pure WASM CPU:`, err);
      actualProvider = 'wasm';
      session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    }

    const initTimeMs = performance.now() - t0Init;
    this.sessions.set(backend, session);

    const telemetry: ModelLoadTelemetry = {
      loadTimeMs: this.loadTimeMs,
      initTimeMs,
      modelSizeBytes: buffer.byteLength,
      executionProvider: actualProvider,
      backendRequested: backend,
    };
    this.telemetries.set(backend, telemetry);

    console.log(`[ONNX Web] Session initialized for backend "${backend}" (actual: ${actualProvider}) in ${initTimeMs.toFixed(1)} ms.`);
    return session;
  }

  /**
   * Initializes the session for the default or active backend.
   */
  public async initSession(backend: ExecutionBackend = this.activeBackend): Promise<ModelLoadTelemetry> {
    this.activeBackend = backend;
    await this.getInferenceSession(backend);
    return this.telemetries.get(backend)!;
  }

  /**
   * Switches the active backend dynamically with graph recompilation/caching.
   */
  public async switchBackend(backend: ExecutionBackend): Promise<ModelLoadTelemetry> {
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
