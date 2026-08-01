import { describe, it, expect } from 'vitest';
import { langOf, BCP47 } from '../src/lang.js';

describe('langOf', () => {
  it('maps pt locales to pt', () => {
    expect(langOf('pt_BR')).toBe('pt');
    expect(langOf('pt-PT')).toBe('pt');
  });
  it('maps es locales to es', () => {
    expect(langOf('es_AR')).toBe('es');
    expect(langOf('es-MX')).toBe('es');
  });
  it('maps en locales to en', () => {
    expect(langOf('en_US')).toBe('en');
    expect(langOf('en-GB')).toBe('en');
  });
  it('defaults unknown prefixes to en', () => {
    expect(langOf('fr_FR')).toBe('en');
    expect(langOf('')).toBe('en');
  });
  it('is case-insensitive', () => {
    expect(langOf('PT_br')).toBe('pt');
  });
});

describe('BCP47', () => {
  it('has one tag per language', () => {
    expect(BCP47).toEqual({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' });
  });
});
