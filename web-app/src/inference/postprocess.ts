import { CANONICAL_BENCHMARK_CONFIG } from './config';

export interface ScreeningResult {
  logit: number;
  score: number; // p(x) in [0, 1]
  threshold: number; // TAU_STAR = 0.4970010817050934
  isPositive: boolean; // p(x) >= TAU_STAR
  scoreLabel: string; // "Screening Score: 0.XX"
  title: string;
  clinicalReferral: string;
  clinicalAction: string;
  recommendation: string;
  triageLevel: 'referral_indicated' | 'routine_monitoring';
}

/**
 * Numerically stable sigmoid function:
 * p(x) = 1 / (1 + e^(-z))
 */
export function numericallyStableSigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  } else {
    const ez = Math.exp(z);
    return ez / (1 + ez);
  }
}

/**
 * Canonical 96.33% postprocessing & output evaluation.
 * 
 * Clinical Presentation Rule:
 * Value is strictly rendered as "Screening Score: 0.XX".
 * Never displays probabilistic terms like "XX% Probability" or "XX% Confidence".
 */
export function evaluatePrediction(rawLogit: number): ScreeningResult {
  const score = numericallyStableSigmoid(rawLogit);
  const threshold = CANONICAL_BENCHMARK_CONFIG.TAU_STAR;
  const isPositive = score >= threshold;

  // Format as "Screening Score: 0.XX" (4 decimal precision, e.g. 0.8682)
  const scoreLabel = `Screening Score: ${score.toFixed(4)}`;

  if (isPositive) {
    return {
      logit: rawLogit,
      score,
      threshold,
      isPositive: true,
      scoreLabel,
      title: CANONICAL_BENCHMARK_CONFIG.messages.positiveTitle,
      clinicalReferral: CANONICAL_BENCHMARK_CONFIG.messages.positiveReferral,
      clinicalAction: CANONICAL_BENCHMARK_CONFIG.messages.positiveAction,
      recommendation: CANONICAL_BENCHMARK_CONFIG.messages.positiveAction,
      triageLevel: 'referral_indicated',
    };
  } else {
    return {
      logit: rawLogit,
      score,
      threshold,
      isPositive: false,
      scoreLabel,
      title: CANONICAL_BENCHMARK_CONFIG.messages.negativeTitle,
      clinicalReferral: CANONICAL_BENCHMARK_CONFIG.messages.negativeReferral,
      clinicalAction: CANONICAL_BENCHMARK_CONFIG.messages.negativeAction,
      recommendation: CANONICAL_BENCHMARK_CONFIG.messages.negativeAction,
      triageLevel: 'routine_monitoring',
    };
  }
}
