import { peakOf, gainFromPeak, toFloat32 } from './normalize.js';

/** Plays raw PCM. `warm()` is called on a user gesture so a later long synthesis doesn't lose the gesture. */
export interface AudioPlayer {
  /** Prepare/resume the audio output on a user gesture (before a long synthesis). */
  warm(): void;
  /** Play a PCM buffer at `sampleRate`, normalized. */
  play(samples: Float32Array | Int16Array, sampleRate: number): void;
}

/**
 * WebAudio player with a SINGLE persistent AudioContext. A neural synthesis can block ~10s; creating a
 * fresh context afterward would find the click gesture "expired" and the browser would block the audio
 * (autoplay policy) — that was the "green but no sound". So we keep one context, warmed on the gesture.
 */
export class WebAudioPlayer implements AudioPlayer {
  #ctx: AudioContext | null = null;

  #ac(): AudioContext {
    if (!this.#ctx) {
      const Ctor: typeof AudioContext =
        globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.#ctx = new Ctor();
    }
    if (this.#ctx.state === 'suspended') void this.#ctx.resume();
    return this.#ctx;
  }

  warm(): void {
    this.#ac();
  }

  play(samples: Float32Array | Int16Array, sampleRate: number): void {
    const pcm = toFloat32(samples);
    const gain = gainFromPeak(peakOf(pcm));
    const ac = this.#ac();
    const buf = ac.createBuffer(1, pcm.length, sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = (pcm[i] ?? 0) * gain;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start();
  }
}
