import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebAudioPlayer } from '../src/player.js';

// Minimal fake WebAudio, enough to observe what WebAudioPlayer does.
class FakeBuffer {
  data: Float32Array;
  constructor(public channels: number, public length: number, public rate: number) {
    this.data = new Float32Array(length);
  }
  getChannelData(): Float32Array {
    return this.data;
  }
}
class FakeSource {
  buffer: FakeBuffer | null = null;
  connected = false;
  started = false;
  connect(): void {
    this.connected = true;
  }
  start(): void {
    this.started = true;
  }
}
class FakeAudioContext {
  static instances = 0;
  static last: FakeAudioContext | null = null;
  state: 'suspended' | 'running' = 'suspended';
  destination = {};
  lastSource: FakeSource | null = null;
  resumeCalls = 0;
  constructor() {
    FakeAudioContext.instances++;
    FakeAudioContext.last = this;
  }
  resume(): Promise<void> {
    this.resumeCalls++;
    this.state = 'running';
    return Promise.resolve();
  }
  createBuffer(channels: number, length: number, rate: number): FakeBuffer {
    return new FakeBuffer(channels, length, rate);
  }
  createBufferSource(): FakeSource {
    this.lastSource = new FakeSource();
    return this.lastSource;
  }
}

beforeEach(() => {
  FakeAudioContext.instances = 0;
  FakeAudioContext.last = null;
  vi.stubGlobal('AudioContext', FakeAudioContext as unknown as typeof AudioContext);
});

describe('WebAudioPlayer', () => {
  it('creates exactly one AudioContext across warm() + many play() calls', () => {
    const p = new WebAudioPlayer();
    p.warm();
    p.play(new Float32Array([0.5, -0.5]), 24000);
    p.play(new Float32Array([0.1]), 24000);
    expect(FakeAudioContext.instances).toBe(1);
  });

  it('resumes a suspended context (autoplay-policy recovery)', () => {
    const p = new WebAudioPlayer();
    p.warm();
    expect(FakeAudioContext.last?.resumeCalls).toBeGreaterThanOrEqual(1);
    expect(FakeAudioContext.last?.state).toBe('running');
  });

  it('applies the capped normalization gain and connects + starts a source', () => {
    const p = new WebAudioPlayer();
    // peak 0.45 → gain capped at 1.4; sample 0.45 * 1.4 = 0.63
    p.play(new Float32Array([0.45, -0.45]), 24000);
    const src = FakeAudioContext.last?.lastSource;
    expect(src?.connected).toBe(true);
    expect(src?.started).toBe(true);
    expect(src?.buffer?.rate).toBe(24000);
    expect(src?.buffer?.data[0]).toBeCloseTo(0.63); // 0.45 * 1.4
    expect(src?.buffer?.data[1]).toBeCloseTo(-0.63);
  });

  it('coerces Int16 PCM before playing', () => {
    const p = new WebAudioPlayer();
    p.play(new Int16Array([16384]), 16000); // 16384/32768 = 0.5, peak 0.5 → gain 1.4 → 0.7
    const src = FakeAudioContext.last?.lastSource;
    expect(src?.buffer?.data[0]).toBeCloseTo(0.7);
    expect(src?.buffer?.rate).toBe(16000);
  });
});
