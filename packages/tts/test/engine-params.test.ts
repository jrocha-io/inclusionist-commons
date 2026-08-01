import { describe, it, expect } from 'vitest';
import {
  ENGINE_MULTI,
  ENGINE_SINGLE,
  engineParamsFor,
  isMultiThread,
  parseEngineParams,
} from '../src/engine-params.js';

describe('engineParamsFor', () => {
  it('multi-thread → pthread build + 4 threads', () => {
    expect(engineParamsFor(true)).toEqual({ engine: ENGINE_MULTI, threads: 4 });
  });
  it('single-thread → single build + 1 thread', () => {
    expect(engineParamsFor(false)).toEqual({ engine: ENGINE_SINGLE, threads: 1 });
  });
});

describe('isMultiThread', () => {
  it('is true only for the pthread build id', () => {
    expect(isMultiThread('tts')).toBe(true);
    expect(isMultiThread('tts-single-thread')).toBe(false);
  });
});

describe('parseEngineParams', () => {
  it('defaults to single-thread, 1 thread', () => {
    expect(parseEngineParams('')).toEqual({ engine: ENGINE_SINGLE, threads: 1, multiThread: false });
  });
  it('reads engine + threads and derives multiThread', () => {
    expect(parseEngineParams('?engine=tts&threads=4')).toEqual({
      engine: 'tts',
      threads: 4,
      multiThread: true,
    });
  });
  it('clamps threads to at least 1 and tolerates garbage', () => {
    expect(parseEngineParams('?threads=0').threads).toBe(1);
    expect(parseEngineParams('?threads=-3').threads).toBe(1);
    expect(parseEngineParams('?threads=abc').threads).toBe(1);
  });
});
