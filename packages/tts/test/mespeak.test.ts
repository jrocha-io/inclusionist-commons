import { describe, it, expect } from 'vitest';
import { MeSpeakEngine, type MeSpeakApi } from '../src/engines/mespeak.js';

function fakeApi(speakReturn: string | false = 'data:audio/wav;base64,AAAA') {
  const calls = { config: 0, voices: [] as unknown[], speaks: [] as { text: string; speed?: number }[] };
  const api: MeSpeakApi = {
    loadConfig: () => {
      calls.config++;
    },
    loadVoice: (v) => {
      calls.voices.push(v);
    },
    speak: (text, opts) => {
      calls.speaks.push({ text, speed: opts.speed });
      return speakReturn;
    },
  };
  return { api, calls };
}

const VOICES = {
  pt: { id: 'pt', data: { name: 'pt-data' } },
  en: { id: 'en', data: { name: 'en-data' } },
};

function make(speakReturn: string | false = 'data:audio/wav;base64,AAAA') {
  const { api, calls } = fakeApi(speakReturn);
  const played: string[] = [];
  const engine = new MeSpeakEngine({
    meSpeak: api,
    config: { cfg: true },
    voices: VOICES,
    playUrl: (u) => {
      played.push(u);
      return Promise.resolve();
    },
  });
  return { engine, calls, played };
}

describe('MeSpeakEngine', () => {
  it('loads config once on construction and is a fallback', () => {
    const { engine, calls } = make();
    expect(calls.config).toBe(1);
    expect(engine.meta).toEqual({ id: 'espeak', label: 'eSpeak NG', kind: 'fallback' });
  });

  it('lists one voice per configured language', () => {
    const { engine } = make();
    expect(engine.listVoices()).toEqual([
      { id: 'pt', label: 'eSpeak pt', lang: 'pt' },
      { id: 'en', label: 'eSpeak en', lang: 'en' },
    ]);
    expect(engine.listVoices('pt')).toEqual([{ id: 'pt', label: 'eSpeak pt', lang: 'pt' }]);
  });

  it('lazy-loads a voice once, then reuses it', async () => {
    const { engine, calls } = make();
    expect(engine.isLoaded('pt')).toBe(false);
    await engine.speak({ text: 'olá', lang: 'pt', rate: 1 });
    await engine.speak({ text: 'oi', lang: 'pt', rate: 1 });
    expect(calls.voices).toHaveLength(1); // loaded once, reused
    expect(engine.isLoaded('pt')).toBe(true);
  });

  it('scales speed by the rate and plays the returned WAV url', async () => {
    const { engine, calls, played } = make();
    const m = await engine.speak({ text: 'hi', lang: 'en', rate: 0.8 });
    expect(calls.speaks[0]).toEqual({ text: 'hi', speed: Math.round(175 * 0.8) }); // 140
    expect(played).toEqual(['data:audio/wav;base64,AAAA']);
    expect(typeof m.synthMs).toBe('number');
  });

  it('throws when meSpeak returns no audio', async () => {
    const { engine } = make(false);
    await expect(engine.speak({ text: 'x', lang: 'pt', rate: 1 })).rejects.toThrow('no audio');
  });

  it('throws for a language with no voice', async () => {
    const { api } = fakeApi();
    const engine = new MeSpeakEngine({ meSpeak: api, config: {}, voices: { pt: VOICES.pt }, playUrl: () => Promise.resolve() });
    await expect(engine.speak({ text: 'x', lang: 'es', rate: 1 })).rejects.toThrow('no eSpeak voice');
  });
});
