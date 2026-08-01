// PCM normalization math (pure). Canonical home for peak/gain — the WebAudioPlayer applies it; any
// engine that hands back raw PCM gets consistent, hiss-safe loudness.

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

/** Coerce Int16 PCM to Float32 in [-1, 1); passes Float32Array through unchanged. */
export function toFloat32(samples: Float32Array | Int16Array): Float32Array {
  if (samples instanceof Int16Array) {
    const out = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) out[i] = (samples[i] ?? 0) / 32768;
    return out;
  }
  return samples;
}
