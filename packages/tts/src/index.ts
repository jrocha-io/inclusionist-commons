// @jrocha-io/tts — public surface.
// Stage 0 ships the PORT (the seam that decouples UI from engines). Adapters — WebSpeech, eSpeak-NG,
// sherpa-onnx-wasm, Kokoro-WebGPU — and the voice catalogs land in later stages (see the migration plan
// in the-inclusionist: docs/5-Refactoring/plano-tts-lab-modularizacao.md).

/** Languages the labs/game speak. Literacy content is per-language; UI/samples are these three. */
export type Lang = 'pt' | 'en' | 'es';

/** A selectable voice within an engine. */
export interface Voice {
  readonly id: string;
  readonly label: string;
  readonly lang: Lang;
}

/** One synthesis request. `rate` is a playback/speed factor (≈0.5..1.3). */
export interface SynthRequest {
  readonly text: string;
  readonly lang: Lang;
  readonly voiceId?: string;
  readonly rate: number;
}

/**
 * Metrics of one synthesis. Neural engines report `rtf` (synthMs / audio duration; <1 = faster than
 * real time); fallbacks (Web Speech / eSpeak) that play as they synthesize report only `synthMs`
 * (time to first audio).
 */
export interface SynthMetrics {
  readonly synthMs: number;
  readonly audioSec?: number;
  readonly rtf?: number;
}

export type EngineKind = 'fallback' | 'neural';

export interface EngineMeta {
  readonly id: string;
  readonly label: string;
  readonly kind: EngineKind;
}

/**
 * A text-to-speech engine. The implementation is responsible for PRODUCING audio (via an injected
 * AudioPlayer for PCM engines, or the platform for Web Speech) — the UI only calls `speak` and reads
 * back metrics. This is the port every adapter implements and the ONLY type the UI depends on.
 */
export interface TtsEngine {
  readonly meta: EngineMeta;
  /** Voices this engine offers, optionally filtered by language. */
  listVoices(lang?: Lang): readonly Voice[];
  /** True if `voiceId` is loaded and ready to speak without a fetch/init. */
  isLoaded(voiceId: string): boolean;
  /** Load/prepare a voice (idempotent). `onProgress` reports 0..1 for engines that download weights. */
  load(voiceId: string, onProgress?: (frac: number) => void): Promise<void>;
  /** Synthesize + play `req`; resolves with the metrics of that synthesis. */
  speak(req: SynthRequest): Promise<SynthMetrics>;
}

/** Package version marker (bumped by Changesets on release). */
export const VERSION = '0.0.0';
