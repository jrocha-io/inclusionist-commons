import { describe, it, expect } from 'vitest';
import { peakOf, gainFromPeak, toFloat32 } from '../src/normalize.js';

describe('peakOf', () => {
  it('finds the max absolute amplitude', () => {
    expect(peakOf([0, 0.2, -0.7, 0.5])).toBeCloseTo(0.7);
  });
  it('is 0 for an empty buffer', () => {
    expect(peakOf([])).toBe(0);
  });
});

describe('gainFromPeak', () => {
  it('normalizes toward 0.9 headroom when below the cap', () => {
    expect(gainFromPeak(1)).toBeCloseTo(0.9);
    expect(gainFromPeak(0.75)).toBeCloseTo(1.2);
  });
  it('caps the gain at 1.4 (avoids amplifying the noise floor)', () => {
    expect(gainFromPeak(0.1)).toBe(1.4);
    expect(gainFromPeak(0.45)).toBe(1.4);
  });
  it('returns 1 for silence (no divide-by-zero blow-up)', () => {
    expect(gainFromPeak(0)).toBe(1);
    expect(gainFromPeak(0.00005)).toBe(1);
  });
});

describe('toFloat32', () => {
  it('passes a Float32Array through unchanged', () => {
    const f = new Float32Array([0.1, -0.2]);
    expect(toFloat32(f)).toBe(f);
  });
  it('scales Int16 PCM into [-1, 1)', () => {
    const out = toFloat32(new Int16Array([0, 16384, -32768]));
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(0.5);
    expect(out[2]).toBeCloseTo(-1);
  });
});
