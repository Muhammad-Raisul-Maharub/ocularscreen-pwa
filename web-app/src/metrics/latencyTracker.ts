export interface LatencyRecord {
  id: string;
  timestamp: string;
  tLoadMs?: number;
  tInitMs?: number;
  tPreprocessMs: number;
  tInferenceMs: number;
  tPostprocessMs: number;
  tE2EMs: number;
  isColdRun: boolean;
  provider: string;
}

class LatencyTracker {
  private history: LatencyRecord[] = [];
  private coldInferenceRecorded = false;
  private coldInferenceMs: number | null = null;
  private warmInferences: number[] = [];

  public recordRun(record: Omit<LatencyRecord, 'id' | 'timestamp'>): LatencyRecord {
    const fullRecord: LatencyRecord = {
      ...record,
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (record.isColdRun && !this.coldInferenceRecorded) {
      this.coldInferenceRecorded = true;
      this.coldInferenceMs = record.tInferenceMs;
    } else {
      this.warmInferences.push(record.tInferenceMs);
    }

    this.history.unshift(fullRecord);
    // Keep max 50 items in memory
    if (this.history.length > 50) {
      this.history.pop();
    }

    return fullRecord;
  }

  public getHistory(): LatencyRecord[] {
    return [...this.history];
  }

  public getLatest(): LatencyRecord | null {
    return this.history[0] || null;
  }

  public getSummary() {
    const warmCount = this.warmInferences.length;
    const avgWarm = warmCount > 0 
      ? this.warmInferences.reduce((a, b) => a + b, 0) / warmCount 
      : null;

    return {
      coldInferenceMs: this.coldInferenceMs,
      avgWarmInferenceMs: avgWarm,
      warmRunCount: warmCount,
      totalRuns: this.history.length,
    };
  }

  public clearHistory(): void {
    this.history = [];
    this.warmInferences = [];
  }
}

export const latencyTracker = new LatencyTracker();
