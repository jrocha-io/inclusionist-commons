import type { EngineMeta, Lang, SynthMetrics, SynthRequest, TtsEngine, Voice } from '../port.js';
import { BCP47, langOf } from '../lang.js';

/** The subset of the Web Speech API this adapter needs — injectable so it is testable off-browser. */
export interface SpeechApi {
  getVoices(): SpeechSynthesisVoice[];
  cancel(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
  makeUtterance(text: string): SpeechSynthesisUtterance;
}

/** Default SpeechApi backed by the platform `speechSynthesis`. Throws if the browser has none. */
export function platformSpeechApi(): SpeechApi {
  const ss = globalThis.speechSynthesis;
  if (!ss) throw new Error('Web Speech unavailable in this browser');
  return {
    getVoices: () => ss.getVoices(),
    cancel: () => ss.cancel(),
    speak: (u) => ss.speak(u),
    makeUtterance: (t) => new SpeechSynthesisUtterance(t),
  };
}

/** Web Speech (OS-native) engine — zero download; a fallback. Plays via the platform, so no AudioPlayer. */
export class WebSpeechEngine implements TtsEngine {
  readonly meta: EngineMeta = { id: 'webspeech', label: 'Web Speech', kind: 'fallback' };
  constructor(private readonly api: SpeechApi) {}

  listVoices(lang?: Lang): readonly Voice[] {
    return this.api
      .getVoices()
      .filter((v) => (lang ? langOf(v.lang) === lang : true))
      .map((v) => ({ id: v.voiceURI, label: `${v.name} (${v.lang})`, lang: langOf(v.lang) }));
  }

  isLoaded(): boolean {
    return true; // native — nothing to load
  }

  load(): Promise<void> {
    return Promise.resolve();
  }

  speak(req: SynthRequest): Promise<SynthMetrics> {
    return new Promise<SynthMetrics>((resolve, reject) => {
      this.api.cancel();
      const u = this.api.makeUtterance(req.text);
      u.lang = BCP47[req.lang];
      u.rate = req.rate;
      const chosen = req.voiceId
        ? this.api.getVoices().find((v) => v.voiceURI === req.voiceId)
        : undefined;
      if (chosen) u.voice = chosen;
      const t0 = nowMs();
      let synthMs = 0;
      u.onstart = () => {
        synthMs = nowMs() - t0;
      };
      u.onend = () => resolve({ synthMs: synthMs || nowMs() - t0 });
      u.onerror = (e) => reject(new Error(String((e as SpeechSynthesisErrorEvent).error ?? 'web speech error')));
      this.api.speak(u);
    });
  }
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
