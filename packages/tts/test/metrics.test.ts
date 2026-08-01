import { describe, it, expect } from 'vitest';
import { computeRtf } from '../src/metrics.js';

describe('computeRtf', () => {
  it('is synthMs/1000 over audioSec', () => {
    expect(computeRtf(500, 2)).toBeCloseTo(0.25);
    expect(computeRtf(3000, 1.5)).toBeCloseTo(2);
  });
  it('returns Infinity for non-positive duration (guards divide-by-zero)', () => {
    expect(computeRtf(100, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});
