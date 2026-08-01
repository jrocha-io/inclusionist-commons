import { describe, it, expect } from 'vitest';
import {
  PIPER_MODELS,
  KOKORO,
  KOKORO_VOICES,
  isHigh,
  groupPiperByLocale,
  hfUrl,
} from '../src/catalog.js';

describe('isHigh', () => {
  it('is true only for -high models', () => {
    expect(isHigh('pt_BR-miro-high')).toBe(true);
    expect(isHigh('pt_BR-faber-medium')).toBe(false);
  });
});

describe('groupPiperByLocale', () => {
  it('keeps only high models when wantHigh=true', () => {
    const groups = groupPiperByLocale(true);
    for (const g of groups) for (const o of g.options) expect(o.value.endsWith('-high')).toBe(true);
  });
  it('keeps only medium models when wantHigh=false', () => {
    const groups = groupPiperByLocale(false);
    for (const g of groups) for (const o of g.options) expect(o.value.endsWith('-high')).toBe(false);
  });
  it('drops locales with no matching model (es_AR has only a high voice)', () => {
    const mediumLocales = groupPiperByLocale(false).map((g) => g.locale);
    expect(mediumLocales).not.toContain('es_AR');
    const highLocales = groupPiperByLocale(true).map((g) => g.locale);
    expect(highLocales).toContain('es_AR');
  });
  it('labels an option with the model id minus the "<locale>-" prefix', () => {
    const ptBr = groupPiperByLocale(false).find((g) => g.locale === 'pt_BR');
    expect(ptBr?.options[0]).toEqual({ value: 'pt_BR-faber-medium', label: 'faber-medium' });
  });
  it('tags each group with its UI language', () => {
    const g = groupPiperByLocale(true).find((x) => x.locale === 'pt_BR');
    expect(g?.lang).toBe('pt');
  });
  it('covers every model exactly once across high+medium', () => {
    const grouped = [...groupPiperByLocale(true), ...groupPiperByLocale(false)]
      .flatMap((g) => g.options.map((o) => o.value))
      .sort();
    const all = Object.values(PIPER_MODELS).flat().sort();
    expect(grouped).toEqual(all);
  });
});

describe('KOKORO catalog', () => {
  it('exposes only the fp32 variant (int8 was dropped)', () => {
    expect(Object.keys(KOKORO)).toEqual(['fp32']);
    expect(KOKORO.fp32).toEqual({ repo: 'kokoro-multi-lang-v1_0', file: 'model.onnx' });
  });
  it('keeps the verified sids for pt-BR voices', () => {
    const pt = KOKORO_VOICES.find((g) => g.label === 'pt-BR');
    const dora = pt?.voices.find((v) => v.name === 'pf_dora');
    expect(dora).toEqual({ name: 'pf_dora', sid: 42, espeakLang: 'pt-br', lang: 'pt' });
  });
});

describe('hfUrl', () => {
  it('builds the resolve/main URL', () => {
    expect(hfUrl('vits-piper-pt_BR-faber-medium', 'tokens.txt')).toBe(
      'https://huggingface.co/csukuangfj/vits-piper-pt_BR-faber-medium/resolve/main/tokens.txt',
    );
  });
});
