import { describe, it, expect } from 'vitest';
import { WebSpeechEngine, type SpeechApi } from '../src/engines/web-speech.js';

// A fake utterance that lets the test fire the lifecycle callbacks.
class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(public text: string) {}
}

function fakeApi(voices: { voiceURI: string; name: string; lang: string }[]): {
  api: SpeechApi;
  spoken: FakeUtterance[];
  cancels: number;
} {
  const spoken: FakeUtterance[] = [];
  let cancels = 0;
  const api: SpeechApi = {
    getVoices: () => voices as unknown as SpeechSynthesisVoice[],
    cancel: () => {
      cancels++;
    },
    speak: (u) => {
      const fu = u as unknown as FakeUtterance;
      spoken.push(fu);
      // Simulate the browser: start then end on the next microtask.
      queueMicrotask(() => {
        fu.onstart?.();
        fu.onend?.();
      });
    },
    makeUtterance: (t) => new FakeUtterance(t) as unknown as SpeechSynthesisUtterance,
  };
  return { api, spoken, get cancels() { return cancels; } };
}

const VOICES = [
  { voiceURI: 'pt1', name: 'Maria', lang: 'pt-BR' },
  { voiceURI: 'en1', name: 'Alex', lang: 'en-US' },
];

describe('WebSpeechEngine', () => {
  it('is a native, always-loaded fallback', () => {
    const { api } = fakeApi(VOICES);
    const e = new WebSpeechEngine(api);
    expect(e.meta).toEqual({ id: 'webspeech', label: 'Web Speech', kind: 'fallback' });
    expect(e.isLoaded()).toBe(true);
  });

  it('lists voices, filterable by language', () => {
    const { api } = fakeApi(VOICES);
    const e = new WebSpeechEngine(api);
    expect(e.listVoices('pt')).toEqual([{ id: 'pt1', label: 'Maria (pt-BR)', lang: 'pt' }]);
    expect(e.listVoices().length).toBe(2);
  });

  it('speaks: sets lang/rate/voice, cancels prior speech, resolves with metrics', async () => {
    const bag = fakeApi(VOICES);
    const e = new WebSpeechEngine(bag.api);
    const metrics = await e.speak({ text: 'olá', lang: 'pt', voiceId: 'pt1', rate: 0.9 });
    expect(bag.spoken).toHaveLength(1);
    const u = bag.spoken[0]!;
    expect(u.lang).toBe('pt-BR');
    expect(u.rate).toBe(0.9);
    expect((u.voice as { voiceURI: string }).voiceURI).toBe('pt1');
    expect(bag.cancels).toBe(1);
    expect(typeof metrics.synthMs).toBe('number');
  });

  it('rejects on an utterance error', async () => {
    const { api } = fakeApi(VOICES);
    // Override speak to fire onerror instead.
    const erroring: SpeechApi = {
      ...api,
      speak: (u) => {
        const fu = u as unknown as FakeUtterance;
        queueMicrotask(() => fu.onerror?.({ error: 'synthesis-failed' }));
      },
    };
    const e = new WebSpeechEngine(erroring);
    await expect(e.speak({ text: 'x', lang: 'en', rate: 1 })).rejects.toThrow('synthesis-failed');
  });
});
