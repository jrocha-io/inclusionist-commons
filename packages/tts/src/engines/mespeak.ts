import type { EngineMeta, Lang, SynthMetrics, SynthRequest, TtsEngine, Voice } from '../port.js';

/** The subset of the meSpeak (eSpeak-NG WASM) API this adapter uses — injected so it is testable. */
export interface MeSpeakApi {
  loadConfig(config: unknown): void;
  loadVoice(voiceData: unknown): void;
  /** Synchronous synthesis; with rawdata:'data-url' returns a WAV data URL (or falsy on failure). */
  speak(text: string, opts: { rawdata: 'data-url'; speed?: number }): string | false | null | undefined;
}

/** A per-language meSpeak voice: an id + the parsed voice JSON. */
export interface MeSpeakVoice {
  readonly id: string;
  readonly data: unknown;
}

export interface MeSpeakEngineDeps {
  readonly meSpeak: MeSpeakApi;
  readonly config: unknown;
  readonly voices: Partial<Record<Lang, MeSpeakVoice>>;
  /** Plays a WAV data URL; defaults to an <audio> element. Injected for testability. */
  readonly playUrl?: (url: string) => Promise<void>;
}

/** Base words-per-minute; scaled by the request rate (1.0 → ~175 wpm, eSpeak's default). */
const BASE_WPM = 175;

/** eSpeak NG (meSpeak WASM) engine — a zero-network fallback. Plays the WAV meSpeak returns. */
export class MeSpeakEngine implements TtsEngine {
  readonly meta: EngineMeta = { id: 'espeak', label: 'eSpeak NG', kind: 'fallback' };
  readonly #api: MeSpeakApi;
  readonly #voices: Partial<Record<Lang, MeSpeakVoice>>;
  readonly #playUrl: (url: string) => Promise<void>;
  readonly #loaded = new Set<Lang>();

  constructor(deps: MeSpeakEngineDeps) {
    this.#api = deps.meSpeak;
    this.#voices = deps.voices;
    this.#playUrl = deps.playUrl ?? defaultPlayUrl;
    this.#api.loadConfig(deps.config);
  }

  listVoices(lang?: Lang): readonly Voice[] {
    const langs = (Object.keys(this.#voices) as Lang[]).filter((l) => (lang ? l === lang : true));
    return langs.map((l) => ({ id: l, label: `eSpeak ${l}`, lang: l }));
  }

  isLoaded(voiceId: string): boolean {
    return this.#loaded.has(voiceId as Lang);
  }

  load(voiceId: string): Promise<void> {
    this.#ensureVoice(voiceId as Lang);
    return Promise.resolve();
  }

  async speak(req: SynthRequest): Promise<SynthMetrics> {
    this.#ensureVoice(req.lang);
    const t0 = nowMs();
    const url = this.#api.speak(req.text, { rawdata: 'data-url', speed: Math.round(BASE_WPM * req.rate) });
    const synthMs = nowMs() - t0;
    if (!url) throw new Error('meSpeak returned no audio');
    await this.#playUrl(url);
    return { synthMs };
  }

  #ensureVoice(lang: Lang): void {
    if (this.#loaded.has(lang)) return;
    const voice = this.#voices[lang];
    if (!voice) throw new Error(`no eSpeak voice for "${lang}"`);
    this.#api.loadVoice(voice.data);
    this.#loaded.add(lang);
  }
}

function defaultPlayUrl(url: string): Promise<void> {
  return new Audio(url).play();
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
