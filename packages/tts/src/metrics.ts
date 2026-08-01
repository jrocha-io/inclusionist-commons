// Pure synthesis metrics + audio normalization math (shared by every PCM engine adapter and the UI).

/** Real-time factor: synthesis time ÷ audio duration. <1 = faster than real time. */
export function computeRtf(synthMs: number, audioSec: number): number {
  if (audioSec <= 0) return Number.POSITIVE_INFINITY;
  return synthMs / 1000 / audioSec;
}

/** Peak absolute amplitude of a PCM buffer (0..~1 for float PCM). */
export function peakOf(samples: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i] ?? 0);
    if (a > peak) peak = a;
  }
  return peak;
}

/**
 * Normalization gain from a peak. Capped LOW (1.4×): a 4× gain amplified the noise floor of the "high"
 * Piper models into an "AM-radio" hiss. Silence (peak≈0) → gain 1 (no divide-by-zero blow-up).
 */
export function gainFromPeak(peak: number): number {
  return peak > 0.0001 ? Math.min(1.4, 0.9 / peak) : 1;
}
