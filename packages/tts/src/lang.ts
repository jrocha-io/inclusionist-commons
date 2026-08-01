import type { Lang } from './port.js';

/** Map any locale/prefix (e.g. "pt_BR", "es-AR", "en-us") to one of the three UI languages. */
export function langOf(localeOrPrefix: string): Lang {
  const p = localeOrPrefix.slice(0, 2).toLowerCase();
  return p === 'pt' ? 'pt' : p === 'es' ? 'es' : 'en';
}

/** BCP-47 tag used for Web Speech utterances, one per UI language. */
export const BCP47: Readonly<Record<Lang, string>> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};
