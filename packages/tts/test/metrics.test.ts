import { describe, it, expect } from 'vitest';
import { computeRtf, peakOf, gainFromPeak } from '../src/metrics.js';

describe('computeRtf', () => {
  it('is synthMs/1000 over audioSec', () => {
    expect(computeRtf(500, 2)).toBeCloseTo(0.25);
    expect(computeRtf(3000, 1.5)).toBeCloseTo(2);
  });
  it('returns Infinity for non-positive duration (guards divide-by-zero)', () => {
    expect(computeRtf(100, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

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
    expect(gainFromPeak(1)).toBeCloseTo(0.9); // 0.9/1 = 0.9
  });
  it('caps the gain at 1.4 (avoids amplifying the noise floor)', () => {
    expect(gainFromPeak(0.1)).toBe(1.4); // 0.9/0.1 = 9 → capped
    expect(gainFromPeak(0.45)).toBe(1.4); // 0.9/0.45 = 2 → capped
  });
  it('returns 1 for silence (no divide-by-zero blow-up)', () => {
    expect(gainFromPeak(0)).toBe(1);
    expect(gainFromPeak(0.00005)).toBe(1);
  });
  it('passes through gains at or below the cap', () => {
    expect(gainFromPeak(0.9)).toBeCloseTo(1); // 0.9/0.9 = 1
    expect(gainFromPeak(0.75)).toBeCloseTo(1.2); // 0.9/0.75 = 1.2 (< 1.4)
  });
});
